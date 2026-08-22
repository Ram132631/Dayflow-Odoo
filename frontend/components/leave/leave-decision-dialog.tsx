"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { decideLeaveAction } from "@/app/(app)/admin/leave/actions";

export function LeaveDecisionDialog({ leaveId, decision }: { leaveId: string; decision: "APPROVED" | "REJECTED" }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await decideLeaveAction({ leaveId, decision, adminComment: comment });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(decision === "APPROVED" ? "Leave request approved." : "Leave request rejected.");
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={decision === "APPROVED" ? "default" : "outline"}>
          {decision === "APPROVED" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {decision === "APPROVED" ? "Approve" : "Reject"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{decision === "APPROVED" ? "Approve" : "Reject"} leave request</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="adminComment">Comment (optional)</Label>
          <Textarea
            id="adminComment"
            placeholder="Add a comment for the employee..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending}>
            Confirm {decision === "APPROVED" ? "approval" : "rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
