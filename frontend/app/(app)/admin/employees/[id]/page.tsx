import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeEditForm } from "@/components/employees/employee-edit-form";
import { PayrollForm } from "@/components/payroll/payroll-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

export default async function AdminEmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      user: { select: { employeeId: true, email: true, role: true } },
      payrolls: { orderBy: { effectiveDate: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{employee.name}</h1>
        <p className="text-sm text-slate-500">
          {employee.user.employeeId} · {employee.user.email}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employee Details</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeEditForm
              employeeId={employee.id}
              defaults={{
                name: employee.name,
                phone: employee.phone,
                address: employee.address,
                department: employee.department,
                position: employee.position,
                joiningDate: employee.joiningDate.toISOString(),
                role: employee.user.role,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Salary Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <PayrollForm employeeId={employee.id} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          {employee.payrolls.length === 0 ? (
            <p className="text-sm text-slate-400">No payroll records yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {employee.payrolls.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-500">{formatDate(p.effectiveDate)}</span>
                  <span className="font-medium text-slate-900">
                    Net {formatCurrency(p.netSalary.toString())} (Basic {formatCurrency(p.basicSalary.toString())})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {employee.documents.length === 0 ? (
            <p className="text-sm text-slate-400">No documents uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {employee.documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 py-2 text-sm">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-slate-700 hover:underline">
                    {doc.fileName}
                  </a>
                  <span className="ml-auto text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
