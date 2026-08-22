import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "../lib/db";
import { registerSchema, loginSchema } from "../lib/validations";
import { signAuthToken, AUTH_COOKIE_NAME } from "../lib/jwt";
import { requireAuth } from "../middleware/auth.middleware";

export const authRouter = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
  }

  const { employeeId, name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findFirst({
    where: { OR: [{ email: normalizedEmail }, { employeeId }] },
    select: { email: true, employeeId: true },
  });
  if (existing) {
    if (existing.email === normalizedEmail) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    return res.status(409).json({ error: "This Employee ID is already taken." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await db.$transaction(async (tx) => {
    // Publicly self-registered accounts are always EMPLOYEE — HR/ADMIN can
    // only be granted by an existing administrator via PATCH /employees/:id.
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

  console.log(`[dev] Email verification link for ${normalizedEmail}: /verify-email?token=${verificationToken}`);

  res.status(201).json({
    verifyPath: `/verify-email?token=${verificationToken}`,
  });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { employee: true },
  });

  if (!user) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const token = signAuthToken({
    sub: user.id,
    role: user.role,
    employeeId: user.employeeId,
    employeeRecordId: user.employee?.id ?? null,
    verified: !!user.emailVerified,
  });

  res.cookie(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      verified: !!user.emailVerified,
      name: user.employee?.name ?? user.email,
      employeeRecordId: user.employee?.id ?? null,
    },
  });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.json({ success: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.user!.id },
    include: { employee: true },
  });
  if (!user) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      verified: !!user.emailVerified,
      name: user.employee?.name ?? user.email,
      employeeRecordId: user.employee?.id ?? null,
    },
  });
});

authRouter.get("/verify-email", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) {
    return res.status(400).json({ error: "Missing verification token." });
  }

  const user = await db.user.findUnique({ where: { verificationToken: token } });
  if (!user) {
    return res.status(400).json({ error: "This verification link is invalid or has already been used." });
  }
  if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
    return res.status(400).json({ error: "This verification link has expired. Please request a new one." });
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date(), verificationToken: null, verificationTokenExpiry: null },
  });

  res.json({ success: true });
});

authRouter.post("/resend-verification", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const user = await db.user.findUnique({ where: { email } });
  // Do not reveal whether the account exists.
  if (!user || user.emailVerified) {
    return res.json({ success: true });
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await db.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpiry },
  });

  console.log(`[dev] Resent email verification link for ${email}: /verify-email?token=${verificationToken}`);

  res.json({ success: true, devPath: `/verify-email?token=${verificationToken}` });
});
