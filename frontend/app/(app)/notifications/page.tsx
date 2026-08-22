import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { NotificationList } from "@/components/layout/notification-list";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500">Stay up to date with leave, attendance and payroll alerts.</p>
      </div>

      <NotificationList
        notifications={notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
