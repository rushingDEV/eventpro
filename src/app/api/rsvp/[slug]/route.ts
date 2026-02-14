import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - get event info for RSVP page (public)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { miniSiteSlug: slug },
    select: {
      id: true,
      name: true,
      type: true,
      date: true,
      time: true,
      miniSiteConfig: true,
      venue: {
        select: { name: true, address: true, city: true },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  return NextResponse.json(event);
}

// POST - submit RSVP (public)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({
    where: { miniSiteSlug: slug },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const body = await request.json();
  const { guestId, phone, rsvpStatus, rsvpCount, dietaryNeeds, notes } = body;

  // Find guest by ID or phone
  let guest;
  if (guestId) {
    guest = await prisma.guest.findFirst({
      where: { id: guestId, eventId: event.id },
    });
  } else if (phone) {
    guest = await prisma.guest.findFirst({
      where: { phone, eventId: event.id },
    });
  }

  if (!guest) {
    return NextResponse.json({ error: "אורח לא נמצא" }, { status: 404 });
  }

  // Update guest RSVP
  const updatedGuest = await prisma.guest.update({
    where: { id: guest.id },
    data: {
      rsvpStatus: rsvpStatus || "CONFIRMED",
      rsvpCount: rsvpCount ? parseInt(rsvpCount) : guest.rsvpCount,
      rsvpDate: new Date(),
      rsvpMethod: "minisite",
      ...(dietaryNeeds && { dietaryNeeds }),
      ...(notes && { notes }),
    },
  });

  // Update event counts
  if (rsvpStatus === "CONFIRMED") {
    await prisma.event.update({
      where: { id: event.id },
      data: {
        confirmedCount: { increment: 1 },
        pendingCount: { decrement: 1 },
      },
    });
  } else if (rsvpStatus === "DECLINED") {
    await prisma.event.update({
      where: { id: event.id },
      data: {
        declinedCount: { increment: 1 },
        pendingCount: { decrement: 1 },
      },
    });
  }

  return NextResponse.json({
    success: true,
    guestName: `${updatedGuest.firstName} ${updatedGuest.lastName || ""}`,
  });
}
