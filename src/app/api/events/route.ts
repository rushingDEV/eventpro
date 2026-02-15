import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    where: { userId: session.user.id },
    include: {
      guests: { select: { rsvpStatus: true } },
      _count: { select: { guests: true, tables: true } },
    },
    orderBy: { date: "asc" },
  });

  // Compute RSVP counts server-side
  const eventsWithCounts = events.map((event) => {
    const confirmedCount = event.guests.filter((g) => g.rsvpStatus === "CONFIRMED").length;
    const declinedCount = event.guests.filter((g) => g.rsvpStatus === "DECLINED").length;
    const pendingCount = event.guests.filter(
      (g) => g.rsvpStatus === "PENDING" || g.rsvpStatus === "NO_RESPONSE"
    ).length;
    const { guests: _guests, ...rest } = event;
    return { ...rest, confirmedCount, declinedCount, pendingCount };
  });

  return NextResponse.json(eventsWithCounts);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, type, date, time, venueId, minGuarantee, pricePerPlate } = body;

  if (!name || !date) {
    return NextResponse.json(
      { error: "שם ותאריך הם שדות חובה" },
      { status: 400 }
    );
  }

  const event = await prisma.event.create({
    data: {
      name,
      type: type || "WEDDING",
      date: new Date(date),
      time,
      userId: session.user.id,
      venueId: venueId || null,
      minGuarantee: minGuarantee ? parseInt(minGuarantee) : null,
      pricePerPlate: pricePerPlate ? parseFloat(pricePerPlate) : null,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
