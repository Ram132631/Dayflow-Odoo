import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminEmployeesPage() {
  const employees = await db.employee.findMany({
    include: { user: { select: { employeeId: true, email: true, role: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
        <p className="text-sm text-slate-500">Manage employee records across the organization.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees ({employees.length})</CardTitle>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium text-slate-900">{emp.user.employeeId}</TableCell>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.user.email}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell>
                      <Badge variant={emp.user.role === "EMPLOYEE" ? "default" : "info"}>{emp.user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/employees/${emp.id}`} className="text-sm font-medium text-slate-600 hover:underline">
                        View
                      </Link>
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
