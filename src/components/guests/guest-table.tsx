"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit, Search } from "lucide-react";

interface Guest {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  rsvpStatus: string;
  rsvpCount: number;
  invitedCount: number;
  side: string;
  group: { id: string; name: string; color: string } | null;
  table: { id: string; number: number } | null;
  dietaryNeeds: string | null;
  vipLevel: number;
}

interface GuestTableProps {
  guests: Guest[];
  eventId: string;
  onRefresh: () => void;
}

const rsvpLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "ממתין", variant: "secondary" },
  CONFIRMED: { label: "אישר", variant: "default" },
  DECLINED: { label: "לא מגיע", variant: "destructive" },
  MAYBE: { label: "אולי", variant: "outline" },
  NO_RESPONSE: { label: "לא ענה", variant: "secondary" },
};

const sideLabels: Record<string, string> = {
  GROOM: "חתן",
  BRIDE: "כלה",
  SHARED: "משותף",
};

export function GuestTable({ guests, eventId, onRefresh }: GuestTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sideFilter, setSideFilter] = useState<string>("all");

  const filtered = guests.filter((g) => {
    const name = `${g.firstName} ${g.lastName || ""}`.toLowerCase();
    const matchesSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      g.phone?.includes(search);
    const matchesStatus =
      statusFilter === "all" || g.rsvpStatus === statusFilter;
    const matchesSide = sideFilter === "all" || g.side === sideFilter;
    return matchesSearch && matchesStatus && matchesSide;
  });

  async function updateRsvp(guestId: string, rsvpStatus: string) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsvpStatus }),
    });
    onRefresh();
  }

  async function deleteGuest(guestId: string) {
    if (!confirm("האם למחוק את המוזמן?")) return;
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: "DELETE",
    });
    onRefresh();
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם או טלפון..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="PENDING">ממתין</SelectItem>
            <SelectItem value="CONFIRMED">אישר</SelectItem>
            <SelectItem value="DECLINED">לא מגיע</SelectItem>
            <SelectItem value="MAYBE">אולי</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sideFilter} onValueChange={setSideFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="צד" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הצדדים</SelectItem>
            <SelectItem value="GROOM">חתן</SelectItem>
            <SelectItem value="BRIDE">כלה</SelectItem>
            <SelectItem value="SHARED">משותף</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">
        מציג {filtered.length} מתוך {guests.length} מוזמנים
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>קבוצה</TableHead>
              <TableHead>צד</TableHead>
              <TableHead>מוזמנים</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>שולחן</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {search || statusFilter !== "all" || sideFilter !== "all"
                    ? "לא נמצאו מוזמנים התואמים את החיפוש"
                    : "אין מוזמנים עדיין"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">
                    {guest.firstName} {guest.lastName || ""}
                    {guest.vipLevel > 0 && (
                      <Badge variant="outline" className="mr-2 text-xs">
                        VIP
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell dir="ltr" className="text-left">
                    {guest.phone || "—"}
                  </TableCell>
                  <TableCell>
                    {guest.group ? (
                      <Badge
                        variant="outline"
                        style={{ borderColor: guest.group.color }}
                      >
                        {guest.group.name}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{sideLabels[guest.side]}</TableCell>
                  <TableCell>{guest.invitedCount}</TableCell>
                  <TableCell>
                    <Select
                      value={guest.rsvpStatus}
                      onValueChange={(v) => updateRsvp(guest.id, v)}
                    >
                      <SelectTrigger className="h-7 w-[100px]">
                        <Badge
                          variant={
                            rsvpLabels[guest.rsvpStatus]?.variant || "secondary"
                          }
                          className="text-xs"
                        >
                          {rsvpLabels[guest.rsvpStatus]?.label || guest.rsvpStatus}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">ממתין</SelectItem>
                        <SelectItem value="CONFIRMED">אישר</SelectItem>
                        <SelectItem value="DECLINED">לא מגיע</SelectItem>
                        <SelectItem value="MAYBE">אולי</SelectItem>
                        <SelectItem value="NO_RESPONSE">לא ענה</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {guest.table ? `שולחן ${guest.table.number}` : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteGuest(guest.id)}
                        >
                          <Trash2 className="ml-2 h-4 w-4" />
                          מחק
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
