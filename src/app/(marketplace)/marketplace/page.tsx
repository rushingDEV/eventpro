"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryCard } from "@/components/marketplace/category-card";
import { VendorCard } from "@/components/marketplace/vendor-card";
import { Search, ArrowLeft, Store, Sparkles, CheckCircle2, Handshake } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  _count: { vendors: number };
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<MarketplaceLoading />}>
      <MarketplaceContent />
    </Suspense>
  );
}

function MarketplaceLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-8">
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const { data: categories, isLoading: catsLoading } = useQuery<Category[]>({
    queryKey: ["marketplace-categories"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/categories");
      return res.json();
    },
  });

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["marketplace-featured"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/vendors?featured=true&limit=6");
      return res.json();
    },
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["marketplace-search", searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/vendors?search=${encodeURIComponent(searchQuery)}&limit=12`);
      return res.json();
    },
    enabled: !!searchQuery,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (localSearch.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(localSearch.trim())}`);
    } else {
      router.push("/marketplace");
    }
  }

  const steps = [
    { icon: Search, title: "חפשו", description: "בחרו קטגוריה ומצאו ספקים מתאימים" },
    { icon: CheckCircle2, title: "השוו", description: "קראו ביקורות, צפו בגלריות והשוו מחירים" },
    { icon: Handshake, title: "סגרו", description: "פנו ישירות לספק וסגרו עסקה" },
  ];

  // If searching, show search results
  if (searchQuery) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-lg">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="חפשו ספקים..."
              className="w-full h-12 rounded-xl border bg-card pr-12 pl-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>
        </form>

        <h2 className="text-xl font-bold mb-4">
          תוצאות חיפוש: &quot;{searchQuery}&quot;
          {searchResults && (
            <span className="text-muted-foreground font-normal text-base mr-2">
              ({searchResults.total} תוצאות)
            </span>
          )}
        </h2>

        {searchLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : searchResults?.vendors?.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searchResults.vendors.map((vendor: Record<string, unknown>) => (
              <VendorCard key={vendor.id as string} vendor={vendor as never} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>לא נמצאו ספקים. נסו חיפוש אחר.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-hero py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            מארקטפלייס ספקים
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight">
            כל הספקים לאירוע{" "}
            <span className="text-gradient-brand">המושלם</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            צלמים, DJ, עיצוב פרחים, קייטרינג ועוד — כל ספקי האירועים
            המובילים בישראל במקום אחד
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-lg mx-auto pt-2">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="חפשו ספקים, צלמים, DJ..."
                className="w-full h-14 rounded-2xl border-2 border-primary/20 bg-white pr-12 pl-28 text-base shadow-lg shadow-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-gradient-brand hover:opacity-90 text-white"
              >
                חיפוש
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-8">קטגוריות</h2>
          {catsLoading ? (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {categories?.filter(c => c.slug !== "other").map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Vendors */}
      <section className="py-14 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black">ספקים מובילים</h2>
            <Link
              href="/marketplace?sort=rating"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              כל הספקים
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          {featuredLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : featuredData?.vendors?.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredData.vendors.map((vendor: Record<string, unknown>) => (
                <VendorCard key={vendor.id as string} vendor={vendor as never} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>ספקים מובילים יופיעו כאן בקרוב</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">איך זה עובד</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="text-center">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary mb-1">
                    שלב {i + 1}
                  </div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA for Vendors */}
      <section className="py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-l from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,oklch(0.45_0.16_350/0.15),transparent)] pointer-events-none" />
            <div className="relative">
              <Store className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-black">?אתם ספקי אירועים</h2>
              <p className="text-gray-300 text-lg max-w-xl mx-auto">
                הצטרפו ל-EventPro וקבלו חשיפה לאלפי זוגות שמתכננים אירועים.
                ניהול לידים, גלריה מקצועית, וביקורות מאומתים.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <Button asChild size="lg" className="bg-gradient-brand hover:opacity-90 text-white">
                  <Link href="/register-vendor">
                    <Store className="ml-2 h-4 w-4" />
                    הירשמו כספקים
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
