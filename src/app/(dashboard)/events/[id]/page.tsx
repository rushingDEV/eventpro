"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import {
  Users,
  Grid3X3,
  Gift,
  CalendarDays,
  MapPin,
  MessageSquare,
  ClipboardCheck,
  Globe,
  ListChecks,
  TrendingDown,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RsvpChart } from "@/components/dashboard/rsvp-chart";

interface GuestData {
  id: string;
  rsvpStatus: string;
  tableId: string | null;
}

interface TableData {
  id: string;
  capacity: number;
  _count: { guests: number };
}

interface EventData {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string | null;
  pricePerPlate: number | null;
  reservePercent: number | null;
  guests: GuestData[];
  tables: TableData[];
  _count: { guests: number; gifts: number; tasks: number };
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

export default function EventPage() {
  const { id } = useParams<{ id: string }>();

  const { data: event, isLoading } = useQuery<EventData>({
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
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!event) {
    return <div className="text-center py-12">אירוע לא נמצא</div>;
  }

  const confirmed = event.guests?.filter((g) => g.rsvpStatus === "CONFIRMED").length || 0;
  const declined = event.guests?.filter((g) => g.rsvpStatus === "DECLINED").length || 0;
  const pending = event.guests?.filter(
    (g) => g.rsvpStatus === "PENDING" || g.rsvpStatus === "NO_RESPONSE"
  ).length || 0;

  const totalGuests = event._count.guests;
  const daysLeft = differenceInDays(new Date(event.date), new Date());
  const isPast = daysLeft < 0;

  // Dead Seat computation
  const pricePerPlate = event.pricePerPlate || 0;
  const noShowRate = (event.reservePercent || 10) / 100;
  const expectedNoShows = Math.round(totalGuests * noShowRate);
  const seatsPerTable = 10;
  const tablesNeeded = Math.ceil(totalGuests / seatsPerTable);
  const totalCapacity = tablesNeeded * seatsPerTable;
  const emptyFromRounding = totalCapacity - totalGuests;
  const totalEmptySeats = expectedNoShows + emptyFromRounding;
  const wastedMoney = totalEmptySeats * pricePerPlate;
  const savingsWithAI = Math.round(wastedMoney * 0.65);

  // Partial tables
  const partialTables = event.tables?.filter(
    (t) => t._count.guests > 0 && t._count.guests < t.capacity * 0.6
  ).length || 0;

  // Seated count
  const seatedGuests = event.guests?.filter((g) => g.tableId).length || 0;

  // Quick actions
  const quickActions = [
    {
      label: "מוזמנים",
      href: `/events/${id}/guests`,
      icon: Users,
      stat: `${totalGuests}`,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "הושבה",
      href: `/events/${id}/seating`,
      icon: MapPin,
      stat: `${event.tables?.length || 0} שולחנות`,
      color: "text-primary bg-primary/5",
    },
    {
      label: "Dead Seat",
      href: `/events/${id}/seating`,
      icon: TrendingDown,
      stat: pricePerPlate ? `₪${wastedMoney.toLocaleString()}` : "—",
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "מתנות",
      href: `/events/${id}/gifts`,
      icon: Gift,
      stat: `${event._count.gifts}`,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "תקשורת",
      href: `/events/${id}/communication`,
      icon: MessageSquare,
      stat: "הודעות",
      color: "text-violet-600 bg-violet-50",
    },
    {
      label: "קבוצות",
      href: `/events/${id}/groups`,
      icon: Grid3X3,
      stat: "ניהול",
      color: "text-orange-600 bg-orange-50",
    },
    {
      label: "קבלת פנים",
      href: `/events/${id}/reception`,
      icon: ClipboardCheck,
      stat: "צ׳ק-אין",
      color: "text-teal-600 bg-teal-50",
    },
    {
      label: "מיני-סייט",
      href: `/events/${id}/minisite`,
      icon: Globe,
      stat: "הזמנה",
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "משימות",
      href: `/events/${id}/tasks`,
      icon: ListChecks,
      stat: `${event._count.tasks}`,
      color: "text-rose-600 bg-rose-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <Badge variant="secondary">
              {eventTypeLabels[event.type] || event.type}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(event.date), "EEEE, dd MMMM yyyy", {
                locale: he,
              })}
              {event.time && ` בשעה ${event.time}`}
            </span>
            {!isPast && (
              <Badge variant="outline" className="border-primary/30 text-primary">
                {daysLeft === 0 ? "היום!" : `${daysLeft} ימים`}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Top Row: Dead Seat Panel + RSVP Donut */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Dead Seat Panel */}
        <Card className="border-0 bg-gradient-to-l from-rose-50 to-amber-50 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,oklch(0.45_0.16_350/0.06),transparent)] pointer-events-none" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-5 w-5 text-amber-600" />
              ניתוח מושבים ריקים
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {pricePerPlate > 0 ? (
              <div className="space-y-4">
                <div>
                  <div className="text-4xl font-black text-gradient-brand" dir="ltr">
                    ₪{wastedMoney.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    בזבוז צפוי על {totalEmptySeats} מושבים ריקים
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/70 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-destructive">{expectedNoShows}</div>
                    <div className="text-xs text-muted-foreground">לא יגיעו</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-amber-600">{partialTables}</div>
                    <div className="text-xs text-muted-foreground">שולחנות חלקיים</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-primary" dir="ltr">₪{savingsWithAI.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">חיסכון AI</div>
                  </div>
                </div>
                <Button asChild size="sm" className="w-full bg-gradient-brand hover:opacity-90 text-white">
                  <Link href={`/events/${id}/seating`}>
                    <Sparkles className="ml-2 h-3.5 w-3.5" />
                    הפעילו הושבה חכמה
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  הגדירו מחיר למנה כדי לראות כמה כסף מבוזבז על מושבים ריקים
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

        {/* RSVP Status */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">סטטוס אישורים</CardTitle>
              <span className="text-sm text-muted-foreground">
                {seatedGuests}/{totalGuests} הושבו
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <RsvpChart
              confirmed={confirmed}
              pending={pending}
              declined={declined}
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-bold mb-3">ניהול מהיר</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="py-4 px-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{action.label}</div>
                        <div className="text-lg font-bold mt-0.5" dir="ltr">
                          {action.stat}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
