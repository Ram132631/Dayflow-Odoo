"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { payrollUpsertSchema, type PayrollUpsertInput } from "@/lib/validations";
import { updatePayrollAction } from "@/app/(app)/admin/employees/actions";

export function PayrollForm({ employeeId }: { employeeId: string }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PayrollUpsertInput>({
    resolver: zodResolver(payrollUpsertSchema),
    defaultValues: {
      employeeId,
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      effectiveDate: new Date(),
    },
  });

  const onSubmit = async (data: PayrollUpsertInput) => {
    const result = await updatePayrollAction({ ...data, employeeId });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Salary structure updated.");
    reset({ employeeId, basicSalary: 0, allowances: 0, deductions: 0, effectiveDate: new Date() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="basicSalary">Basic salary</Label>
          <Input id="basicSalary" type="number" min={0} step="0.01" {...register("basicSalary", { valueAsNumber: true })} />
          {errors.basicSalary && <p className="text-xs text-red-600">{errors.basicSalary.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="allowances">Allowances</Label>
          <Input id="allowances" type="number" min={0} step="0.01" {...register("allowances", { valueAsNumber: true })} />
          {errors.allowances && <p className="text-xs text-red-600">{errors.allowances.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deductions">Deductions</Label>
          <Input id="deductions" type="number" min={0} step="0.01" {...register("deductions", { valueAsNumber: true })} />
          {errors.deductions && <p className="text-xs text-red-600">{errors.deductions.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="effectiveDate">Effective date</Label>
          <Input
            id="effectiveDate"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            {...register("effectiveDate", { valueAsDate: true })}
          />
          {errors.effectiveDate && <p className="text-xs text-red-600">{errors.effectiveDate.message}</p>}
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Save salary structure
      </Button>
    </form>
  );
}
