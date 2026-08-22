import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminPayrollPage() {
  const employees = await db.employee.findMany({
    include: {
      user: { select: { employeeId: true } },
      payrolls: { orderBy: { effectiveDate: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const totalNet = employees.reduce((sum, e) => sum + Number(e.payrolls[0]?.netSalary ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
        <p className="text-sm text-slate-500">View and verify payroll across all employees.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalNet.toString())}</p>
          <p className="text-xs text-slate-500">Total net payroll (latest per employee)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No employees found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => {
                  const p = e.payrolls[0];
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium text-slate-900">{e.user.employeeId}</TableCell>
                      <TableCell>{e.name}</TableCell>
                      <TableCell>{p ? formatCurrency(p.basicSalary.toString()) : "—"}</TableCell>
                      <TableCell>{p ? formatCurrency(p.allowances.toString()) : "—"}</TableCell>
                      <TableCell>{p ? formatCurrency(p.deductions.toString()) : "—"}</TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {p ? formatCurrency(p.netSalary.toString()) : "—"}
                      </TableCell>
                      <TableCell>{p ? formatDate(p.effectiveDate) : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/employees/${e.id}`} className="text-sm font-medium text-slate-600 hover:underline">
                          Update
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
