import { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    employeeId: string;
    employeeRecordId: string | null;
    // Named "verified" (not "emailVerified") to avoid colliding with the
    // built-in AdapterUser.emailVerified: Date | null field.
    verified: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      employeeId: string;
      employeeRecordId: string | null;
      verified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: Role;
    employeeId: string;
    employeeRecordId: string | null;
    verified: boolean;
  }
}
