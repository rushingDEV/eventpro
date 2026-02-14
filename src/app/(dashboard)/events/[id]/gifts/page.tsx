"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Plus, Gift as GiftIcon, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const giftTypeLabels: Record<string, string> = {
  CASH: "מזומן",
  CHECK: "המחאה",
  CREDIT_CARD: "כרטיס אשראי",
  TRANSFER: "העברה",
  BIT: "ביט",
  PAYBOX: "פייבוקס",
  PHYSICAL: "מתנה פיזית",
  OTHER: "אחר",
};

interface GiftData {
  id: string;
  type: string;
  amount: number | null;
  currency: string;
  description: string | null;
  envelopeNumber: number | null;
  checkNumber: string | null;
  notes: string | null;
  guest: { firstName: string; lastName: string | null } | null;
  createdAt: string;
}

export default function GiftsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: gifts = [] } = useQuery<GiftData[]>({
    queryKey: ["gifts", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/gifts`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: guests = [] } = useQuery({
    queryKey: ["guests", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/guests`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const totalAmount = gifts.reduce((sum, g) => sum + (g.amount || 0), 0);
  const avgAmount =
    gifts.filter((g) => g.amount).length > 0
      ? totalAmount / gifts.filter((g) => g.amount).length
      : 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    await fetch(`/api/events/${id}/gifts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestId: formData.get("guestId") || null,
        type: formData.get("type"),
        amount: formData.get("amount"),
        envelopeNumber: formData.get("envelopeNumber"),
        checkNumber: formData.get("checkNumber"),
        notes: formData.get("notes"),
      }),
    });

    setLoading(false);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ["gifts", id] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">מתנות</h1>
          <p className="text-muted-foreground">מעקב אחרי מתנות האירוע</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="ml-2 h-4 w-4" />
          הוסף מתנה
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">סה״כ מתנות</CardTitle>
            <GiftIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gifts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">סה״כ סכום</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{totalAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ממוצע למתנה</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{Math.round(avgAmount).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gifts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מעטפה</TableHead>
                <TableHead>אורח</TableHead>
                <TableHead>סוג</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>הערות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gifts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    אין מתנות עדיין
                  </TableCell>
                </TableRow>
              ) : (
                gifts.map((gift) => (
                  <TableRow key={gift.id}>
                    <TableCell>{gift.envelopeNumber || "—"}</TableCell>
                    <TableCell>
                      {gift.guest
                        ? `${gift.guest.firstName} ${gift.guest.lastName || ""}`
                        : "לא ידוע"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {giftTypeLabels[gift.type] || gift.type}
                      </Badge>
                    </TableCell>
                    <TableCell dir="ltr" className="text-left font-medium">
                      {gift.amount
                        ? `₪${gift.amount.toLocaleString()}`
                        : gift.description || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {gift.notes || gift.checkNumber || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Gift Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת מתנה</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>אורח</Label>
              <Select name="guestId">
                <SelectTrigger>
                  <SelectValue placeholder="בחר אורח (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  {guests.map(
                    (g: { id: string; firstName: string; lastName: string }) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.firstName} {g.lastName || ""}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>סוג</Label>
                <Select name="type" defaultValue="CASH">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(giftTypeLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>סכום (₪)</Label>
                <Input name="amount" type="number" dir="ltr" placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>מספר מעטפה</Label>
                <Input name="envelopeNumber" type="number" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>מספר המחאה</Label>
                <Input name="checkNumber" dir="ltr" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea name="notes" rows={2} />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "שומר..." : "הוסף מתנה"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
