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
