"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#0f172a", "#3b82f6", "#f59e0b", "#ef4444", "#10b981"];

type NameValue = { name: string; value: number };

export function ReportsCharts({
  attendanceData,
  leaveTypeData,
  leaveStatusData,
  monthlyData,
}: {
  attendanceData: NameValue[];
  leaveTypeData: NameValue[];
  leaveStatusData: NameValue[];
  monthlyData: { month: string; Present: number; Absent: number; Leave: number }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Attendance (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceData.every((d) => d.value === 0) ? (
            <p className="py-10 text-center text-sm text-slate-400">No attendance data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={attendanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {attendanceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave Types</CardTitle>
        </CardHeader>
        <CardContent>
          {leaveTypeData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No leave data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={leaveTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {leaveTypeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Attendance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No attendance history yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Present" fill="#10b981" />
                <Bar dataKey="Absent" fill="#ef4444" />
                <Bar dataKey="Leave" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Leave Requests by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {leaveStatusData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No leave requests yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leaveStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={12} width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
