"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { CalendarDays, MapPin, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function RsvpPage() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState<"phone" | "form" | "done">("phone");
  const [phone, setPhone] = useState("");
  const [guestId, setGuestId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["rsvp-event", slug],
    queryFn: async () => {
      const res = await fetch(`/api/rsvp/${slug}`);
      if (!res.ok) throw new Error("Event not found");
      return res.json();
    },
  });

  async function handlePhoneLookup(e: React.FormEvent) {
    e.preventDefault();
    // In real app, look up guest by phone. For now, proceed to form.
    setStep("form");
  }

  async function handleRsvp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const res = await fetch(`/api/rsvp/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        guestId,
        rsvpStatus: formData.get("attending") === "yes" ? "CONFIRMED" : "DECLINED",
        rsvpCount: formData.get("count"),
        dietaryNeeds: formData.get("dietary"),
        notes: formData.get("notes"),
      }),
    });

    if (res.ok) {
      setStep("done");
      setSubmitted(true);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">טוען...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">אירוע לא נמצא</h1>
          <p className="text-muted-foreground">הקישור אינו תקין</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 space-y-6">
          {/* Event Header */}
          <div className="text-center space-y-3">
            <Heart className="mx-auto h-10 w-10 text-rose-400" />
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {format(new Date(event.date), "EEEE, dd MMMM yyyy", {
                  locale: he,
                })}
              </div>
              {event.time && (
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  שעה {event.time}
                </div>
              )}
              {event.venue && (
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {event.venue.name}, {event.venue.city}
                </div>
              )}
            </div>
          </div>

          {/* Phone Lookup Step */}
          {step === "phone" && (
            <form onSubmit={handlePhoneLookup} className="space-y-4">
              <div className="space-y-2">
                <Label>מספר טלפון</Label>
                <Input
                  type="tel"
                  placeholder="05X-XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  dir="ltr"
                  className="text-center text-lg"
                />
              </div>
              <Button type="submit" className="w-full">
                המשך
              </Button>
            </form>
          )}

          {/* RSVP Form Step */}
          {step === "form" && (
            <form onSubmit={handleRsvp} className="space-y-4">
              <div className="space-y-2">
                <Label>האם תגיעו?</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="attending"
                      value="yes"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="text-center py-3 px-4 rounded-lg border-2 border-transparent peer-checked:border-green-500 peer-checked:bg-green-50 transition-colors hover:bg-muted">
                      <div className="text-2xl mb-1">🎉</div>
                      <div className="font-medium">מגיעים!</div>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="attending"
                      value="no"
                      className="sr-only peer"
                    />
                    <div className="text-center py-3 px-4 rounded-lg border-2 border-transparent peer-checked:border-red-500 peer-checked:bg-red-50 transition-colors hover:bg-muted">
                      <div className="text-2xl mb-1">😔</div>
                      <div className="font-medium">לא הפעם</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>כמה אורחים?</Label>
                <Input
                  name="count"
                  type="number"
                  min="1"
                  max="10"
                  defaultValue="1"
                  dir="ltr"
                  className="text-center"
                />
              </div>

              <div className="space-y-2">
                <Label>צרכי תזונה מיוחדים</Label>
                <Input
                  name="dietary"
                  placeholder="צמחוני, טבעוני, ללא גלוטן..."
                />
              </div>

              <div className="space-y-2">
                <Label>הערות</Label>
                <Textarea name="notes" rows={2} placeholder="משהו שנרצה לדעת?" />
              </div>

              <Button type="submit" className="w-full">
                שלח אישור
              </Button>
            </form>
          )}

          {/* Done Step */}
          {step === "done" && (
            <div className="text-center space-y-4">
              <div className="text-4xl">🎉</div>
              <h2 className="text-xl font-bold">תודה!</h2>
              <p className="text-muted-foreground">
                האישור שלכם התקבל בהצלחה. נתראה באירוע!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
