import { Router } from "express";
import { db } from "../lib/db";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";

export const attendanceRouter = Router();
attendanceRouter.use(requireAuth);

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function requireOwnEmployeeId(req: import("express").Request, res: import("express").Response): string | null {
  const id = req.user!.employeeRecordId;
  if (!id) {
    res.status(404).json({ error: "No employee profile found for this account." });
    return null;
  }
  return id;
}

// GET /api/attendance/me?range=week|month
attendanceRouter.get("/me", async (req, res) => {
  const employeeId = requireOwnEmployeeId(req, res);
  if (!employeeId) return;

  const range = req.query.range === "month" ? 30 : 7;
  const from = startOfToday();
  from.setDate(from.getDate() - range);

  const [today, records] = await Promise.all([
    db.attendance.findUnique({ where: { employeeId_date: { employeeId, date: startOfToday() } } }),
    db.attendance.findMany({ where: { employeeId, date: { gte: from } }, orderBy: { date: "desc" } }),
  ]);

  res.json({ today, records });
});

attendanceRouter.post("/check-in", async (req, res) => {
  const employeeId = requireOwnEmployeeId(req, res);
  if (!employeeId) return;

  const today = startOfToday();
  const existing = await db.attendance.findUnique({ where: { employeeId_date: { employeeId, date: today } } });

  if (existing?.checkIn) {
    return res.status(409).json({ error: "You have already checked in today." });
  }

  const record = existing
    ? await db.attendance.update({ where: { id: existing.id }, data: { checkIn: new Date(), status: "PRESENT" } })
    : await db.attendance.create({ data: { employeeId, date: today, checkIn: new Date(), status: "PRESENT" } });

  res.json({ record });
});

attendanceRouter.post("/check-out", async (req, res) => {
  const employeeId = requireOwnEmployeeId(req, res);
  if (!employeeId) return;

  const today = startOfToday();
  const existing = await db.attendance.findUnique({ where: { employeeId_date: { employeeId, date: today } } });

  if (!existing?.checkIn) {
    return res.status(409).json({ error: "You need to check in before checking out." });
  }
  if (existing.checkOut) {
    return res.status(409).json({ error: "You have already checked out today." });
  }

  const checkOut = new Date();
  const hoursWorked = (checkOut.getTime() - existing.checkIn.getTime()) / 3600000;

  const record = await db.attendance.update({
    where: { id: existing.id },
    data: { checkOut, status: hoursWorked < 4.5 ? "HALF_DAY" : "PRESENT" },
  });

  res.json({ record });
});

// Admin: GET /api/attendance?employeeId=&status=&from=&to=
attendanceRouter.get("/", requireAdmin, async (req, res) => {
  const { employeeId, status, from, to } = req.query as Record<string, string | undefined>;

  const where: import("@prisma/client").Prisma.AttendanceWhereInput = {};
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status as import("@prisma/client").AttendanceStatus;
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const records = await db.attendance.findMany({
    where,
    include: { employee: { select: { id: true, name: true, department: true, position: true } } },
    orderBy: { date: "desc" },
    take: 500,
  });

  res.json({ records });
});

// Admin: GET /api/attendance/stats/today
attendanceRouter.get("/stats/today", requireAdmin, async (_req, res) => {
  const today = startOfToday();
  const [totalEmployees, todaysRecords] = await Promise.all([
    db.employee.count(),
    db.attendance.findMany({ where: { date: today } }),
  ]);

  const present = todaysRecords.filter((r) => r.status === "PRESENT").length;
  const halfDay = todaysRecords.filter((r) => r.status === "HALF_DAY").length;
  const onLeave = todaysRecords.filter((r) => r.status === "LEAVE").length;
  const markedAbsent = todaysRecords.filter((r) => r.status === "ABSENT").length;
  const unmarked = totalEmployees - todaysRecords.length;

  res.json({
    totalEmployees,
    present,
    halfDay,
    onLeave,
    absent: markedAbsent + unmarked,
  });
});
