"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/(app)/notifications/actions";

type Notification = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const [pending, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      toast.success("All notifications marked as read.");
    });
  };

  const markOne = (id: string) => {
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Bell className="h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-400">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={markAll} disabled={pending}>
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-white">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`flex items-start justify-between gap-4 px-4 py-3 ${!n.isRead ? "bg-slate-50" : ""}`}
          >
            <div>
              <p className={`text-sm ${!n.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                {n.title}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
              <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
            </div>
            {!n.isRead && (
              <button
                onClick={() => markOne(n.id)}
                disabled={pending}
                className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-900 hover:underline"
              >
                Mark as read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
