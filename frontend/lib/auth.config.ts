import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth config (no Prisma / bcrypt here — those need the Node
 * runtime). This is consumed by middleware.ts for route protection, and by
 * lib/auth.ts (which extends it with the Credentials provider) for the
 * actual sign-in flow.
 */
export default {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    // Edge-safe: runs identically in middleware and in the Node runtime, so
    // it lives here (not lib/auth.ts) to make sure middleware's session also
    // carries role/employeeId — without this, middleware only sees the bare
    // NextAuth defaults (name/email/image) and every admin-area check fails.
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.employeeId = user.employeeId;
        token.employeeRecordId = user.employeeRecordId;
        token.uid = user.id;
        token.verified = user.verified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as "EMPLOYEE" | "HR" | "ADMIN";
        session.user.employeeId = token.employeeId as string;
        session.user.employeeRecordId = token.employeeRecordId as string | null;
        session.user.verified = token.verified as boolean;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const publicPaths = ["/login", "/register", "/verify-email"];
      const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

      if (isPublic) {
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      const role = auth.user.role;
      const isAdminArea = pathname.startsWith("/admin");
      if (isAdminArea && role !== "ADMIN" && role !== "HR") {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
