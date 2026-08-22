import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // Only bounce fully-verified sessions away — an authenticated-but-unverified
  // user must still be able to reach /verify-email without looping back here.
  if (session?.user?.emailVerified) {
    redirect(isAdminRole(session.user.role) ? "/admin/dashboard" : "/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-1 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
            D
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Dayflow</h1>
          <p className="text-sm text-slate-500">Human Resource Management System</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </div>
  );
}
