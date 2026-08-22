"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const employeeLinks = [
  ["/dashboard", "Dashboard"],
  ["/attendance", "Attendance"],
  ["/leave", "Leave"],
  ["/payroll", "Payroll"],
  ["/notifications", "Notifications"],
  ["/profile", "Profile"],
] as const;

const adminLinks = [
  ["/admin/dashboard", "Dashboard"],
  ["/admin/employees", "Employees"],
  ["/admin/attendance", "Attendance"],
  ["/admin/leave", "Leave Approvals"],
  ["/admin/payroll", "Payroll"],
  ["/admin/reports", "Reports"],
  ["/notifications", "Notifications"],
  ["/profile", "Profile"],
] as const;

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {links.map(([href, label]) => (
          <DropdownMenuItem key={href} asChild className={pathname === href ? "bg-slate-100 font-medium" : ""}>
            <Link href={href}>{label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
