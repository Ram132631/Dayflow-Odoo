import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeaveDecisionDialog } from "@/components/leave/leave-decision-dialog";
import { formatDate } from "@/lib/utils";

const statusVariant = { PENDING: "warning", APPROVED: "success", REJECTED: "destructive" } as const;

export default async function AdminLeavePage() {
  const leaves = await db.leaveRequest.findMany({
    include: { employee: { include: { user: { select: { employeeId: true } } } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = leaves.filter((l) => l.status === "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leave Approvals</h1>
        <p className="text-sm text-slate-500">Review and decide on employee leave requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No pending leave requests.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium text-slate-900">{leave.employee.name}</TableCell>
                    <TableCell>{leave.employee.user.employeeId}</TableCell>
                    <TableCell>{leave.leaveType}</TableCell>
                    <TableCell>{formatDate(leave.startDate)}</TableCell>
                    <TableCell>{formatDate(leave.endDate)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{leave.remarks || "—"}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <LeaveDecisionDialog leaveId={leave.id} decision="APPROVED" />
                      <LeaveDecisionDialog leaveId={leave.id} decision="REJECTED" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {leaves.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No leave requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium text-slate-900">{leave.employee.name}</TableCell>
                    <TableCell>{leave.leaveType}</TableCell>
                    <TableCell>{formatDate(leave.startDate)}</TableCell>
                    <TableCell>{formatDate(leave.endDate)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[leave.status]}>{leave.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-slate-500">{leave.adminComment || "—"}</TableCell>
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
