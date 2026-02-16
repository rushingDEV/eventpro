"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { RatingStars } from "@/components/marketplace/rating-stars";
import { VendorContactForm } from "@/components/marketplace/vendor-contact-form";
import { formatPriceRange } from "@/lib/vendor-utils";
import {
  BadgeCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  MessageCircle,
  ChevronLeft,
  Calendar,
  Users2,
  Briefcase,
  Check,
  Star,
  Heart,
  Share2,
  ExternalLink,
  X,
} from "lucide-react";
import { useState } from "react";

interface VendorImage {
  id: string;
  url: string;
  caption: string | null;
}

interface VendorPackage {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  features: string[];
  isPopular: boolean;
}

interface VendorReview {
  id: string;
  rating: number;
  title: string | null;
  text: string | null;
  eventType: string | null;
  createdAt: string;
  vendorResponse: string | null;
  user: { name: string };
}

interface VendorData {
  id: string;
  businessName: string;
  slug: string;
  bio: string | null;
  shortDescription: string | null;
  city: string;
  areasServed: string[];
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  whatsappNumber: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  experienceYears: number | null;
  eventsCompleted: number | null;
  isVerified: boolean;
  isFeatured: boolean;
  ratingAverage: number;
  reviewCount: number;
  category: { name: string; slug: string };
  images: VendorImage[];
  packages: VendorPackage[];
  reviews: VendorReview[];
  ratingDistribution: { rating: number; count: number }[];
  _count: { reviews: number; favorites: number };
}

export default function VendorProfilePage() {
  const { category: categorySlug, slug } = useParams<{
    category: string;
    slug: string;
  }>();
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { data: vendor, isLoading } = useQuery<VendorData>({
    queryKey: ["vendor", slug],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/vendors/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-20" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">ספק לא נמצא</h2>
        <Button asChild variant="outline">
          <Link href="/marketplace">חזרה למארקטפלייס</Link>
        </Button>
      </div>
    );
  }

  const coverImage = vendor.coverUrl || vendor.images?.[0]?.url;
  const maskedPhone = vendor.contactPhone
    ? vendor.contactPhone.slice(0, -4) + "****"
    : null;

  return (
    <div>
      {/* Cover Image */}
      <div className="relative h-56 sm:h-72 md:h-80 bg-muted overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={vendor.businessName}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-bl from-primary/30 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Breadcrumb on cover */}
        <div className="absolute top-4 right-4 sm:right-6">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Link href="/marketplace" className="hover:text-white transition-colors">
              מארקטפלייס
            </Link>
            <ChevronLeft className="h-3.5 w-3.5" />
            <Link
              href={`/marketplace/${categorySlug}`}
              className="hover:text-white transition-colors"
            >
              {vendor.category.name}
            </Link>
          </div>
        </div>

        {/* Vendor info on cover */}
        <div className="absolute bottom-0 right-0 left-0 p-6 sm:p-8">
          <div className="max-w-6xl mx-auto flex items-end gap-4">
            {/* Logo */}
            {vendor.logoUrl && (
              <div className="hidden sm:block h-20 w-20 rounded-xl overflow-hidden border-2 border-white shadow-lg flex-shrink-0 bg-white">
                <Image
                  src={vendor.logoUrl}
                  alt={`${vendor.businessName} logo`}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div className="text-white">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black">
                  {vendor.businessName}
                </h1>
                {vendor.isVerified && (
                  <BadgeCheck className="h-6 w-6 text-blue-400" />
                )}
                {vendor.isFeatured && (
                  <Badge className="bg-gradient-brand text-white border-0">
                    מומלץ
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-white/80 text-sm flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {vendor.city}
                </span>
                <span>{vendor.category.name}</span>
                {vendor.reviewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {vendor.ratingAverage.toFixed(1)} ({vendor.reviewCount})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons on cover */}
        <div className="absolute top-4 left-4 flex gap-2">
          <button className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors text-white">
            <Heart className="h-4 w-4" />
          </button>
          <button className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors text-white">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Left: Main Content (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3">
              {vendor.experienceYears && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                  <Briefcase className="h-3.5 w-3.5" />
                  {vendor.experienceYears} שנות ניסיון
                </Badge>
              )}
              {vendor.eventsCompleted && vendor.eventsCompleted > 0 && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                  <Calendar className="h-3.5 w-3.5" />
                  {vendor.eventsCompleted} אירועים
                </Badge>
              )}
              {vendor.areasServed.length > 0 && (
                <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                  <MapPin className="h-3.5 w-3.5" />
                  {vendor.areasServed.join(", ")}
                </Badge>
              )}
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 font-bold" dir="ltr">
                {formatPriceRange(vendor.priceRangeMin, vendor.priceRangeMax)}
              </Badge>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="about" dir="rtl">
              <TabsList className="w-full justify-start bg-muted/50 h-11">
                <TabsTrigger value="about">אודות</TabsTrigger>
                <TabsTrigger value="gallery">
                  גלריה ({vendor.images.length})
                </TabsTrigger>
                <TabsTrigger value="packages">
                  חבילות ({vendor.packages.length})
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  ביקורות ({vendor.reviewCount})
                </TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6 space-y-6">
                {vendor.bio && (
                  <div>
                    <h2 className="text-lg font-bold mb-2">אודות</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {vendor.bio}
                    </p>
                  </div>
                )}
                {vendor.shortDescription && !vendor.bio && (
                  <p className="text-muted-foreground">{vendor.shortDescription}</p>
                )}

                {/* Social Links */}
                {(vendor.website || vendor.instagramUrl || vendor.facebookUrl) && (
                  <div>
                    <h3 className="text-sm font-bold mb-3">קישורים</h3>
                    <div className="flex gap-2">
                      {vendor.website && (
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                      {vendor.instagramUrl && (
                        <a
                          href={vendor.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center hover:bg-pink-100 hover:text-pink-600 transition-colors"
                        >
                          <Instagram className="h-4 w-4" />
                        </a>
                      )}
                      {vendor.facebookUrl && (
                        <a
                          href={vendor.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        >
                          <Facebook className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Gallery Tab */}
              <TabsContent value="gallery" className="mt-6">
                {vendor.images.length > 0 ? (
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                    {vendor.images.map((img) => (
                      <Dialog key={img.id}>
                        <DialogTrigger asChild>
                          <button
                            className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer"
                            onClick={() => setLightboxImage(img.url)}
                          >
                            <Image
                              src={img.url}
                              alt={img.caption || vendor.businessName}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0 bg-black border-0">
                          <div className="relative aspect-[16/10]">
                            <Image
                              src={img.url}
                              alt={img.caption || vendor.businessName}
                              fill
                              className="object-contain"
                            />
                          </div>
                          {img.caption && (
                            <div className="p-4 text-white text-sm text-center">
                              {img.caption}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>אין תמונות עדיין</p>
                  </div>
                )}
              </TabsContent>

              {/* Packages Tab */}
              <TabsContent value="packages" className="mt-6">
                {vendor.packages.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {vendor.packages.map((pkg) => (
                      <Card
                        key={pkg.id}
                        className={`relative ${
                          pkg.isPopular
                            ? "border-primary shadow-md shadow-primary/10"
                            : ""
                        }`}
                      >
                        {pkg.isPopular && (
                          <div className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-0.5 rounded-full">
                            הכי פופולרי
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{pkg.name}</CardTitle>
                          {pkg.price && (
                            <div className="text-2xl font-black text-primary" dir="ltr">
                              ₪{pkg.price.toLocaleString()}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          {pkg.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {pkg.description}
                            </p>
                          )}
                          {pkg.features.length > 0 && (
                            <ul className="space-y-2">
                              {pkg.features.map((f, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>לא הוגדרו חבילות עדיין</p>
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6 space-y-6">
                {/* Review Summary */}
                {vendor.reviewCount > 0 && (
                  <Card>
                    <CardContent className="py-6">
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-4xl font-black">
                            {vendor.ratingAverage.toFixed(1)}
                          </div>
                          <RatingStars rating={vendor.ratingAverage} size="md" />
                          <div className="text-sm text-muted-foreground mt-1">
                            {vendor.reviewCount} ביקורות
                          </div>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {vendor.ratingDistribution.map((d) => (
                            <div key={d.rating} className="flex items-center gap-2 text-sm">
                              <span className="w-4 text-muted-foreground">{d.rating}</span>
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{
                                    width: `${
                                      vendor.reviewCount > 0
                                        ? (d.count / vendor.reviewCount) * 100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                              <span className="w-6 text-muted-foreground text-xs">
                                {d.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews List */}
                {vendor.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {vendor.reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {review.user.name[0]}
                              </div>
                              <div>
                                <div className="text-sm font-medium">
                                  {review.user.name}
                                </div>
                                {review.eventType && (
                                  <div className="text-xs text-muted-foreground">
                                    {review.eventType}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(review.createdAt), "dd/MM/yyyy", {
                                locale: he,
                              })}
                            </div>
                          </div>
                          <RatingStars rating={review.rating} size="sm" />
                          {review.title && (
                            <h4 className="font-bold text-sm mt-2">
                              {review.title}
                            </h4>
                          )}
                          {review.text && (
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {review.text}
                            </p>
                          )}
                          {review.vendorResponse && (
                            <div className="mt-3 mr-4 p-3 bg-muted/50 rounded-lg border-r-2 border-primary">
                              <div className="text-xs font-medium text-primary mb-1">
                                תגובת הספק
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {review.vendorResponse}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>אין ביקורות עדיין</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Sticky Contact Sidebar */}
          <div className="md:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Contact Card */}
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">צרו קשר</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Phone */}
                  {vendor.contactPhone && (
                    <div>
                      {phoneRevealed ? (
                        <a
                          href={`tel:${vendor.contactPhone}`}
                          className="flex items-center gap-2 w-full p-3 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors"
                          dir="ltr"
                        >
                          <Phone className="h-4 w-4" />
                          {vendor.contactPhone}
                        </a>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => setPhoneRevealed(true)}
                        >
                          <Phone className="h-4 w-4" />
                          <span dir="ltr">{maskedPhone}</span>
                          <span className="text-xs text-primary mr-auto">
                            חשפו
                          </span>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* WhatsApp */}
                  {(vendor.whatsappNumber || vendor.contactPhone) && (
                    <a
                      href={`https://wa.me/972${(vendor.whatsappNumber || vendor.contactPhone || "").replace(/^0/, "").replace(/[-\s]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}

                  <Separator />

                  {/* Contact Form */}
                  <VendorContactForm
                    vendorId={vendor.id}
                    vendorName={vendor.businessName}
                  />
                </CardContent>
              </Card>

              {/* Price Card */}
              {(vendor.priceRangeMin || vendor.priceRangeMax) && (
                <Card>
                  <CardContent className="py-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">
                      טווח מחירים
                    </div>
                    <div className="text-xl font-black text-primary" dir="ltr">
                      {formatPriceRange(vendor.priceRangeMin, vendor.priceRangeMax)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t p-3 z-40">
        <div className="flex gap-2">
          {vendor.contactPhone && (
            <a
              href={`tel:${vendor.contactPhone}`}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg bg-primary text-primary-foreground font-bold"
            >
              <Phone className="h-4 w-4" />
              התקשרו
            </a>
          )}
          {(vendor.whatsappNumber || vendor.contactPhone) && (
            <a
              href={`https://wa.me/972${(vendor.whatsappNumber || vendor.contactPhone || "").replace(/^0/, "").replace(/[-\s]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-lg bg-green-500 text-white font-bold"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
