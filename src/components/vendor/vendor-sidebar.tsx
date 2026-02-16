"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  ImageIcon,
  Package,
  Users2,
  MessageSquare,
  ExternalLink,
  LogOut,
  Store,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { label: "דשבורד", href: "/vendor", icon: LayoutDashboard },
  { label: "פרופיל", href: "/vendor/profile", icon: User },
  { label: "גלריה", href: "/vendor/gallery", icon: ImageIcon },
  { label: "חבילות", href: "/vendor/packages", icon: Package },
  { label: "לידים", href: "/vendor/leads", icon: Users2 },
  { label: "ביקורות", href: "/vendor/reviews", icon: MessageSquare },
];

export function VendorSidebar({ slug }: { slug?: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 z-30 flex h-screen w-64 flex-col border-l bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/vendor" className="text-xl font-bold">
          <span className="text-gradient-brand">Event</span>
          <span className="text-foreground">Pro</span>
        </Link>
        <span className="mr-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
          ספק
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/vendor"
                ? pathname === "/vendor"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 relative",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-sidebar-foreground hover:bg-primary/5 hover:text-primary"
                )}
              >
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full bg-gradient-brand" />
                )}
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t p-4 space-y-1">
        {slug && (
          <Link
            href={`/marketplace/${slug}`}
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-primary/5 hover:text-primary transition-all duration-200"
          >
            <ExternalLink className="h-4 w-4" />
            צפייה בפרופיל
          </Link>
        )}
        <Link
          href="/marketplace"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-primary/5 hover:text-primary transition-all duration-200"
        >
          <Store className="h-4 w-4" />
          מארקטפלייס
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-destructive/5 hover:text-destructive transition-all duration-200 w-full"
        >
          <LogOut className="h-4 w-4" />
          התנתקות
        </button>
      </div>
    </aside>
  );
}
