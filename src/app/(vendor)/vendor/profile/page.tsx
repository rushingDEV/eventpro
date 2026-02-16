"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AREA_OPTIONS } from "@/lib/vendor-utils";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

export default function VendorProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/profile");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["marketplace-categories"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/categories");
      return res.json();
    },
  });

  const [form, setForm] = useState({
    businessName: "",
    shortDescription: "",
    bio: "",
    categoryId: "",
    city: "",
    areasServed: [] as string[],
    contactPhone: "",
    contactEmail: "",
    website: "",
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    whatsappNumber: "",
    priceRangeMin: "",
    priceRangeMax: "",
    experienceYears: "",
    eventsCompleted: "",
    availabilityNote: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName || "",
        shortDescription: profile.shortDescription || "",
        bio: profile.bio || "",
        categoryId: profile.categoryId || "",
        city: profile.city || "",
        areasServed: profile.areasServed || [],
        contactPhone: profile.contactPhone || "",
        contactEmail: profile.contactEmail || "",
        website: profile.website || "",
        instagramUrl: profile.instagramUrl || "",
        facebookUrl: profile.facebookUrl || "",
        tiktokUrl: profile.tiktokUrl || "",
        whatsappNumber: profile.whatsappNumber || "",
        priceRangeMin: profile.priceRangeMin?.toString() || "",
        priceRangeMax: profile.priceRangeMax?.toString() || "",
        experienceYears: profile.experienceYears?.toString() || "",
        eventsCompleted: profile.eventsCompleted?.toString() || "",
        availabilityNote: profile.availabilityNote || "",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
      toast.success("הפרופיל עודכן בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הפרופיל");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      ...form,
      priceRangeMin: form.priceRangeMin ? parseInt(form.priceRangeMin) : null,
      priceRangeMax: form.priceRangeMax ? parseInt(form.priceRangeMax) : null,
      experienceYears: form.experienceYears ? parseInt(form.experienceYears) : null,
      eventsCompleted: form.eventsCompleted ? parseInt(form.eventsCompleted) : null,
    });
  }

  function toggleArea(area: string) {
    setForm((prev) => ({
      ...prev,
      areasServed: prev.areasServed.includes(area)
        ? prev.areasServed.filter((a) => a !== area)
        : [...prev.areasServed, area],
    }));
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">עריכת פרופיל</h1>
        {profile && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">השלמה:</span>
            <Progress value={profile.completionScore} className="w-24 h-2" />
            <span className="text-sm font-bold">{profile.completionScore}%</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">פרטי עסק</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>שם העסק *</Label>
                <Input
                  value={form.businessName}
                  onChange={(e) =>
                    setForm({ ...form, businessName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>קטגוריה *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>תיאור קצר</Label>
              <Input
                value={form.shortDescription}
                onChange={(e) =>
                  setForm({ ...form, shortDescription: e.target.value })
                }
                placeholder="שורה אחת שמתארת את העסק"
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label>אודות</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={5}
                placeholder="ספרו על העסק שלכם, הניסיון, והגישה שלכם..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">מיקום ואזורי שירות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>עיר *</Label>
              <Select
                value={form.city}
                onValueChange={(v) => setForm({ ...form, city: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREA_OPTIONS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>אזורי שירות</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AREA_OPTIONS.map((area) => (
                  <label
                    key={area}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={form.areasServed.includes(area)}
                      onCheckedChange={() => toggleArea(area)}
                    />
                    {area}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">פרטי קשר</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>טלפון</Label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) =>
                    setForm({ ...form, contactPhone: e.target.value })
                  }
                  type="tel"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={form.whatsappNumber}
                  onChange={(e) =>
                    setForm({ ...form, whatsappNumber: e.target.value })
                  }
                  type="tel"
                  dir="ltr"
                  className="text-left"
                  placeholder="050-1234567"
                />
              </div>
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                  type="email"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>אתר אינטרנט</Label>
                <Input
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                  dir="ltr"
                  className="text-left"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={form.instagramUrl}
                  onChange={(e) =>
                    setForm({ ...form, instagramUrl: e.target.value })
                  }
                  dir="ltr"
                  className="text-left"
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={form.facebookUrl}
                  onChange={(e) =>
                    setForm({ ...form, facebookUrl: e.target.value })
                  }
                  dir="ltr"
                  className="text-left"
                  placeholder="https://facebook.com/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תמחור וניסיון</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>מחיר מינימלי (₪)</Label>
                <Input
                  value={form.priceRangeMin}
                  onChange={(e) =>
                    setForm({ ...form, priceRangeMin: e.target.value })
                  }
                  type="number"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>מחיר מקסימלי (₪)</Label>
                <Input
                  value={form.priceRangeMax}
                  onChange={(e) =>
                    setForm({ ...form, priceRangeMax: e.target.value })
                  }
                  type="number"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>שנות ניסיון</Label>
                <Input
                  value={form.experienceYears}
                  onChange={(e) =>
                    setForm({ ...form, experienceYears: e.target.value })
                  }
                  type="number"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label>אירועים שבוצעו</Label>
                <Input
                  value={form.eventsCompleted}
                  onChange={(e) =>
                    setForm({ ...form, eventsCompleted: e.target.value })
                  }
                  type="number"
                  dir="ltr"
                  className="text-left"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>הערות זמינות</Label>
              <Textarea
                value={form.availabilityNote}
                onChange={(e) =>
                  setForm({ ...form, availabilityNote: e.target.value })
                }
                rows={2}
                placeholder="למשל: פנוי לאירועים מאפריל 2026"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full bg-gradient-brand hover:opacity-90 text-white"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              שומר...
            </>
          ) : (
            <>
              <Save className="ml-2 h-4 w-4" />
              שמור שינויים
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
