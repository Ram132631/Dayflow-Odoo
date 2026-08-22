import { Router } from "express";
import { db } from "../lib/db";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { leaveApplySchema, leaveDecisionSchema } from "../lib/validations";
import { notifyAdmins, createNotification } from "../lib/notifications";

export const leaveRouter = Router();
leaveRouter.use(requireAuth);

leaveRouter.get("/me", async (req, res) => {
  const employeeId = req.user!.employeeRecordId;
  if (!employeeId) return res.status(404).json({ error: "No employee profile found for this account." });

  const leaves = await db.leaveRequest.findMany({ where: { employeeId }, orderBy: { createdAt: "desc" } });
  res.json({ leaves });
});

leaveRouter.post("/", async (req, res) => {
  const employeeId = req.user!.employeeRecordId;
  if (!employeeId) return res.status(404).json({ error: "No employee profile found for this account." });

  const parsed = leaveApplySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
  }

  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  const { leaveType, startDate, endDate, remarks } = parsed.data;

  const leave = await db.$transaction(async (tx) => {
    const created = await tx.leaveRequest.create({
      data: { employeeId, leaveType, startDate, endDate, remarks: remarks || null, status: "PENDING" },
    });
    await notifyAdmins(
      "New leave request",
      `${employee?.name ?? "An employee"} submitted a ${leaveType.toLowerCase()} leave request.`,
      tx
    );
    return created;
  });

  res.status(201).json({ leave });
});

// Admin: GET /api/leave?status=
leaveRouter.get("/", requireAdmin, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  const leaves = await db.leaveRequest.findMany({
    where: status ? { status: status as import("@prisma/client").LeaveStatus } : {},
    include: {
      employee: { select: { id: true, name: true, department: true, user: { select: { employeeId: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ leaves });
});

// Admin: PATCH /api/leave/:id/decision
leaveRouter.patch("/:id/decision", requireAdmin, async (req, res) => {
  const parsed = leaveDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
  }

  const leave = await db.leaveRequest.findUnique({ where: { id: req.params.id }, include: { employee: true } });
  if (!leave) return res.status(404).json({ error: "Leave request not found." });
  if (leave.status !== "PENDING") {
    return res.status(409).json({ error: "This leave request has already been decided." });
  }

  const { decision, adminComment } = parsed.data;

  await db.$transaction(async (tx) => {
    await tx.leaveRequest.update({
      where: { id: leave.id },
      data: { status: decision, adminComment: adminComment || null, approvedBy: req.user!.id },
    });

    if (decision === "APPROVED") {
      const dates: Date[] = [];
      const cursor = new Date(leave.startDate);
      while (cursor <= leave.endDate) {
        dates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      for (const date of dates) {
        await tx.attendance.upsert({
          where: { employeeId_date: { employeeId: leave.employeeId, date } },
          create: { employeeId: leave.employeeId, date, status: "LEAVE" },
          update: { status: "LEAVE" },
        });
      }
    }

    await createNotification(
      leave.employee.userId,
      decision === "APPROVED" ? "Leave approved" : "Leave rejected",
      decision === "APPROVED"
        ? `Your ${leave.leaveType.toLowerCase()} leave request was approved.`
        : `Your ${leave.leaveType.toLowerCase()} leave request was rejected.${adminComment ? ` Reason: ${adminComment}` : ""}`,
      tx
    );
  });

  res.json({ success: true });
});
