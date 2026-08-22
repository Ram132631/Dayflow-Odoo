import { Router } from "express";
import { db } from "../lib/db";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { payrollUpsertSchema } from "../lib/validations";
import { createNotification } from "../lib/notifications";

export const payrollRouter = Router();
payrollRouter.use(requireAuth);

payrollRouter.get("/me", async (req, res) => {
  const employeeId = req.user!.employeeRecordId;
  if (!employeeId) return res.status(404).json({ error: "No employee profile found for this account." });

  const payrolls = await db.payroll.findMany({ where: { employeeId }, orderBy: { effectiveDate: "desc" } });
  res.json({ payrolls });
});

// Admin: GET /api/payroll
payrollRouter.get("/", requireAdmin, async (_req, res) => {
  const employees = await db.employee.findMany({
    include: {
      payrolls: { orderBy: { effectiveDate: "desc" }, take: 1 },
      user: { select: { employeeId: true } },
    },
    orderBy: { name: "asc" },
  });
  res.json({ employees });
});

// Admin: POST /api/payroll  (create a new payroll record — salary revision)
payrollRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = payrollUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
  }

  const { employeeId, basicSalary, allowances, deductions, effectiveDate } = parsed.data;
  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return res.status(404).json({ error: "Employee not found." });

  const netSalary = basicSalary + allowances - deductions;

  const payroll = await db.$transaction(async (tx) => {
    const created = await tx.payroll.create({
      data: { employeeId, basicSalary, allowances, deductions, netSalary, effectiveDate },
    });
    await createNotification(
      employee.userId,
      "Payroll updated",
      `Your salary structure was updated, effective ${effectiveDate.toDateString()}.`,
      tx
    );
    return created;
  });

  res.status(201).json({ payroll });
});
