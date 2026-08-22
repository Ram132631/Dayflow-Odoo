import { db } from "@/lib/db";
import { requireOwnEmployee } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileEditForm } from "@/components/employees/profile-edit-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

export default async function ProfilePage() {
  const { user, employee } = await requireOwnEmployee();

  const [latestPayroll, documents] = await Promise.all([
    db.payroll.findFirst({ where: { employeeId: employee.id }, orderBy: { effectiveDate: "desc" } }),
    db.document.findMany({ where: { employeeId: employee.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">View and manage your personal information.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileEditForm
              name={employee.name}
              phone={employee.phone}
              address={employee.address}
              profilePicture={employee.profilePicture}
            />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-slate-400">Employee ID</dt>
                  <dd className="font-medium text-slate-900">{user.employeeId}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Email</dt>
                  <dd className="font-medium text-slate-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Department</dt>
                  <dd className="font-medium text-slate-900">{employee.department}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Position</dt>
                  <dd className="font-medium text-slate-900">{employee.position}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Joining Date</dt>
                  <dd className="font-medium text-slate-900">{formatDate(employee.joiningDate)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salary Structure</CardTitle>
            </CardHeader>
            <CardContent>
              {latestPayroll ? (
                <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-slate-400">Basic</dt>
                    <dd className="font-medium text-slate-900">{formatCurrency(latestPayroll.basicSalary.toString())}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Allowances</dt>
                    <dd className="font-medium text-emerald-600">{formatCurrency(latestPayroll.allowances.toString())}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Deductions</dt>
                    <dd className="font-medium text-red-600">{formatCurrency(latestPayroll.deductions.toString())}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Net Salary</dt>
                    <dd className="font-bold text-slate-900">{formatCurrency(latestPayroll.netSalary.toString())}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-slate-400">No salary structure has been set up yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-slate-400">No documents uploaded yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {documents.map((doc) => (
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
      </div>
    </div>
  );
}
