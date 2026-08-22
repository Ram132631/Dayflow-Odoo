import { db } from "@/lib/db";
import { requireOwnEmployee } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PayrollPage() {
  const { user, employee } = await requireOwnEmployee();

  const payrolls = await db.payroll.findMany({
    where: { employeeId: employee.id },
    orderBy: { effectiveDate: "desc" },
  });

  const latest = payrolls[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
        <p className="text-sm text-slate-500">Your salary structure is read-only. Contact HR for changes.</p>
      </div>

      {!latest ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-400">
            No payroll information available yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Salary Slip</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-100 p-5">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="font-semibold text-slate-900">{employee.name}</p>
                  <p className="text-xs text-slate-400">
                    {employee.position} · {employee.department}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Employee ID</p>
                  <p className="font-medium text-slate-700">{user.employeeId}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-slate-400">Basic Salary</dt>
                  <dd className="font-medium text-slate-900">{formatCurrency(latest.basicSalary.toString())}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Allowances</dt>
                  <dd className="font-medium text-emerald-600">+{formatCurrency(latest.allowances.toString())}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Deductions</dt>
                  <dd className="font-medium text-red-600">-{formatCurrency(latest.deductions.toString())}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Net Salary</dt>
                  <dd className="font-bold text-slate-900">{formatCurrency(latest.netSalary.toString())}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-slate-400">Effective from {formatDate(latest.effectiveDate)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          {payrolls.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No payroll history found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.effectiveDate)}</TableCell>
                    <TableCell>{formatCurrency(p.basicSalary.toString())}</TableCell>
                    <TableCell>{formatCurrency(p.allowances.toString())}</TableCell>
                    <TableCell>{formatCurrency(p.deductions.toString())}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{formatCurrency(p.netSalary.toString())}</TableCell>
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
