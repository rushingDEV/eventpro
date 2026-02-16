/**
 * Generate a URL-friendly slug from a business name.
 * Handles Hebrew by transliterating or falling back to a cuid suffix.
 */
export function generateSlug(businessName: string): string {
  const slug = businessName
    .toLowerCase()
    .trim()
    .replace(/[^\w\u0590-\u05FF\s-]/g, "") // Keep Hebrew, Latin, numbers, hyphens
    .replace(/[\s_]+/g, "-") // Spaces/underscores → hyphens
    .replace(/-+/g, "-") // Multiple hyphens → single
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens

  // If slug is empty (rare), use a fallback
  return slug || "vendor";
}

/**
 * Ensure slug uniqueness by appending a numeric suffix if needed.
 */
export function makeUniqueSlug(slug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(slug)) return slug;
  let i = 2;
  while (existingSlugs.includes(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

/**
 * Compute profile completion score (0–100) based on filled fields.
 */
export function computeCompletionScore(profile: {
  businessName?: string | null;
  bio?: string | null;
  shortDescription?: string | null;
  city?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  experienceYears?: number | null;
  website?: string | null;
  instagramUrl?: string | null;
  areasServed?: string[];
  imageCount?: number;
  packageCount?: number;
}): number {
  const checks = [
    { weight: 10, filled: !!profile.businessName },
    { weight: 15, filled: !!profile.bio && profile.bio.length > 20 },
    { weight: 5, filled: !!profile.shortDescription },
    { weight: 5, filled: !!profile.city },
    { weight: 5, filled: !!profile.contactPhone },
    { weight: 5, filled: !!profile.contactEmail },
    { weight: 10, filled: !!profile.logoUrl },
    { weight: 10, filled: !!profile.coverUrl },
    { weight: 5, filled: profile.priceRangeMin != null && profile.priceRangeMax != null },
    { weight: 5, filled: !!profile.experienceYears },
    { weight: 5, filled: !!profile.website || !!profile.instagramUrl },
    { weight: 5, filled: (profile.areasServed?.length || 0) > 0 },
    { weight: 10, filled: (profile.imageCount || 0) >= 3 },
    { weight: 5, filled: (profile.packageCount || 0) >= 1 },
  ];

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + (c.filled ? c.weight : 0), 0);
  return Math.round((earned / totalWeight) * 100);
}

/**
 * Recompute rating average from all ratings.
 */
export function computeRatingAverage(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // One decimal
}

/**
 * Format price range for display.
 */
export function formatPriceRange(min?: number | null, max?: number | null): string {
  if (!min && !max) return "צרו קשר לתמחור";
  if (min && max) return `₪${min.toLocaleString()} - ₪${max.toLocaleString()}`;
  if (min) return `החל מ-₪${min.toLocaleString()}`;
  return `עד ₪${max!.toLocaleString()}`;
}

/**
 * Israeli area options for vendor location filter.
 */
export const AREA_OPTIONS = [
  "מרכז",
  "שרון",
  "גוש דן",
  "צפון",
  "דרום",
  "ירושלים והסביבה",
  "חיפה והקריות",
  "השפלה",
  "כל הארץ",
] as const;
