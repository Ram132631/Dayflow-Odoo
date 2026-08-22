import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain a special character");

export const registerSchema = z
  .object({
    employeeId: z
      .string()
      .trim()
      .min(3, "Employee ID must be at least 3 characters")
      .max(20, "Employee ID must be at most 20 characters")
      .regex(/^[A-Za-z0-9-]+$/, "Employee ID may only contain letters, numbers and hyphens"),
    name: z.string().trim().min(2, "Name is required").max(100),
    email: z.string().trim().email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    // Publicly submitted role is advisory only — the server always creates
    // new self-registered accounts as EMPLOYEE. See app/(auth)/register/actions.ts.
    role: z.enum(["EMPLOYEE", "HR", "ADMIN"]).default("EMPLOYEE"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const profileUpdateSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-() ]*$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const employeeAdminUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-() ]*$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  department: z.string().trim().min(1, "Department is required").max(100),
  position: z.string().trim().min(1, "Position is required").max(100),
  joiningDate: z.coerce.date({ error: "Enter a valid joining date" }),
  role: z.enum(["EMPLOYEE", "HR", "ADMIN"]),
});

export type EmployeeAdminUpdateInput = z.infer<typeof employeeAdminUpdateSchema>;

export const attendanceFilterSchema = z.object({
  employeeId: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const leaveApplySchema = z
  .object({
    leaveType: z.enum(["PAID", "SICK", "UNPAID"]),
    startDate: z.coerce.date({ error: "Start date is required" }),
    endDate: z.coerce.date({ error: "End date is required" }),
    remarks: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type LeaveApplyInput = z.infer<typeof leaveApplySchema>;

export const leaveDecisionSchema = z.object({
  leaveId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  adminComment: z.string().trim().max(500).optional().or(z.literal("")),
});

export type LeaveDecisionInput = z.infer<typeof leaveDecisionSchema>;

export const payrollUpsertSchema = z.object({
  employeeId: z.string().min(1),
  basicSalary: z.coerce.number().nonnegative("Basic salary cannot be negative"),
  allowances: z.coerce.number().nonnegative("Allowances cannot be negative"),
  deductions: z.coerce.number().nonnegative("Deductions cannot be negative"),
  effectiveDate: z.coerce.date({ error: "Enter a valid effective date" }),
});

export type PayrollUpsertInput = z.infer<typeof payrollUpsertSchema>;

export const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
