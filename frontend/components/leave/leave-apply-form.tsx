"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { leaveApplySchema, type LeaveApplyInput } from "@/lib/validations";
import { applyLeaveAction } from "@/app/(app)/leave/actions";

export function LeaveApplyForm() {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeaveApplyInput>({
    resolver: zodResolver(leaveApplySchema),
    defaultValues: { leaveType: "PAID" },
  });

  const leaveType = watch("leaveType");

  const onSubmit = async (data: LeaveApplyInput) => {
    const result = await applyLeaveAction(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Leave request submitted successfully.");
    reset({ leaveType: "PAID", startDate: undefined, endDate: undefined, remarks: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Apply for leave
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply for leave</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="leaveType">Leave type</Label>
            <Select value={leaveType} onValueChange={(v) => setValue("leaveType", v as LeaveApplyInput["leaveType"])}>
              <SelectTrigger id="leaveType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="SICK">Sick</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="date" {...register("startDate", { valueAsDate: true })} />
              {errors.startDate && <p className="text-xs text-red-600">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" type="date" {...register("endDate", { valueAsDate: true })} />
              {errors.endDate && <p className="text-xs text-red-600">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" placeholder="Reason for leave..." {...register("remarks")} />
            {errors.remarks && <p className="text-xs text-red-600">{errors.remarks.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
