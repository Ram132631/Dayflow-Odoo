import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatTime, formatWorkingHours } from "@/lib/utils";
import type { AttendanceStatus } from "@prisma/client";

const statusVariant = { PRESENT: "success", HALF_DAY: "warning", ABSENT: "destructive", LEAVE: "info" } as const;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string; status?: string; date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date ? new Date(params.date) : startOfToday();

  const [employees, records, todayStats] = await Promise.all([
    db.employee.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.attendance.findMany({
      where: {
        date,
        employeeId: params.employeeId || undefined,
        status: (params.status as AttendanceStatus) || undefined,
      },
      include: { employee: { select: { name: true, user: { select: { employeeId: true } } } } },
      orderBy: { employee: { name: "asc" } },
    }),
    db.attendance.groupBy({ by: ["status"], where: { date }, _count: true }),
  ]);

  const countFor = (s: string) => todayStats.find((t) => t.status === s)?._count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Overview</h1>
        <p className="text-sm text-slate-500">Attendance across all employees.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"] as const).map((s) => (
          <Card key={s}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-slate-900">{countFor(s)}</p>
              <p className="text-xs text-slate-500">{s.replace("_", " ")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Date</label>
              <input
                type="date"
                name="date"
                defaultValue={date.toISOString().slice(0, 10)}
                className="block h-9 rounded-md border border-slate-200 px-3 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Employee</label>
              <select name="employeeId" defaultValue={params.employeeId ?? ""} className="block h-9 rounded-md border border-slate-200 px-3 text-sm">
                <option value="">All employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Status</label>
              <select name="status" defaultValue={params.status ?? ""} className="block h-9 rounded-md border border-slate-200 px-3 text-sm">
                <option value="">All statuses</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="HALF_DAY">Half day</option>
                <option value="LEAVE">Leave</option>
              </select>
            </div>
            <button type="submit" className="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">
              Apply
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Records for {formatDate(date)}</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No attendance records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Working Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-slate-900">{r.employee.name}</TableCell>
                    <TableCell>{r.employee.user.employeeId}</TableCell>
                    <TableCell>{formatTime(r.checkIn)}</TableCell>
                    <TableCell>{formatTime(r.checkOut)}</TableCell>
                    <TableCell>{formatWorkingHours(r.checkIn, r.checkOut)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[r.status]}>{r.status.replace("_", " ")}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
