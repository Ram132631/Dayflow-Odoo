import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import authConfig from "@/lib/auth.config";
import { loginSchema } from "@/lib/validations";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { employee: true },
        });
        if (!user) return null;

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.employee?.name ?? user.email,
          role: user.role,
          employeeId: user.employeeId,
          employeeRecordId: user.employee?.id ?? null,
          verified: !!user.emailVerified,
        };
      },
    }),
  ],
});
