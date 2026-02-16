"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, BadgeCheck, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "./rating-stars";
import { formatPriceRange } from "@/lib/vendor-utils";

interface VendorCardProps {
  vendor: {
    slug: string;
    businessName: string;
    city: string;
    coverUrl: string | null;
    logoUrl: string | null;
    ratingAverage: number;
    reviewCount: number;
    priceRangeMin: number | null;
    priceRangeMax: number | null;
    isVerified: boolean;
    isFeatured: boolean;
    shortDescription: string | null;
    category: { name: string; slug: string };
    images: { url: string }[];
  };
}

export function VendorCard({ vendor }: VendorCardProps) {
  const coverImage = vendor.coverUrl || vendor.images?.[0]?.url;

  return (
    <Link href={`/marketplace/${vendor.category.slug}/${vendor.slug}`}>
      <div className="group relative bg-card rounded-xl border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full">
        {/* Cover Image */}
        <div className="relative h-48 bg-muted overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={vendor.businessName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-bl from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-4xl font-black text-primary/20">
                {vendor.businessName[0]}
              </span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Featured badge */}
          {vendor.isFeatured && (
            <Badge className="absolute top-3 right-3 bg-gradient-brand text-white border-0 text-xs">
              מומלץ
            </Badge>
          )}

          {/* Favorite button */}
          <button
            className="absolute top-3 left-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: toggle favorite
            }}
          >
            <Heart className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Logo */}
          {vendor.logoUrl && (
            <div className="absolute bottom-3 right-3 h-12 w-12 rounded-lg overflow-hidden border-2 border-white shadow-md bg-white">
              <Image
                src={vendor.logoUrl}
                alt={`${vendor.businessName} logo`}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base group-hover:text-primary transition-colors line-clamp-1">
              {vendor.businessName}
              {vendor.isVerified && (
                <BadgeCheck className="inline-block h-4 w-4 text-blue-500 mr-1" />
              )}
            </h3>
          </div>

          {vendor.shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {vendor.shortDescription}
            </p>
          )}

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {vendor.city}
            </span>
            <span className="text-xs">
              {vendor.category.name}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <RatingStars
              rating={vendor.ratingAverage}
              size="sm"
              count={vendor.reviewCount}
            />
            <span className="text-sm font-medium text-primary" dir="ltr">
              {formatPriceRange(vendor.priceRangeMin, vendor.priceRangeMax)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
