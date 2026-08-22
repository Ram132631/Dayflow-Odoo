"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { leaveDecisionSchema, type LeaveDecisionInput } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";

export async function decideLeaveAction(input: LeaveDecisionInput) {
  const admin = await requireAdmin();

  const parsed = leaveDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const leave = await db.leaveRequest.findUnique({
    where: { id: parsed.data.leaveId },
    include: { employee: true },
  });
  if (!leave) return { success: false as const, error: "Leave request not found." };
  if (leave.status !== "PENDING") {
    return { success: false as const, error: "This leave request has already been decided." };
  }

  const { decision, adminComment } = parsed.data;

  await db.$transaction(async (tx) => {
    await tx.leaveRequest.update({
      where: { id: leave.id },
      data: { status: decision, adminComment: adminComment || null, approvedBy: admin.id },
    });

    if (decision === "APPROVED") {
      const cursor = new Date(leave.startDate);
      while (cursor <= leave.endDate) {
        const date = new Date(cursor);
        await tx.attendance.upsert({
          where: { employeeId_date: { employeeId: leave.employeeId, date } },
          create: { employeeId: leave.employeeId, date, status: "LEAVE" },
          update: { status: "LEAVE" },
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    await createNotification(
      leave.employee.userId,
      decision === "APPROVED" ? "Leave approved" : "Leave rejected",
      decision === "APPROVED"
        ? `Your ${leave.leaveType.toLowerCase()} leave request was approved.`
        : `Your ${leave.leaveType.toLowerCase()} leave request was rejected.${adminComment ? ` Reason: ${adminComment}` : ""}`,
      tx
    );
  });

  revalidatePath("/admin/leave");
  revalidatePath("/leave");
  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  return { success: true as const };
}
