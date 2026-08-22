import Link from "next/link";
import { db } from "@/lib/db";
import { requireOwnEmployee } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuickAccess } from "@/components/layout/quick-access";
import { CheckInOutCard } from "@/components/attendance/check-in-out-card";
import { formatCurrency, formatDate } from "@/lib/utils";

const leaveStatusVariant = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
} as const;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DashboardPage() {
  const { user, employee } = await requireOwnEmployee();

  const [todayAttendance, recentLeaves, recentNotifications, latestPayroll] = await Promise.all([
    db.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: startOfToday() } },
    }),
    db.leaveRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.payroll.findFirst({
      where: { employeeId: employee.id },
      orderBy: { effectiveDate: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {employee.name.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">{employee.position} · {employee.department}</p>
      </div>

      <QuickAccess />

      <div className="grid gap-6 lg:grid-cols-3">
        <CheckInOutCard
          checkIn={todayAttendance?.checkIn?.toISOString() ?? null}
          checkOut={todayAttendance?.checkOut?.toISOString() ?? null}
          status={todayAttendance?.status ?? null}
        />

        <Card>
          <CardHeader>
            <CardTitle>Salary Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {latestPayroll ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Basic salary</span>
                  <span className="font-medium text-slate-900">{formatCurrency(latestPayroll.basicSalary.toString())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allowances</span>
                  <span className="font-medium text-emerald-600">+{formatCurrency(latestPayroll.allowances.toString())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deductions</span>
                  <span className="font-medium text-red-600">-{formatCurrency(latestPayroll.deductions.toString())}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-100 pt-2">
                  <span className="font-semibold text-slate-900">Net salary</span>
                  <span className="font-bold text-slate-900">{formatCurrency(latestPayroll.netSalary.toString())}</span>
                </div>
                <Link href="/payroll" className="mt-2 block text-xs font-medium text-slate-500 hover:underline">
                  View salary slip →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No payroll information available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-slate-400">No notifications yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentNotifications.map((n) => (
                  <li key={n.id} className="text-sm">
                    <p className={n.isRead ? "text-slate-600" : "font-medium text-slate-900"}>{n.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/notifications" className="mt-3 block text-xs font-medium text-slate-500 hover:underline">
              View all →
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeaves.length === 0 ? (
            <p className="text-sm text-slate-400">No leave requests found.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentLeaves.map((leave) => (
                <li key={leave.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {leave.leaveType.charAt(0) + leave.leaveType.slice(1).toLowerCase()} leave
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                    </p>
                  </div>
                  <Badge variant={leaveStatusVariant[leave.status]}>{leave.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link href="/leave" className="mt-3 block text-xs font-medium text-slate-500 hover:underline">
            View leave history →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
