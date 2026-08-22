"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime, formatWorkingHours } from "@/lib/utils";
import { checkInAction, checkOutAction } from "@/app/(app)/attendance/actions";

type Props = {
  checkIn: string | null;
  checkOut: string | null;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | null;
};

const statusVariant: Record<string, "success" | "warning" | "destructive" | "info"> = {
  PRESENT: "success",
  HALF_DAY: "warning",
  ABSENT: "destructive",
  LEAVE: "info",
};

export function CheckInOutCard({ checkIn, checkOut, status }: Props) {
  const [state, setState] = useState({ checkIn, checkOut, status });
  const [pending, startTransition] = useTransition();

  const handleCheckIn = () => {
    startTransition(async () => {
      const result = await checkInAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setState({ checkIn: new Date().toISOString(), checkOut: state.checkOut, status: "PRESENT" });
      toast.success("Checked in successfully.");
    });
  };

  const handleCheckOut = () => {
    startTransition(async () => {
      const result = await checkOutAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setState((s) => ({ ...s, checkOut: new Date().toISOString() }));
      toast.success("Checked out successfully.");
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today&apos;s Attendance</CardTitle>
        {state.status && <Badge variant={statusVariant[state.status]}>{state.status.replace("_", " ")}</Badge>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Check-in</p>
            <p className="text-lg font-semibold text-slate-900">{formatTime(state.checkIn)}</p>
          </div>
          <div>
            <p className="text-slate-400">Check-out</p>
            <p className="text-lg font-semibold text-slate-900">{formatTime(state.checkOut)}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Working hours: {formatWorkingHours(state.checkIn, state.checkOut)}
        </p>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleCheckIn} disabled={pending || !!state.checkIn}>
            <LogIn className="h-4 w-4" />
            Check in
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            onClick={handleCheckOut}
            disabled={pending || !state.checkIn || !!state.checkOut}
          >
            <LogOut className="h-4 w-4" />
            Check out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
