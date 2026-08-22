"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOwnEmployee } from "@/lib/permissions";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function checkInAction() {
  // The employee is always resolved from the server session — the browser
  // never gets to supply which employee record to check in as.
  const { employee } = await requireOwnEmployee();
  const today = startOfToday();

  const existing = await db.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });

  if (existing?.checkIn) {
    return { success: false as const, error: "You have already checked in today." };
  }

  if (existing) {
    await db.attendance.update({
      where: { id: existing.id },
      data: { checkIn: new Date(), status: "PRESENT" },
    });
  } else {
    await db.attendance.create({
      data: { employeeId: employee.id, date: today, checkIn: new Date(), status: "PRESENT" },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  return { success: true as const };
}

export async function checkOutAction() {
  const { employee } = await requireOwnEmployee();
  const today = startOfToday();

  const existing = await db.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });

  if (!existing?.checkIn) {
    return { success: false as const, error: "You need to check in before checking out." };
  }
  if (existing.checkOut) {
    return { success: false as const, error: "You have already checked out today." };
  }

  const checkOut = new Date();
  const hoursWorked = (checkOut.getTime() - existing.checkIn.getTime()) / 3600000;

  await db.attendance.update({
    where: { id: existing.id },
    data: {
      checkOut,
      status: hoursWorked < 4.5 ? "HALF_DAY" : "PRESENT",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/attendance");
  return { success: true as const };
}
