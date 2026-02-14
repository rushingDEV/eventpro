"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GuestGroup {
  id: string;
  name: string;
}

interface GuestFormProps {
  eventId: string;
  groups: GuestGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GuestForm({
  eventId,
  groups,
  open,
  onOpenChange,
  onSuccess,
}: GuestFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch(`/api/events/${eventId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        groupId: formData.get("groupId") || null,
        side: formData.get("side"),
        relation: formData.get("relation"),
        invitedCount: formData.get("invitedCount"),
        dietaryNeeds: formData.get("dietaryNeeds"),
        notes: formData.get("notes"),
      }),
    });

    setLoading(false);

    if (res.ok) {
      onSuccess();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הוספת מוזמן</DialogTitle>
          <DialogDescription>הזן את פרטי המוזמן</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">שם פרטי *</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">שם משפחה</Label>
              <Input id="lastName" name="lastName" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="05X-XXXXXXX"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                className="text-left"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>קבוצה</Label>
              <Select name="groupId">
                <SelectTrigger>
                  <SelectValue placeholder="בחר קבוצה" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>צד</Label>
              <Select name="side" defaultValue="SHARED">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GROOM">חתן</SelectItem>
                  <SelectItem value="BRIDE">כלה</SelectItem>
                  <SelectItem value="SHARED">משותף</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="relation">יחס</Label>
              <Input
                id="relation"
                name="relation"
                placeholder='דוד, חבר, קולגה...'
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invitedCount">מספר מוזמנים</Label>
              <Input
                id="invitedCount"
                name="invitedCount"
                type="number"
                min="1"
                defaultValue="1"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dietaryNeeds">צרכי תזונה</Label>
            <Input
              id="dietaryNeeds"
              name="dietaryNeeds"
              placeholder="צמחוני, טבעוני, ללא גלוטן..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "שומר..." : "הוסף מוזמן"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
