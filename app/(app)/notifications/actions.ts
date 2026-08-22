"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";

export async function markNotificationReadAction(notificationId: string) {
  const user = await requireUser();

  // Ownership check server-side — a user can only mark their own notifications.
  const notification = await db.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== user.id) {
    return { success: false as const, error: "Notification not found." };
  }

  await db.notification.update({ where: { id: notificationId }, data: { isRead: true } });
  revalidatePath("/notifications");
  return { success: true as const };
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  revalidatePath("/notifications");
  return { success: true as const };
}
