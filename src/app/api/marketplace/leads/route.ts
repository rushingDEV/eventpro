import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const body = await request.json();
    const { vendorId, contactName, contactPhone, contactEmail, eventDate, eventType, guestCount, message, eventId } = body;

    if (!vendorId || !contactName) {
      return NextResponse.json({ error: "שם ושם ספק הם חובה" }, { status: 400 });
    }

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      select: { id: true, userId: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
    }

    const lead = await prisma.vendorLead.create({
      data: {
        vendorId,
        userId: session.user.id,
        eventId: eventId || null,
        contactName,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || session.user.email || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        eventType: eventType || null,
        guestCount: guestCount ? parseInt(guestCount) : null,
        message: message || null,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (e) {
    console.error("Lead create error:", e);
    return NextResponse.json({ error: "שגיאה בשליחת הפנייה" }, { status: 500 });
  }
}
