import { db } from "@/lib/db";
import { requireOwnEmployee } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckInOutCard } from "@/components/attendance/check-in-out-card";
import { formatDate, formatTime, formatWorkingHours } from "@/lib/utils";

const statusVariant = {
  PRESENT: "success",
  HALF_DAY: "warning",
  ABSENT: "destructive",
  LEAVE: "info",
} as const;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number) {
  const d = startOfToday();
  d.setDate(d.getDate() - n);
  return d;
}

function AttendanceTable({ records }: { records: { id: string; date: Date; checkIn: Date | null; checkOut: Date | null; status: string }[] }) {
  if (records.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No attendance records found.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Check In</TableHead>
          <TableHead>Check Out</TableHead>
          <TableHead>Working Hours</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium text-slate-900">{formatDate(r.date)}</TableCell>
            <TableCell>{formatTime(r.checkIn)}</TableCell>
            <TableCell>{formatTime(r.checkOut)}</TableCell>
            <TableCell>{formatWorkingHours(r.checkIn, r.checkOut)}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[r.status as keyof typeof statusVariant]}>{r.status.replace("_", " ")}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function AttendancePage() {
  const { employee } = await requireOwnEmployee();

  const [today, weekly, monthly] = await Promise.all([
    db.attendance.findUnique({ where: { employeeId_date: { employeeId: employee.id, date: startOfToday() } } }),
    db.attendance.findMany({
      where: { employeeId: employee.id, date: { gte: daysAgo(7) } },
      orderBy: { date: "desc" },
    }),
    db.attendance.findMany({
      where: { employeeId: employee.id, date: { gte: daysAgo(30) } },
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">Track your daily check-in/out and attendance history.</p>
      </div>

      <div className="max-w-md">
        <CheckInOutCard
          checkIn={today?.checkIn?.toISOString() ?? null}
          checkOut={today?.checkOut?.toISOString() ?? null}
          status={today?.status ?? null}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="week">
            <TabsList>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">Last 30 Days</TabsTrigger>
            </TabsList>
            <TabsContent value="week">
              <AttendanceTable records={weekly} />
            </TabsContent>
            <TabsContent value="month">
              <AttendanceTable records={monthly} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
