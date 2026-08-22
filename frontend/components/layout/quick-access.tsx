"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { UserCircle, CalendarCheck, CalendarClock, Wallet, LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const items: { href?: string; label: string; icon: LucideIcon; action?: "logout" }[] = [
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/leave", label: "Leave Requests", icon: CalendarClock },
  { href: "/payroll", label: "Payroll", icon: Wallet },
  { label: "Logout", icon: LogOut, action: "logout" },
];

export function QuickAccess() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        const body = (
          <>
            <Icon className={cn("h-5 w-5", item.action === "logout" ? "text-red-500" : "text-slate-700")} />
            <span className={cn("text-sm font-medium", item.action === "logout" ? "text-red-600" : "text-slate-700")}>
              {item.label}
            </span>
          </>
        );
        const className =
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-colors hover:bg-slate-50";

        if (item.action === "logout") {
          return (
            <button key={item.label} onClick={() => signOut({ callbackUrl: "/login" })} className={className}>
              {body}
            </button>
          );
        }
        return (
          <Link key={item.href} href={item.href!} className={className}>
            {body}
          </Link>
        );
      })}
    </div>
  );
}
