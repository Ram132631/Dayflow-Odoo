import { PrismaClient, Role, LeaveType, LeaveStatus, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

async function createUser(opts: {
  employeeId: string;
  email: string;
  password: string;
  role: Role;
  name: string;
  phone?: string;
  address?: string;
  department: string;
  position: string;
  joiningDate: Date;
}) {
  const passwordHash = await hash(opts.password);
  const user = await db.user.create({
    data: {
      employeeId: opts.employeeId,
      email: opts.email,
      passwordHash,
      role: opts.role,
      emailVerified: new Date(),
      employee: {
        create: {
          name: opts.name,
          phone: opts.phone,
          address: opts.address,
          department: opts.department,
          position: opts.position,
          joiningDate: opts.joiningDate,
        },
      },
    },
    include: { employee: true },
  });
  return user;
}

async function main() {
  console.log("Seeding Dayflow demo data...");

  await db.notification.deleteMany();
  await db.document.deleteMany();
  await db.payroll.deleteMany();
  await db.leaveRequest.deleteMany();
  await db.attendance.deleteMany();
  await db.employee.deleteMany();
  await db.user.deleteMany();

  const admin = await createUser({
    employeeId: "ADM001",
    email: "admin@dayflow.com",
    password: "Admin@12345",
    role: Role.ADMIN,
    name: "Aditya Rao",
    phone: "+91 90000 00001",
    address: "12 MG Road, Bengaluru",
    department: "Administration",
    position: "System Administrator",
    joiningDate: daysAgo(900),
  });

  const hr = await createUser({
    employeeId: "HR001",
    email: "hr@dayflow.com",
    password: "Hr@123456",
    role: Role.HR,
    name: "Kavita Nair",
    phone: "+91 90000 00002",
    address: "45 Residency Road, Bengaluru",
    department: "Human Resources",
    position: "HR Manager",
    joiningDate: daysAgo(700),
  });

  const employeeSeed = [
    {
      employeeId: "EMP001",
      email: "priya.sharma@dayflow.com",
      name: "Priya Sharma",
      department: "Engineering",
      position: "Frontend Engineer",
      joiningDate: daysAgo(420),
      phone: "+91 90000 00003",
      address: "7 Park Street, Pune",
    },
    {
      employeeId: "EMP002",
      email: "rahul.verma@dayflow.com",
      name: "Rahul Verma",
      department: "Engineering",
      position: "Backend Engineer",
      joiningDate: daysAgo(380),
      phone: "+91 90000 00004",
      address: "22 Lake View, Hyderabad",
    },
    {
      employeeId: "EMP003",
      email: "sneha.iyer@dayflow.com",
      name: "Sneha Iyer",
      department: "Design",
      position: "Product Designer",
      joiningDate: daysAgo(300),
      phone: "+91 90000 00005",
      address: "9 Church Street, Bengaluru",
    },
    {
      employeeId: "EMP004",
      email: "arjun.mehta@dayflow.com",
      name: "Arjun Mehta",
      department: "Sales",
      position: "Sales Executive",
      joiningDate: daysAgo(250),
      phone: "+91 90000 00006",
      address: "18 Marine Drive, Mumbai",
    },
    {
      employeeId: "EMP005",
      email: "neha.gupta@dayflow.com",
      name: "Neha Gupta",
      department: "Finance",
      position: "Financial Analyst",
      joiningDate: daysAgo(180),
      phone: "+91 90000 00007",
      address: "3 Civil Lines, Delhi",
    },
  ];

  const employees = [];
  for (const e of employeeSeed) {
    const user = await createUser({
      ...e,
      password: "Employee@123",
      role: Role.EMPLOYEE,
    });
    employees.push(user);
  }

  // Attendance: last 14 days for each employee, weekdays only, with some variance.
  for (const user of employees) {
    if (!user.employee) continue;
    for (let i = 1; i <= 14; i++) {
      const date = daysAgo(i);
      const day = date.getDay();
      if (day === 0 || day === 6) continue; // skip weekends

      const roll = Math.random();
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      let checkIn: Date | null = new Date(date);
      let checkOut: Date | null = new Date(date);

      if (roll < 0.08) {
        status = AttendanceStatus.ABSENT;
        checkIn = null;
        checkOut = null;
      } else if (roll < 0.16) {
        status = AttendanceStatus.HALF_DAY;
        checkIn.setHours(9, 10, 0, 0);
        checkOut.setHours(13, 30, 0, 0);
      } else {
        checkIn.setHours(9, Math.floor(Math.random() * 20), 0, 0);
        checkOut.setHours(18, Math.floor(Math.random() * 30), 0, 0);
      }

      await db.attendance.create({
        data: {
          employeeId: user.employee.id,
          date,
          checkIn,
          checkOut,
          status,
        },
      });
    }
  }

  // Leave requests
  const [priya, rahul, sneha, arjun, neha] = employees;

  await db.leaveRequest.create({
    data: {
      employeeId: priya.employee!.id,
      leaveType: LeaveType.SICK,
      startDate: daysAgo(3),
      endDate: daysAgo(2),
      remarks: "Fever and viral infection.",
      status: LeaveStatus.PENDING,
    },
  });

  await db.leaveRequest.create({
    data: {
      employeeId: rahul.employee!.id,
      leaveType: LeaveType.PAID,
      startDate: daysAgo(20),
      endDate: daysAgo(18),
      remarks: "Family function out of town.",
      status: LeaveStatus.APPROVED,
      adminComment: "Approved — enjoy!",
      approvedBy: hr.id,
    },
  });

  await db.leaveRequest.create({
    data: {
      employeeId: sneha.employee!.id,
      leaveType: LeaveType.UNPAID,
      startDate: daysAgo(10),
      endDate: daysAgo(10),
      remarks: "Personal errand.",
      status: LeaveStatus.REJECTED,
      adminComment: "Please plan personal errands around weekends where possible.",
      approvedBy: admin.id,
    },
  });

  await db.leaveRequest.create({
    data: {
      employeeId: arjun.employee!.id,
      leaveType: LeaveType.PAID,
      startDate: daysAgo(1),
      endDate: daysAgo(0),
      remarks: "Moving apartments.",
      status: LeaveStatus.PENDING,
    },
  });

  // Payroll
  const payrollSeed: [typeof priya, number, number, number][] = [
    [priya, 85000, 12000, 3000],
    [rahul, 92000, 14000, 4000],
    [sneha, 78000, 10000, 2500],
    [arjun, 60000, 8000, 2000],
    [neha, 70000, 9000, 2200],
  ];

  for (const [user, basic, allowances, deductions] of payrollSeed) {
    await db.payroll.create({
      data: {
        employeeId: user.employee!.id,
        basicSalary: basic,
        allowances,
        deductions,
        netSalary: basic + allowances - deductions,
        effectiveDate: daysAgo(30),
      },
    });
  }

  // Notifications
  await db.notification.create({
    data: {
      userId: priya.id,
      title: "Leave request submitted",
      message: "Your sick leave request is pending approval.",
    },
  });
  await db.notification.create({
    data: {
      userId: rahul.id,
      title: "Leave approved",
      message: "Your paid leave request was approved by HR.",
      isRead: true,
    },
  });
  await db.notification.create({
    data: {
      userId: sneha.id,
      title: "Leave rejected",
      message: "Your unpaid leave request was rejected. See admin comment for details.",
    },
  });
  await db.notification.create({
    data: {
      userId: hr.id,
      title: "New leave request",
      message: "Priya Sharma submitted a sick leave request.",
    },
  });
  await db.notification.create({
    data: {
      userId: admin.id,
      title: "New leave request",
      message: "Arjun Mehta submitted a paid leave request.",
    },
  });

  console.log("Seed complete.");
  console.log("");
  console.log("Demo credentials:");
  console.log("  Admin    admin@dayflow.com / Admin@12345");
  console.log("  HR       hr@dayflow.com / Hr@123456");
  console.log("  Employee priya.sharma@dayflow.com / Employee@123 (and 4 more EMP00x accounts)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
