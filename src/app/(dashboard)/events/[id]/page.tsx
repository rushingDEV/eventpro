"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Users, Grid3X3, Gift, CalendarDays, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const eventTypeLabels: Record<string, string> = {
  WEDDING: "חתונה",
  BAR_MITZVAH: "בר מצווה",
  BAT_MITZVAH: "בת מצווה",
  BRIT: "ברית",
  BIRTHDAY: "יום הולדת",
  CORPORATE: "אירוע חברה",
  OTHER: "אחר",
};

export default function EventPage() {
  const { id } = useParams<{ id: string }>();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!event) {
    return <div className="text-center py-12">אירוע לא נמצא</div>;
  }

  const confirmed = event.guests?.filter(
    (g: { rsvpStatus: string }) => g.rsvpStatus === "CONFIRMED"
  ).length;
  const declined = event.guests?.filter(
    (g: { rsvpStatus: string }) => g.rsvpStatus === "DECLINED"
  ).length;
  const pending = event.guests?.filter(
    (g: { rsvpStatus: string }) =>
      g.rsvpStatus === "PENDING" || g.rsvpStatus === "NO_RESPONSE"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <Badge variant="secondary">
              {eventTypeLabels[event.type] || event.type}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(event.date), "EEEE, dd MMMM yyyy", {
                locale: he,
              })}
              {event.time && ` בשעה ${event.time}`}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">סה״כ מוזמנים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event.guests?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">אישרו הגעה</CardTitle>
            <Badge variant="default" className="bg-green-500">
              {confirmed}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ממתינים</CardTitle>
            <Badge variant="secondary">{pending}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">לא מגיעים</CardTitle>
            <Badge variant="destructive">{declined}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{declined}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild variant="outline" className="h-auto py-4">
          <Link
            href={`/events/${id}/guests`}
            className="flex flex-col items-center gap-2"
          >
            <Users className="h-6 w-6" />
            <span>ניהול מוזמנים</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4">
          <Link
            href={`/events/${id}/groups`}
            className="flex flex-col items-center gap-2"
          >
            <Grid3X3 className="h-6 w-6" />
            <span>קבוצות קרבה</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4">
          <Link
            href={`/events/${id}/gifts`}
            className="flex flex-col items-center gap-2"
          >
            <Gift className="h-6 w-6" />
            <span>מתנות</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
