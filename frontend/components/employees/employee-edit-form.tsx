"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { employeeAdminUpdateSchema, type EmployeeAdminUpdateInput } from "@/lib/validations";
import { updateEmployeeAction } from "@/app/(app)/admin/employees/actions";

function toDateInputValue(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

export function EmployeeEditForm({
  employeeId,
  defaults,
}: {
  employeeId: string;
  defaults: {
    name: string;
    phone: string | null;
    address: string | null;
    department: string;
    position: string;
    joiningDate: string;
    role: "EMPLOYEE" | "HR" | "ADMIN";
  };
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeAdminUpdateInput>({
    resolver: zodResolver(employeeAdminUpdateSchema),
    defaultValues: {
      name: defaults.name,
      phone: defaults.phone ?? "",
      address: defaults.address ?? "",
      department: defaults.department,
      position: defaults.position,
      joiningDate: new Date(defaults.joiningDate),
      role: defaults.role,
    },
  });

  const role = watch("role");

  const onSubmit = async (data: EmployeeAdminUpdateInput) => {
    const result = await updateEmployeeAction(employeeId, data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Employee updated.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
          {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("address")} />
          {errors.address && <p className="text-xs text-red-600">{errors.address.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="department">Department</Label>
          <Input id="department" {...register("department")} />
          {errors.department && <p className="text-xs text-red-600">{errors.department.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="position">Position</Label>
          <Input id="position" {...register("position")} />
          {errors.position && <p className="text-xs text-red-600">{errors.position.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="joiningDate">Joining date</Label>
          <Input
            id="joiningDate"
            type="date"
            defaultValue={toDateInputValue(new Date(defaults.joiningDate))}
            {...register("joiningDate", { valueAsDate: true })}
          />
          {errors.joiningDate && <p className="text-xs text-red-600">{errors.joiningDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(v) => setValue("role", v as EmployeeAdminUpdateInput["role"])}>
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
