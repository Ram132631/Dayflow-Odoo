import { db } from "@/lib/db";
import { requireOwnEmployee } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeaveApplyForm } from "@/components/leave/leave-apply-form";
import { formatDate } from "@/lib/utils";

const statusVariant = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
} as const;

export default async function LeavePage() {
  const { employee } = await requireOwnEmployee();

  const leaves = await db.leaveRequest.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leave</h1>
          <p className="text-sm text-slate-500">Apply for leave and track the status of your requests.</p>
        </div>
        <LeaveApplyForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          {leaves.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No leave requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium text-slate-900">
                      {leave.leaveType.charAt(0) + leave.leaveType.slice(1).toLowerCase()}
                    </TableCell>
                    <TableCell>{formatDate(leave.startDate)}</TableCell>
                    <TableCell>{formatDate(leave.endDate)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{leave.remarks || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[leave.status]}>{leave.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-slate-500">
                      {leave.adminComment || "—"}
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
