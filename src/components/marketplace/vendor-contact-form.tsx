"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface VendorContactFormProps {
  vendorId: string;
  vendorName: string;
  onSuccess?: () => void;
}

export function VendorContactForm({ vendorId, vendorName, onSuccess }: VendorContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/marketplace/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          contactName: formData.get("contactName"),
          contactPhone: formData.get("contactPhone"),
          eventDate: formData.get("eventDate") || null,
          guestCount: formData.get("guestCount") || null,
          message: formData.get("message"),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "שגיאה בשליחה");
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
      onSuccess?.();
    } catch {
      setError("שגיאה בתקשורת עם השרת");
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-6 space-y-2">
        <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
          <Send className="h-5 w-5" />
        </div>
        <h3 className="font-bold">הפנייה נשלחה!</h3>
        <p className="text-sm text-muted-foreground">
          {vendorName} יצרו איתכם קשר בקרוב
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="contactName" className="text-sm">שם מלא *</Label>
        <Input id="contactName" name="contactName" required placeholder="השם שלכם" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contactPhone" className="text-sm">טלפון</Label>
        <Input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          placeholder="050-1234567"
          dir="ltr"
          className="text-left"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="eventDate" className="text-sm">תאריך אירוע</Label>
        <Input id="eventDate" name="eventDate" type="date" dir="ltr" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="guestCount" className="text-sm">מספר מוזמנים</Label>
        <Input
          id="guestCount"
          name="guestCount"
          type="number"
          placeholder="300"
          dir="ltr"
          className="text-left"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message" className="text-sm">הודעה</Label>
        <Textarea
          id="message"
          name="message"
          rows={3}
          placeholder={`היי ${vendorName}, מעוניינים לשמוע עוד...`}
        />
      </div>
      <Button type="submit" className="w-full bg-gradient-brand hover:opacity-90 text-white" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            שולח...
          </>
        ) : (
          <>
            <Send className="ml-2 h-4 w-4" />
            שלחו פנייה
          </>
        )}
      </Button>
    </form>
  );
}
