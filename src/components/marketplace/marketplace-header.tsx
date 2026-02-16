"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Store, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarketplaceHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  const isVendor = (session?.user as { role?: string })?.role === "VENDOR";

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold flex-shrink-0">
          <span className="text-gradient-brand">Event</span>
          <span className="text-foreground">Pro</span>
        </Link>

        {/* Desktop Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפשו ספקים, צלמים, DJ..."
              className="w-full h-10 rounded-lg border bg-muted/30 pr-10 pl-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>
        </form>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-3">
          <Link
            href="/marketplace"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            כל הספקים
          </Link>
          {session ? (
            <>
              {isVendor ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/vendor">
                    <Store className="ml-2 h-4 w-4" />
                    דשבורד ספק
                  </Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard">דשבורד</Link>
                </Button>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                התחברות
              </Link>
              <Button asChild size="sm">
                <Link href="/register">הרשמה</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-primary/30 text-primary">
                <Link href="/register-vendor">
                  <Store className="ml-2 h-3.5 w-3.5" />
                  הרשמת ספקים
                </Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפשו ספקים..."
                className="w-full h-10 rounded-lg border bg-muted/30 pr-10 pl-4 text-sm placeholder:text-muted-foreground"
              />
            </div>
          </form>
          <div className="flex flex-col gap-2">
            <Link href="/marketplace" className="text-sm py-2" onClick={() => setMobileOpen(false)}>
              כל הספקים
            </Link>
            {session ? (
              <Button asChild size="sm">
                <Link href={isVendor ? "/vendor" : "/dashboard"}>
                  {isVendor ? "דשבורד ספק" : "דשבורד"}
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link href="/login">התחברות</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register-vendor">
                    <Store className="ml-2 h-3.5 w-3.5" />
                    הרשמת ספקים
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
