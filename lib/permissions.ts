import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type SessionUser = {
  id: string;
  role: "EMPLOYEE" | "HR" | "ADMIN";
  employeeId: string;
  employeeRecordId: string | null;
  emailVerified: boolean;
  email: string;
  name: string;
};

/** Redirects to /login if there is no authenticated session. Never trusts client input. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user as SessionUser;
}

export function isAdminRole(role: string) {
  return role === "ADMIN" || role === "HR";
}

/** Redirects non-HR/Admin users away. Use in every admin page/layout — middleware alone is not sufficient defense. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdminRole(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Returns the current user's own Employee record, creating the redirect if
 * they somehow have no Employee profile yet (should not happen post-seed).
 */
export async function requireOwnEmployee() {
  const user = await requireUser();
  if (!user.employeeRecordId) {
    redirect("/login");
  }
  const employee = await db.employee.findUnique({
    where: { id: user.employeeRecordId! },
  });
  if (!employee) {
    redirect("/login");
  }
  return { user, employee: employee! };
}
