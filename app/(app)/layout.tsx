import { redirect } from "next/navigation";
import { requireUser, isAdminRole } from "@/lib/permissions";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  if (!user.verified) {
    redirect("/verify-email");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isAdmin={isAdminRole(user.role)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
