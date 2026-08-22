import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(isAdminRole(session.user.role) ? "/admin/dashboard" : "/dashboard");
}
