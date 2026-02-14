"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Grid3X3,
  Gift,
  MessageSquare,
  Settings,
  MapPin,
  ClipboardCheck,
  Globe,
  ListChecks,
} from "lucide-react";

const navItems = [
  { label: "דשבורד", href: "/dashboard", icon: LayoutDashboard },
  { label: "אירועים", href: "/events", icon: CalendarDays },
];

const eventNavItems = [
  { label: "מוזמנים", href: "guests", icon: Users },
  { label: "קבוצות", href: "groups", icon: Grid3X3 },
  { label: "הושבה", href: "seating", icon: MapPin },
  { label: "מתנות", href: "gifts", icon: Gift },
  { label: "תקשורת", href: "communication", icon: MessageSquare },
  { label: "קבלת פנים", href: "reception", icon: ClipboardCheck },
  { label: "מיני-סייט", href: "minisite", icon: Globe },
  { label: "משימות", href: "tasks", icon: ListChecks },
];

export function Sidebar({ eventId }: { eventId?: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 z-30 flex h-screen w-64 flex-col border-l bg-sidebar">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold">
          Event<span className="text-primary">Pro</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {eventId && (
          <>
            <div className="mt-6 mb-2 px-3 text-xs font-medium text-muted-foreground">
              ניהול אירוע
            </div>
            <div className="space-y-1">
              {eventNavItems.map((item) => {
                const Icon = item.icon;
                const href = `/events/${eventId}/${item.href}`;
                const isActive = pathname === href;
                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <Settings className="h-4 w-4" />
          הגדרות
        </Link>
      </div>
    </aside>
  );
}
