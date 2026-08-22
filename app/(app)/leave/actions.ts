"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwnEmployee } from "@/lib/permissions";
import { leaveApplySchema, type LeaveApplyInput } from "@/lib/validations";
import { notifyAdmins } from "@/lib/notifications";

export async function applyLeaveAction(input: LeaveApplyInput) {
  const { employee } = await requireOwnEmployee();

  const parsed = leaveApplySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { leaveType, startDate, endDate, remarks } = parsed.data;

  await db.$transaction(async (tx) => {
    await tx.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveType,
        startDate,
        endDate,
        remarks: remarks || null,
        status: "PENDING",
      },
    });

    await notifyAdmins(
      "New leave request",
      `${employee.name} submitted a ${leaveType.toLowerCase()} leave request.`,
      tx
    );
  });

  revalidatePath("/leave");
  revalidatePath("/dashboard");
  return { success: true as const };
}
