import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ReportsCharts } from "@/components/reports/reports-charts";

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

export default async function AdminReportsPage() {
  const [employeeCount, attendanceByStatus, leaveByType, leaveByStatus, payrollAgg, monthlyAttendance] =
    await Promise.all([
      db.employee.count(),
      db.attendance.groupBy({ by: ["status"], where: { date: { gte: daysAgo(30) } }, _count: true }),
      db.leaveRequest.groupBy({ by: ["leaveType"], _count: true }),
      db.leaveRequest.groupBy({ by: ["status"], _count: true }),
      db.payroll.aggregate({ _sum: { netSalary: true, basicSalary: true }, _avg: { netSalary: true } }),
      db.$queryRaw<{ month: string; present: bigint; absent: bigint; leave: bigint }[]>`
        SELECT to_char(date, 'YYYY-MM') as month,
          SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
          SUM(CASE WHEN status = 'LEAVE' THEN 1 ELSE 0 END) as leave
        FROM "Attendance"
        WHERE date >= NOW() - INTERVAL '6 months'
        GROUP BY month ORDER BY month ASC
      `,
    ]);

  const attendanceData = attendanceByStatus.map((a) => ({ name: a.status.replace("_", " "), value: a._count }));
  const leaveTypeData = leaveByType.map((l) => ({ name: l.leaveType, value: l._count }));
  const leaveStatusData = leaveByStatus.map((l) => ({ name: l.status, value: l._count }));
  const monthlyData = monthlyAttendance.map((m) => ({
    month: m.month,
    Present: Number(m.present),
    Absent: Number(m.absent),
    Leave: Number(m.leave),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-sm text-slate-500">Organization-wide attendance, leave and payroll insights.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-slate-900">{employeeCount}</p>
            <p className="text-xs text-slate-500">Total Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-slate-900">{formatCurrency((payrollAgg._sum.netSalary ?? 0).toString())}</p>
            <p className="text-xs text-slate-500">Total Net Payroll</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-slate-900">{formatCurrency((payrollAgg._avg.netSalary ?? 0).toString())}</p>
            <p className="text-xs text-slate-500">Average Net Salary</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-slate-900">
              {leaveByStatus.reduce((s, l) => s + l._count, 0)}
            </p>
            <p className="text-xs text-slate-500">Total Leave Requests</p>
          </CardContent>
        </Card>
      </div>

      <ReportsCharts attendanceData={attendanceData} leaveTypeData={leaveTypeData} leaveStatusData={leaveStatusData} monthlyData={monthlyData} />
    </div>
  );
}
