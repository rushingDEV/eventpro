import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Send messages to guests
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const body = await request.json();
  const { guestIds, type, template, content } = body;

  if (!guestIds?.length || !content) {
    return NextResponse.json(
      { error: "חסרים שדות חובה" },
      { status: 400 }
    );
  }

  // Create message records (in production, this would also send via WhatsApp/SMS)
  const messages = await Promise.all(
    guestIds.map((guestId: string) =>
      prisma.guestMessage.create({
        data: {
          guestId,
          type: type || "whatsapp",
          direction: "outgoing",
          template: template || null,
          content,
          status: "sent", // In production: "pending" until delivery confirmed
        },
      })
    )
  );

  return NextResponse.json({
    sent: messages.length,
    total: guestIds.length,
  });
}

// GET - message history for event
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const messages = await prisma.guestMessage.findMany({
    where: {
      guest: { eventId: id },
    },
    include: {
      guest: { select: { firstName: true, lastName: true } },
    },
    orderBy: { sentAt: "desc" },
    take: 100,
  });

  return NextResponse.json(messages);
}
