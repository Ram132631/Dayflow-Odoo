import { Router } from "express";
import { db } from "../lib/db";
import { requireAuth } from "../middleware/auth.middleware";
import { profileUpdateSchema, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "../lib/validations";
import { upload, saveUploadedFile, validateFile } from "../lib/upload";

export const profileRouter = Router();

profileRouter.use(requireAuth);

async function getOwnEmployeeOr404(req: import("express").Request, res: import("express").Response) {
  const id = req.user!.employeeRecordId;
  if (!id) {
    res.status(404).json({ error: "No employee profile found for this account." });
    return null;
  }
  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) {
    res.status(404).json({ error: "No employee profile found for this account." });
    return null;
  }
  return employee;
}

profileRouter.get("/me", async (req, res) => {
  const employee = await getOwnEmployeeOr404(req, res);
  if (!employee) return;

  const [user, payrolls, documents] = await Promise.all([
    db.user.findUnique({ where: { id: req.user!.id }, select: { employeeId: true, email: true, role: true } }),
    db.payroll.findMany({ where: { employeeId: employee.id }, orderBy: { effectiveDate: "desc" } }),
    db.document.findMany({ where: { employeeId: employee.id }, orderBy: { createdAt: "desc" } }),
  ]);

  res.json({ employee, user, payrolls, documents });
});

profileRouter.patch("/me", async (req, res) => {
  // Employees may only edit phone/address — enforced here server-side
  // regardless of any other field a tampered client might send.
  const employee = await getOwnEmployeeOr404(req, res);
  if (!employee) return;

  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
  }

  await db.employee.update({
    where: { id: employee.id },
    data: { phone: parsed.data.phone || null, address: parsed.data.address || null },
  });

  res.json({ success: true });
});

profileRouter.post("/me/picture", upload.single("file"), async (req, res) => {
  const employee = await getOwnEmployeeOr404(req, res);
  if (!employee) return;
  if (!req.file) return res.status(400).json({ error: "No file provided." });

  const validation = validateFile(req.file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  if (!validation.ok) return res.status(400).json({ error: validation.error });

  const url = saveUploadedFile(req.file, `profile-pictures/${employee.id}`);
  await db.employee.update({ where: { id: employee.id }, data: { profilePicture: url } });

  res.json({ url });
});
