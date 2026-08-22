"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { registerAction } from "./actions";

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [devVerifyLink, setDevVerifyLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "EMPLOYEE" },
  });

  const role = watch("role");

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const result = await registerAction(data);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setDevVerifyLink(result.verifyPath);
  };

  if (devVerifyLink) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <h2 className="text-lg font-semibold text-slate-900">Check your inbox</h2>
        <p className="text-sm text-slate-500">
          We&apos;ve created your account. In a production deployment a verification email would be sent now —
          since no email provider is configured for this environment, use the development link below to verify
          instantly.
        </p>
        <Link
          href={devVerifyLink}
          className="w-full rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 underline-offset-2 hover:underline"
        >
          {devVerifyLink}
        </Link>
        <Button asChild className="w-full">
          <Link href={devVerifyLink}>Verify email now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Create your account</h2>
      <p className="mb-6 mt-1 text-sm text-slate-500">Set up employee access to Dayflow.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input id="employeeId" placeholder="EMP1024" {...register("employeeId")} />
            {errors.employeeId && <p className="text-xs text-red-600">{errors.employeeId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Jane Doe" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">Account type</Label>
          <Select value={role} onValueChange={(v) => setValue("role", v as RegisterInput["role"])}>
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="HR" disabled>
                HR (granted by an administrator)
              </SelectItem>
              <SelectItem value="ADMIN" disabled>
                Admin (granted by an administrator)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-400">
            New sign-ups are created as Employee. HR/Admin access is granted by an existing administrator.
          </p>
        </div>

        {serverError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-slate-900 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
