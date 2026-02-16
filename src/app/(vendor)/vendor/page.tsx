"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  ImageIcon,
  Package,
  Users2,
  MessageSquare,
  Eye,
  Star,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

const tierLabels: Record<string, string> = {
  FREE: "חינם",
  BASIC: "בסיסי",
  PREMIUM: "פרימיום",
  DIAMOND: "יהלום",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "טיוטה", color: "bg-yellow-100 text-yellow-700" },
  PENDING_REVIEW: { label: "ממתין לאישור", color: "bg-blue-100 text-blue-700" },
  ACTIVE: { label: "פעיל", color: "bg-green-100 text-green-700" },
  SUSPENDED: { label: "מושהה", color: "bg-red-100 text-red-700" },
  INACTIVE: { label: "לא פעיל", color: "bg-gray-100 text-gray-700" },
};

export default function VendorDashboard() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/profile");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["vendor-leads"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/leads");
      return res.json();
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["vendor-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/reviews");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">לא נמצא פרופיל ספק</h2>
        <p className="text-muted-foreground mb-4">
          יש ליצור פרופיל ספק כדי לגשת לדשבורד
        </p>
        <Button asChild>
          <Link href="/register-vendor">הרשמה כספק</Link>
        </Button>
      </div>
    );
  }

  const statusInfo = statusLabels[profile.status] || statusLabels.DRAFT;
  const newLeads = Array.isArray(leads) ? leads.filter((l: { status: string }) => l.status === "NEW").length : 0;
  const totalLeads = Array.isArray(leads) ? leads.length : 0;
  const totalReviews = Array.isArray(reviews) ? reviews.length : 0;

  const quickActions = [
    {
      label: "פרופיל",
      href: "/vendor/profile",
      icon: User,
      stat: `${profile.completionScore}%`,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "גלריה",
      href: "/vendor/gallery",
      icon: ImageIcon,
      stat: `${profile._count.images} תמונות`,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "חבילות",
      href: "/vendor/packages",
      icon: Package,
      stat: `${profile._count.packages}`,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "לידים",
      href: "/vendor/leads",
      icon: Users2,
      stat: newLeads > 0 ? `${newLeads} חדשים` : `${totalLeads}`,
      color: newLeads > 0 ? "text-primary bg-primary/10" : "text-orange-600 bg-orange-50",
    },
    {
      label: "ביקורות",
      href: "/vendor/reviews",
      icon: MessageSquare,
      stat: `${totalReviews}`,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "דירוג",
      href: "/vendor/reviews",
      icon: Star,
      stat: profile.ratingAverage > 0 ? profile.ratingAverage.toFixed(1) : "—",
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{profile.businessName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={statusInfo.color} variant="secondary">
              {statusInfo.label}
            </Badge>
            <Badge variant="secondary">
              {tierLabels[profile.subscriptionTier] || "חינם"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {profile.category.name}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Completion */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">השלמת פרופיל</h3>
            <span className="text-sm font-bold text-primary">
              {profile.completionScore}%
            </span>
          </div>
          <Progress value={profile.completionScore} className="h-2" />
          {profile.completionScore < 50 && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                השלימו לפחות 50% מהפרופיל כדי להופיע במארקטפלייס
              </p>
              <Button asChild size="sm" variant="outline" className="mr-auto flex-shrink-0">
                <Link href="/vendor/profile">
                  השלימו עכשיו
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{action.label}</div>
                      <div className="text-lg font-bold mt-0.5">
                        {action.stat}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Leads */}
      {Array.isArray(leads) && leads.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">לידים אחרונים</CardTitle>
              <Link
                href="/vendor/leads"
                className="text-sm text-primary hover:underline"
              >
                צפו בהכל
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leads.slice(0, 5).map((lead: { id: string; contactName: string; status: string; createdAt: string; eventType?: string }) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium">{lead.contactName}</div>
                    <div className="text-xs text-muted-foreground">
                      {lead.eventType || "אירוע"} &middot;{" "}
                      {new Date(lead.createdAt).toLocaleDateString("he-IL")}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      lead.status === "NEW"
                        ? "bg-primary/10 text-primary"
                        : ""
                    }
                  >
                    {lead.status === "NEW"
                      ? "חדש"
                      : lead.status === "CONTACTED"
                      ? "נוצר קשר"
                      : lead.status === "WON"
                      ? "נסגר"
                      : lead.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
