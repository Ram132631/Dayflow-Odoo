"use server";

import { db } from "@/lib/db";

export type VerifyResult = { success: true } | { success: false; error: string };

export async function verifyEmailAction(token: string): Promise<VerifyResult> {
  if (!token) {
    return { success: false, error: "Missing verification token." };
  }

  const user = await db.user.findUnique({ where: { verificationToken: token } });
  if (!user) {
    return { success: false, error: "This verification link is invalid or has already been used." };
  }

  if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
    return { success: false, error: "This verification link has expired. Please register again or request a new link." };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  return { success: true };
}

export async function resendVerificationAction(email: string): Promise<VerifyResult & { devPath?: string }> {
  const normalized = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalized } });

  // Do not reveal whether the account exists.
  if (!user || user.emailVerified) {
    return { success: true };
  }

  const crypto = await import("crypto");
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await db.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpiry },
  });

  console.log(`[dev] Resent email verification link for ${normalized}: /verify-email?token=${verificationToken}`);

  return { success: true, devPath: `/verify-email?token=${verificationToken}` };
}
