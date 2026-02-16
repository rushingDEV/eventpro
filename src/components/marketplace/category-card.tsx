"use client";

import Link from "next/link";
import {
  Camera,
  Music,
  Flower2,
  Shirt,
  UtensilsCrossed,
  Mail,
  CakeSlice,
  Car,
  ImageIcon,
  Sparkles,
  Lightbulb,
  PartyPopper,
  Clapperboard,
  ScrollText,
  FerrisWheel,
  PlusCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  camera: Camera,
  music: Music,
  "flower-2": Flower2,
  shirt: Shirt,
  "utensils-crossed": UtensilsCrossed,
  mail: Mail,
  "cake-slice": CakeSlice,
  car: Car,
  image: ImageIcon,
  sparkles: Sparkles,
  lightbulb: Lightbulb,
  "party-popper": PartyPopper,
  clapperboard: Clapperboard,
  "scroll-text": ScrollText,
  "ferris-wheel": FerrisWheel,
  "plus-circle": PlusCircle,
};

interface CategoryCardProps {
  category: {
    slug: string;
    name: string;
    icon: string;
    _count: { vendors: number };
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = iconMap[category.icon] || PlusCircle;
  const vendorCount = category._count.vendors;

  return (
    <Link href={`/marketplace/${category.slug}`}>
      <div className="group relative bg-card rounded-xl border p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300 text-center">
        <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-bold text-sm">{category.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {vendorCount > 0 ? `${vendorCount} ספקים` : "בקרוב"}
        </p>
      </div>
    </Link>
  );
}
