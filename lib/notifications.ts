import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  tx: Prisma.TransactionClient | typeof db = db
) {
  return tx.notification.create({
    data: { userId, title, message },
  });
}

export async function notifyAdmins(title: string, message: string, tx: Prisma.TransactionClient | typeof db = db) {
  const admins = await tx.user.findMany({
    where: { role: { in: ["ADMIN", "HR"] } },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await tx.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, title, message })),
  });
}
