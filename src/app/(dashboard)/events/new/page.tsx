"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const eventTypes = [
  { value: "WEDDING", label: "חתונה" },
  { value: "BAR_MITZVAH", label: "בר מצווה" },
  { value: "BAT_MITZVAH", label: "בת מצווה" },
  { value: "BRIT", label: "ברית" },
  { value: "BIRTHDAY", label: "יום הולדת" },
  { value: "CORPORATE", label: "אירוע חברה" },
  { value: "OTHER", label: "אחר" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          type: formData.get("type"),
          date: formData.get("date"),
          time: formData.get("time"),
          minGuarantee: formData.get("minGuarantee"),
          pricePerPlate: formData.get("pricePerPlate"),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "שגיאה ביצירת האירוע");
        setLoading(false);
        return;
      }

      const event = await res.json();
      router.push(`/events/${event.id}`);
    } catch {
      setError("שגיאה בתקשורת עם השרת");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">אירוע חדש</CardTitle>
          <CardDescription>הזן את פרטי האירוע שלך</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">שם האירוע</Label>
              <Input
                id="name"
                name="name"
                placeholder='למשל: "החתונה של דנה ויוסי"'
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">סוג אירוע</Label>
                <Select name="type" defaultValue="WEDDING">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">שעה</Label>
                <Input id="time" name="time" type="time" dir="ltr" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">תאריך</Label>
              <Input id="date" name="date" type="date" required dir="ltr" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minGuarantee">מינימום מנות</Label>
                <Input
                  id="minGuarantee"
                  name="minGuarantee"
                  type="number"
                  placeholder="280"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerPlate">מחיר למנה (₪)</Label>
                <Input
                  id="pricePerPlate"
                  name="pricePerPlate"
                  type="number"
                  placeholder="400"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "יוצר..." : "צור אירוע"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                ביטול
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
