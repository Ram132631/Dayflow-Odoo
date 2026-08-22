import { requireAdmin } from "@/lib/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware already blocks non-HR/ADMIN from /admin/*,
  // but every admin page re-checks server-side too, since middleware alone
  // must never be the only gate on privileged data access.
  await requireAdmin();
  return <>{children}</>;
}
