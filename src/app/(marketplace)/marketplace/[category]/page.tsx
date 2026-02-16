"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { VendorCard } from "@/components/marketplace/vendor-card";
import { RatingStars } from "@/components/marketplace/rating-stars";
import { AREA_OPTIONS } from "@/lib/vendor-utils";
import {
  ChevronLeft,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { vendors: number };
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 py-8"><Skeleton className="h-96" /></div>}>
      <CategoryContent />
    </Suspense>
  );
}

function CategoryContent() {
  const { category: categorySlug } = useParams<{ category: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = parseInt(searchParams.get("page") || "1");
  const sort = searchParams.get("sort") || "relevance";
  const city = searchParams.get("city") || "";
  const minRating = searchParams.get("minRating") || "";
  const verified = searchParams.get("verified") || "";

  const [filterCity, setFilterCity] = useState(city);
  const [filterRating, setFilterRating] = useState(minRating ? parseInt(minRating) : 0);
  const [filterVerified, setFilterVerified] = useState(verified === "true");

  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (v) sp.set(k, v);
        else sp.delete(k);
      });
      sp.delete("page"); // Reset page on filter change
      router.push(`/marketplace/${categorySlug}?${sp.toString()}`);
    },
    [categorySlug, router, searchParams]
  );

  function applyFilters() {
    updateUrl({
      city: filterCity,
      minRating: filterRating ? String(filterRating) : "",
      verified: filterVerified ? "true" : "",
    });
  }

  function clearFilters() {
    setFilterCity("");
    setFilterRating(0);
    setFilterVerified(false);
    router.push(`/marketplace/${categorySlug}`);
  }

  const { data: categoryData } = useQuery<Category>({
    queryKey: ["category", categorySlug],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/categories");
      const cats = await res.json();
      return cats.find((c: Category) => c.slug === categorySlug);
    },
  });

  const queryString = new URLSearchParams({
    category: categorySlug,
    page: String(page),
    sort,
    ...(city && { city }),
    ...(minRating && { minRating }),
    ...(verified && { verified }),
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ["vendors", categorySlug, page, sort, city, minRating, verified],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/vendors?${queryString}`);
      return res.json();
    },
  });

  const hasActiveFilters = city || minRating || verified;

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* City filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">אזור</Label>
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger>
            <SelectValue placeholder="כל הארץ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">כל הארץ</SelectItem>
            {AREA_OPTIONS.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rating filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">דירוג מינימלי</Label>
        <div className="flex gap-2">
          {[0, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRating(r)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                filterRating === r
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:border-primary/40"
              }`}
            >
              {r === 0 ? "הכל" : `${r}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Verified toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">מאומתים בלבד</Label>
        <Switch checked={filterVerified} onCheckedChange={setFilterVerified} />
      </div>

      <Button onClick={applyFilters} className="w-full">
        החל מסננים
      </Button>
      {hasActiveFilters && (
        <Button onClick={clearFilters} variant="ghost" className="w-full" size="sm">
          נקה מסננים
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb + Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/marketplace" className="hover:text-primary transition-colors">
            מארקטפלייס
          </Link>
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">
            {categoryData?.name || categorySlug}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">
              {categoryData?.name || categorySlug}
            </h1>
            {categoryData?.description && (
              <p className="text-muted-foreground mt-1">{categoryData.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {data?.total !== undefined && (
              <Badge variant="secondary">{data.total} ספקים</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Sort + Filter bar */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-2">
          {/* Mobile filter button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <SlidersHorizontal className="ml-2 h-4 w-4" />
                מסננים
                {hasActiveFilters && (
                  <span className="mr-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>מסננים</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterPanel />
              </div>
            </SheetContent>
          </Sheet>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              נקה מסננים
            </button>
          )}
        </div>

        <Select
          value={sort}
          onValueChange={(v) => updateUrl({ sort: v })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="מיון" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">רלוונטיות</SelectItem>
            <SelectItem value="rating">דירוג</SelectItem>
            <SelectItem value="price_asc">מחיר: נמוך לגבוה</SelectItem>
            <SelectItem value="price_desc">מחיר: גבוה לנמוך</SelectItem>
            <SelectItem value="newest">חדשים</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-card rounded-xl border p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              מסננים
            </h3>
            <FilterPanel />
          </div>
        </aside>

        {/* Vendors Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : data?.vendors?.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.vendors.map((vendor: Record<string, unknown>) => (
                  <VendorCard key={vendor.id as string} vendor={vendor as never} />
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {page > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateUrl({ page: String(page - 1) })}
                    >
                      הקודם
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground">
                    עמוד {page} מתוך {data.totalPages}
                  </span>
                  {page < data.totalPages && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateUrl({ page: String(page + 1) })}
                    >
                      הבא
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg mb-2">לא נמצאו ספקים</p>
              <p className="text-sm">נסו לשנות את המסננים או לחפש קטגוריה אחרת</p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline" size="sm" className="mt-4">
                  נקה מסננים
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
