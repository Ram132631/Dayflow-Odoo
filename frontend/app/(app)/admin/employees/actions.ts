"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { employeeAdminUpdateSchema, payrollUpsertSchema, type EmployeeAdminUpdateInput, type PayrollUpsertInput } from "@/lib/validations";
import { ALLOWED_DOCUMENT_TYPES, ALLOWED_IMAGE_TYPES, MAX_DOCUMENT_SIZE, MAX_IMAGE_SIZE } from "@/lib/validations";
import { saveUploadedFile, validateFile } from "@/lib/upload";
import { createNotification } from "@/lib/notifications";

export async function updateEmployeeAction(employeeId: string, input: EmployeeAdminUpdateInput) {
  await requireAdmin();

  const parsed = employeeAdminUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    return { success: false as const, error: "Employee not found." };
  }

  const { name, phone, address, department, position, joiningDate, role } = parsed.data;

  await db.$transaction([
    db.employee.update({
      where: { id: employeeId },
      data: {
        name,
        phone: phone || null,
        address: address || null,
        department,
        position,
        joiningDate,
      },
    }),
    db.user.update({
      where: { id: employee.userId },
      data: { role },
    }),
  ]);

  revalidatePath(`/admin/employees/${employeeId}`);
  revalidatePath("/admin/employees");
  return { success: true as const };
}

export async function uploadEmployeeDocumentAction(employeeId: string, formData: FormData) {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false as const, error: "No file provided." };
  }

  const validation = validateFile(file, ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE);
  if (!validation.ok) {
    return { success: false as const, error: validation.error };
  }

  const url = await saveUploadedFile(file, `documents/${employeeId}`);

  await db.document.create({
    data: { employeeId, fileName: file.name.slice(0, 200), fileUrl: url },
  });

  revalidatePath(`/admin/employees/${employeeId}`);
  return { success: true as const };
}

export async function updateEmployeePictureAction(employeeId: string, formData: FormData) {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false as const, error: "No file provided." };
  }

  const validation = validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  if (!validation.ok) {
    return { success: false as const, error: validation.error };
  }

  const url = await saveUploadedFile(file, `profile-pictures/${employeeId}`);

  await db.employee.update({ where: { id: employeeId }, data: { profilePicture: url } });

  revalidatePath(`/admin/employees/${employeeId}`);
  return { success: true as const, url };
}

export async function updatePayrollAction(input: PayrollUpsertInput) {
  await requireAdmin();

  const parsed = payrollUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { employeeId, basicSalary, allowances, deductions, effectiveDate } = parsed.data;
  const netSalary = basicSalary + allowances - deductions;
  if (netSalary < 0) {
    return { success: false as const, error: "Net salary cannot be negative." };
  }

  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return { success: false as const, error: "Employee not found." };

  await db.$transaction(async (tx) => {
    await tx.payroll.create({
      data: { employeeId, basicSalary, allowances, deductions, netSalary, effectiveDate },
    });
    await createNotification(
      employee.userId,
      "Payroll updated",
      "Your salary structure has been updated by HR.",
      tx
    );
  });

  revalidatePath(`/admin/employees/${employeeId}`);
  revalidatePath("/admin/payroll");
  revalidatePath("/payroll");
  revalidatePath("/dashboard");
  return { success: true as const };
}
