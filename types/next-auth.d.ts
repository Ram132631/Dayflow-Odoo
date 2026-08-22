import { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    employeeId: string;
    employeeRecordId: string | null;
    emailVerified: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      employeeId: string;
      employeeRecordId: string | null;
      emailVerified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: Role;
    employeeId: string;
    employeeRecordId: string | null;
    emailVerified: boolean;
  }
}
