"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Search, Check, UserPlus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface GuestData {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  rsvpStatus: string;
  rsvpCount: number;
  checkedIn?: boolean;
  table: { number: number } | null;
  group: { name: string; color: string } | null;
}

export default function ReceptionPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: guests = [] } = useQuery<GuestData[]>({
    queryKey: ["guests", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/guests`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const confirmedGuests = guests.filter(
    (g) => g.rsvpStatus === "CONFIRMED"
  );
  const checkedInGuests = confirmedGuests.filter((g) => g.checkedIn);
  const checkInRate =
    confirmedGuests.length > 0
      ? Math.round((checkedInGuests.length / confirmedGuests.length) * 100)
      : 0;

  const searchResults = search.length >= 2
    ? guests.filter((g) => {
        const name = `${g.firstName} ${g.lastName || ""}`.toLowerCase();
        return (
          name.includes(search.toLowerCase()) ||
          g.phone?.includes(search)
        );
      })
    : [];

  async function checkIn(guestId: string) {
    await fetch(`/api/events/${id}/guests/${guestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rsvpStatus: "CONFIRMED",
        checkedIn: true,
      }),
    });
    queryClient.invalidateQueries({ queryKey: ["guests", id] });

    const guest = guests.find((g) => g.id === guestId);
    if (guest) {
      const tableInfo = guest.table
        ? ` — שולחן ${guest.table.number}`
        : "";
      toast.success(
        `${guest.firstName} ${guest.lastName || ""} הגיע/ה!${tableInfo}`
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">קבלת פנים</h1>
        <p className="text-muted-foreground">ממשק צ׳ק-אין לאירוע</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">הגיעו</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {checkedInGuests.length}
            </div>
            <Progress value={checkInRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">אישרו הגעה</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{confirmedGuests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">טרם הגיעו</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {confirmedGuests.length - checkedInGuests.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="חפש אורח לפי שם או טלפון..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 text-lg h-14"
              autoFocus
            />
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {search.length >= 2 && (
        <div className="space-y-2">
          {searchResults.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                לא נמצאו אורחים
              </CardContent>
            </Card>
          ) : (
            searchResults.map((guest) => (
              <Card
                key={guest.id}
                className="hover:border-primary/50 transition-colors"
              >
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xl font-bold">
                      {guest.firstName} {guest.lastName || ""}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {guest.table && (
                        <Badge variant="outline" className="text-base">
                          שולחן {guest.table.number}
                        </Badge>
                      )}
                      {guest.group && (
                        <Badge
                          variant="outline"
                          style={{ borderColor: guest.group.color }}
                        >
                          {guest.group.name}
                        </Badge>
                      )}
                      <span>{guest.rsvpCount} אורחים</span>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => checkIn(guest.id)}
                    disabled={guest.checkedIn}
                    className={
                      guest.checkedIn
                        ? "bg-green-500 hover:bg-green-500"
                        : ""
                    }
                  >
                    {guest.checkedIn ? (
                      <>
                        <Check className="ml-2 h-5 w-5" />
                        הגיע/ה
                      </>
                    ) : (
                      <>
                        <UserPlus className="ml-2 h-5 w-5" />
                        צ׳ק-אין
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
