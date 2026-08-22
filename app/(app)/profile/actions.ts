"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwnEmployee } from "@/lib/permissions";
import { profileUpdateSchema, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/lib/validations";
import { saveUploadedFile, validateFile } from "@/lib/upload";

export async function updateOwnProfileAction(input: { phone?: string; address?: string }) {
  // Employees may only edit phone/address on their own profile — server-side
  // enforced regardless of what a tampered client sends. Everything else
  // (name, department, position, salary...) requires an admin.
  const { employee } = await requireOwnEmployee();

  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await db.employee.update({
    where: { id: employee.id },
    data: {
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    },
  });

  revalidatePath("/profile");
  return { success: true as const };
}

export async function updateOwnProfilePictureAction(formData: FormData) {
  const { employee } = await requireOwnEmployee();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false as const, error: "No file provided." };
  }

  const validation = validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  if (!validation.ok) {
    return { success: false as const, error: validation.error };
  }

  const url = await saveUploadedFile(file, `profile-pictures/${employee.id}`);

  await db.employee.update({
    where: { id: employee.id },
    data: { profilePicture: url },
  });

  revalidatePath("/profile");
  return { success: true as const, url };
}
