"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Incorrect email or password.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
      <p className="mb-6 mt-1 text-sm text-slate-500">Welcome back — enter your credentials to continue.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        {serverError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-slate-900 hover:underline">
          Register
        </Link>
      </p>

      <div className="mt-6 rounded-md border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
        <p className="mb-1 font-medium text-slate-600">Demo credentials</p>
        <p>Admin — admin@dayflow.com / Admin@12345</p>
        <p>HR — hr@dayflow.com / Hr@123456</p>
        <p>Employee — priya.sharma@dayflow.com / Employee@123</p>
      </div>
    </div>
  );
}
