import { Router } from "express";
import { db } from "../lib/db";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { employeeAdminUpdateSchema, ALLOWED_DOCUMENT_TYPES, ALLOWED_IMAGE_TYPES, MAX_DOCUMENT_SIZE, MAX_IMAGE_SIZE } from "../lib/validations";
import { upload, saveUploadedFile, validateFile } from "../lib/upload";

export const employeesRouter = Router();

employeesRouter.use(requireAuth, requireAdmin);

// GET /api/employees?search=&department=&status=
employeesRouter.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const department = typeof req.query.department === "string" ? req.query.department : "";

  const employees = await db.employee.findMany({
    where: {
      ...(department ? { department } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { user: { email: { contains: search, mode: "insensitive" } } },
              { user: { employeeId: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { user: { select: { id: true, employeeId: true, email: true, role: true, emailVerified: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.json({ employees });
});

employeesRouter.get("/:id", async (req, res) => {
  const employee = await db.employee.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, employeeId: true, email: true, role: true, emailVerified: true } },
      payrolls: { orderBy: { effectiveDate: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!employee) return res.status(404).json({ error: "Employee not found." });
  res.json({ employee });
});

employeesRouter.patch("/:id", async (req, res) => {
  const parsed = employeeAdminUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
  }

  const employee = await db.employee.findUnique({ where: { id: req.params.id } });
  if (!employee) return res.status(404).json({ error: "Employee not found." });

  const { name, phone, address, department, position, joiningDate, role } = parsed.data;

  await db.$transaction([
    db.employee.update({
      where: { id: employee.id },
      data: { name, phone: phone || null, address: address || null, department, position, joiningDate },
    }),
    db.user.update({ where: { id: employee.userId }, data: { role } }),
  ]);

  res.json({ success: true });
});

employeesRouter.post("/:id/picture", upload.single("file"), async (req, res) => {
  const employee = await db.employee.findUnique({ where: { id: req.params.id } });
  if (!employee) return res.status(404).json({ error: "Employee not found." });
  if (!req.file) return res.status(400).json({ error: "No file provided." });

  const validation = validateFile(req.file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  if (!validation.ok) return res.status(400).json({ error: validation.error });

  const url = saveUploadedFile(req.file, `profile-pictures/${employee.id}`);
  await db.employee.update({ where: { id: employee.id }, data: { profilePicture: url } });

  res.json({ url });
});

employeesRouter.post("/:id/documents", upload.single("file"), async (req, res) => {
  const employee = await db.employee.findUnique({ where: { id: req.params.id } });
  if (!employee) return res.status(404).json({ error: "Employee not found." });
  if (!req.file) return res.status(400).json({ error: "No file provided." });

  const validation = validateFile(req.file, ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE);
  if (!validation.ok) return res.status(400).json({ error: validation.error });

  const url = saveUploadedFile(req.file, `documents/${employee.id}`);
  const document = await db.document.create({
    data: { employeeId: employee.id, fileName: req.file.originalname.slice(0, 200), fileUrl: url },
  });

  res.status(201).json({ document });
});
