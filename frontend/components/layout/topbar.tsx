import Link from "next/link";
import { db } from "@/lib/db";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { isAdminRole, type SessionUser } from "@/lib/permissions";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function Topbar({ user }: { user: SessionUser }) {
  const unreadCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav isAdmin={isAdminRole(user.role)} />
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
            D
          </div>
          <span className="font-bold text-slate-900">Dayflow</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-500" />
          )}
        </Link>
        <UserMenu user={user}>
          <Avatar>
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
        </UserMenu>
      </div>
    </header>
  );
}
