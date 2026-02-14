"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import {
  CalendarDays,
  Users,
  UserCheck,
  UserX,
  Clock,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface EventWithCounts {
  id: string;
  name: string;
  type: string;
  date: string;
  confirmedCount: number;
  declinedCount: number;
  pendingCount: number;
  _count: { guests: number; tables: number };
}

const eventTypeLabels: Record<string, string> = {
  WEDDING: "חתונה",
  BAR_MITZVAH: "בר מצווה",
  BAT_MITZVAH: "בת מצווה",
  BRIT: "ברית",
  BIRTHDAY: "יום הולדת",
  CORPORATE: "אירוע חברה",
  OTHER: "אחר",
};

export default function DashboardPage() {
  const { data: events, isLoading } = useQuery<EventWithCounts[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  // Find the closest upcoming event
  const upcomingEvent = events
    ?.filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const daysUntilEvent = upcomingEvent
    ? differenceInDays(new Date(upcomingEvent.date), new Date())
    : null;

  const totalGuests = events?.reduce((sum, e) => sum + e._count.guests, 0) || 0;
  const totalConfirmed =
    events?.reduce((sum, e) => sum + e.confirmedCount, 0) || 0;
  const totalDeclined =
    events?.reduce((sum, e) => sum + e.declinedCount, 0) || 0;
  const totalPending =
    events?.reduce((sum, e) => sum + e.pendingCount, 0) || 0;
  const confirmRate =
    totalGuests > 0 ? Math.round((totalConfirmed / totalGuests) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">דשבורד</h1>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="ml-2 h-4 w-4" />
            אירוע חדש
          </Link>
        </Button>
      </div>

      {/* Countdown Card */}
      {upcomingEvent && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <h2 className="text-xl font-bold">{upcomingEvent.name}</h2>
              <p className="text-muted-foreground">
                {format(new Date(upcomingEvent.date), "EEEE, dd MMMM yyyy", {
                  locale: he,
                })}
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {daysUntilEvent}
              </div>
              <div className="text-sm text-muted-foreground">ימים נותרו</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">סה״כ מוזמנים</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">אישרו הגעה</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalConfirmed}
            </div>
            {totalGuests > 0 && (
              <Progress value={confirmRate} className="mt-2 h-2" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ממתינים</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {totalPending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">לא מגיעים</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalDeclined}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div>
        <h2 className="text-xl font-bold mb-4">האירועים שלי</h2>
        {!events || events.length === 0 ? (
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
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{event.name}</CardTitle>
                      <Badge variant="secondary">
                        {eventTypeLabels[event.type] || event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), "dd/MM/yyyy", {
                        locale: he,
                      })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {event._count.guests} מוזמנים
                      </span>
                      <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
