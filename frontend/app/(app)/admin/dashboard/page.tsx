import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const statusVariant = { PENDING: "warning", APPROVED: "success", REJECTED: "destructive" } as const;

export default async function AdminDashboardPage() {
  const today = startOfToday();

  const [totalEmployees, presentToday, absentToday, onLeaveToday, pendingLeave, payrollAgg, recentLeaves] =
    await Promise.all([
      db.employee.count(),
      db.attendance.count({ where: { date: today, status: "PRESENT" } }),
      db.attendance.count({ where: { date: today, status: "ABSENT" } }),
      db.attendance.count({ where: { date: today, status: "LEAVE" } }),
      db.leaveRequest.count({ where: { status: "PENDING" } }),
      db.payroll.aggregate({ _sum: { netSalary: true } }),
      db.leaveRequest.findMany({
        where: { status: "PENDING" },
        include: { employee: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const stats = [
    { label: "Total Employees", value: totalEmployees },
    { label: "Present Today", value: presentToday },
    { label: "Absent Today", value: absentToday },
    { label: "On Leave", value: onLeaveToday },
    { label: "Pending Leave Requests", value: pendingLeave },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">HR Dashboard</h1>
        <p className="text-sm text-slate-500">Organization-wide overview for today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payroll Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency((payrollAgg._sum.netSalary ?? 0).toString())}
            </p>
            <p className="text-xs text-slate-500">Total net payroll (latest records)</p>
            <Link href="/admin/payroll" className="mt-3 block text-xs font-medium text-slate-500 hover:underline">
              Manage payroll →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeaves.length === 0 ? (
              <p className="text-sm text-slate-400">No pending leave requests.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentLeaves.map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{l.employee.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatDate(l.startDate)} – {formatDate(l.endDate)}
                      </p>
                    </div>
                    <Badge variant={statusVariant[l.status]}>{l.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/leave" className="mt-3 block text-xs font-medium text-slate-500 hover:underline">
              Review all requests →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
