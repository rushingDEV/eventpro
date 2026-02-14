"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Plus, CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function EventsPage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">האירועים שלי</h1>
          <p className="text-muted-foreground">ניהול כל האירועים שלך</p>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="ml-2 h-4 w-4" />
            אירוע חדש
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">אין אירועים עדיין</h3>
            <p className="text-muted-foreground mb-4">
              צור את האירוע הראשון שלך כדי להתחיל
            </p>
            <Button asChild>
              <Link href="/events/new">
                <Plus className="ml-2 h-4 w-4" />
                צור אירוע
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events?.map(
            (event: {
              id: string;
              name: string;
              type: string;
              date: string;
              _count: { guests: number; tables: number };
            }) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <Badge variant="secondary">
                        {eventTypeLabels[event.type] || event.type}
                      </Badge>
                    </div>
                    <CardDescription>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {format(new Date(event.date), "dd MMMM yyyy", {
                          locale: he,
                        })}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {event._count.guests} מוזמנים
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
