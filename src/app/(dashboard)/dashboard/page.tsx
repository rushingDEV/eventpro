"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import {
  CalendarDays,
  Users,
  Plus,
  ArrowLeft,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RsvpChart } from "@/components/dashboard/rsvp-chart";

interface EventWithCounts {
  id: string;
  name: string;
  type: string;
  date: string;
  pricePerPlate: number | null;
  reservePercent: number | null;
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

const eventTypeColors: Record<string, string> = {
  WEDDING: "bg-pink-100 text-pink-700",
  BAR_MITZVAH: "bg-blue-100 text-blue-700",
  BAT_MITZVAH: "bg-purple-100 text-purple-700",
  BRIT: "bg-sky-100 text-sky-700",
  BIRTHDAY: "bg-amber-100 text-amber-700",
  CORPORATE: "bg-slate-100 text-slate-700",
  OTHER: "bg-gray-100 text-gray-700",
};

function computeDeadSeatWaste(events: EventWithCounts[]) {
  let totalWaste = 0;
  let totalEmptySeats = 0;
  for (const event of events) {
    if (!event.pricePerPlate) continue;
    const noShowRate = (event.reservePercent || 10) / 100;
    const guests = event._count.guests;
    const expectedNoShows = Math.round(guests * noShowRate);
    const seatsPerTable = 10;
    const tablesNeeded = Math.ceil(guests / seatsPerTable);
    const totalCapacity = tablesNeeded * seatsPerTable;
    const emptyFromRounding = totalCapacity - guests;
    const emptySeats = expectedNoShows + emptyFromRounding;
    totalEmptySeats += emptySeats;
    totalWaste += emptySeats * event.pricePerPlate;
  }
  return { totalWaste, totalEmptySeats };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "";

  const { data: events, isLoading } = useQuery<EventWithCounts[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const upcomingEvent = events
    ?.filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const daysUntilEvent = upcomingEvent
    ? differenceInDays(new Date(upcomingEvent.date), new Date())
    : null;

  const totalGuests = events?.reduce((sum, e) => sum + e._count.guests, 0) || 0;
  const totalConfirmed = events?.reduce((sum, e) => sum + e.confirmedCount, 0) || 0;
  const totalDeclined = events?.reduce((sum, e) => sum + e.declinedCount, 0) || 0;
  const totalPending = events?.reduce((sum, e) => sum + e.pendingCount, 0) || 0;

  const deadSeat = events ? computeDeadSeatWaste(events) : { totalWaste: 0, totalEmptySeats: 0 };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting + New Event */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {firstName ? `שלום, ${firstName}` : "דשבורד"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {upcomingEvent
              ? `${daysUntilEvent} ימים לאירוע הבא`
              : "צרו את האירוע הראשון שלכם"}
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="ml-2 h-4 w-4" />
            אירוע חדש
          </Link>
        </Button>
      </div>

      {/* Top Row: Dead Seat Insight + RSVP Donut */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Dead Seat Insight Card */}
        <Card className="border-0 bg-gradient-to-l from-rose-50 to-amber-50 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,oklch(0.45_0.16_350/0.06),transparent)] pointer-events-none" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-5 w-5 text-amber-600" />
              Dead Seat Insight
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {deadSeat.totalWaste > 0 ? (
              <div className="space-y-3">
                <div>
                  <div className="text-4xl font-black text-gradient-brand" dir="ltr">
                    ₪{deadSeat.totalWaste.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    מבוזבזים על {deadSeat.totalEmptySeats} מושבים ריקים
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
                  <Link href={upcomingEvent ? `/events/${upcomingEvent.id}/seating` : "/events"}>
                    <Sparkles className="ml-2 h-3.5 w-3.5" />
                    תקנו עם הושבה חכמה
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  הוסיפו מחיר למנה באירוע כדי לראות כמה תוכלו לחסוך
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/calculator">
                    מחשבון חיסכון
                    <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RSVP Summary Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">סטטוס אישורים</CardTitle>
          </CardHeader>
          <CardContent>
            <RsvpChart
              confirmed={totalConfirmed}
              pending={totalPending}
              declined={totalDeclined}
            />
          </CardContent>
        </Card>
      </div>

      {/* Countdown Card */}
      {upcomingEvent && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between py-5">
            <div>
              <h2 className="text-lg font-bold">{upcomingEvent.name}</h2>
              <p className="text-sm text-muted-foreground">
                {format(new Date(upcomingEvent.date), "EEEE, dd MMMM yyyy", {
                  locale: he,
                })}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-primary">
                {daysUntilEvent}
              </div>
              <div className="text-xs text-muted-foreground">ימים נותרו</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <div>
        <h2 className="text-xl font-bold mb-4">האירועים שלי</h2>
        {!events || events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">אין אירועים עדיין</h3>
              <p className="text-muted-foreground mb-4">
                צרו את האירוע הראשון שלכם כדי להתחיל
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
            {events.map((event) => {
              const totalEventGuests = event._count.guests;
              const rsvpRate =
                totalEventGuests > 0
                  ? Math.round(
                      (event.confirmedCount / totalEventGuests) * 100
                    )
                  : 0;
              const daysLeft = differenceInDays(
                new Date(event.date),
                new Date()
              );
              const isPast = daysLeft < 0;

              return (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {event.name}
                        </CardTitle>
                        <Badge
                          className={
                            eventTypeColors[event.type] ||
                            "bg-gray-100 text-gray-700"
                          }
                          variant="secondary"
                        >
                          {eventTypeLabels[event.type] || event.type}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.date), "dd/MM/yyyy", {
                            locale: he,
                          })}
                        </p>
                        {!isPast && (
                          <span className="text-xs font-medium text-primary">
                            {daysLeft === 0
                              ? "היום!"
                              : `${daysLeft} ימים`}
                          </span>
                        )}
                        {isPast && (
                          <span className="text-xs text-muted-foreground">
                            הסתיים
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {totalEventGuests} מוזמנים
                          </span>
                          <span className="font-medium text-green-600">
                            {event.confirmedCount} אישרו
                          </span>
                        </div>
                        {totalEventGuests > 0 && (
                          <Progress value={rsvpRate} className="h-1.5" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
