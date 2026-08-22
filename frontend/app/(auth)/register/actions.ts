"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { registerSchema, type RegisterInput } from "@/lib/validations";

export type RegisterResult =
  | { success: true; verifyPath: string; devToken: string }
  | { success: false; error: string };

export async function registerAction(input: RegisterInput): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { employeeId, name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { employeeId }] },
    select: { email: true, employeeId: true },
  });
  if (existing) {
    if (existing.email === normalizedEmail) {
      return { success: false, error: "An account with this email already exists." };
    }
    return { success: false, error: "This Employee ID is already taken." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await db.$transaction(async (tx) => {
    // Publicly self-registered accounts are always EMPLOYEE, regardless of any
    // role value submitted from the client — HR/ADMIN accounts can only be
    // granted by an existing administrator (see app/(app)/admin/employees).
    const user = await tx.user.create({
      data: {
        employeeId,
        email: normalizedEmail,
        passwordHash,
        role: "EMPLOYEE",
        verificationToken,
        verificationTokenExpiry,
      },
    });

    await tx.employee.create({
      data: {
        userId: user.id,
        name,
        department: "Unassigned",
        position: "New Hire",
        joiningDate: new Date(),
      },
    });
  });

  // No transactional email provider is configured in this project. In place
  // of sending mail, the verification link is returned directly so the UI
  // can display it — a clear, dev-friendly stand-in for a real mailer.
  console.log(`[dev] Email verification link for ${normalizedEmail}: /verify-email?token=${verificationToken}`);

  return {
    success: true,
    verifyPath: `/verify-email?token=${verificationToken}`,
    devToken: verificationToken,
  };
}
