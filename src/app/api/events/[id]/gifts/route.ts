import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const gifts = await prisma.gift.findMany({
    where: { eventId: id },
    include: {
      guest: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(gifts);
}

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
  const {
    guestId,
    type,
    amount,
    currency,
    description,
    checkNumber,
    bankName,
    envelopeNumber,
    notes,
  } = body;

  const gift = await prisma.gift.create({
    data: {
      eventId: id,
      guestId: guestId || null,
      type: type || "CASH",
      amount: amount ? parseFloat(amount) : null,
      currency: currency || "ILS",
      description: description || null,
      checkNumber: checkNumber || null,
      bankName: bankName || null,
      envelopeNumber: envelopeNumber ? parseInt(envelopeNumber) : null,
      notes: notes || null,
    },
    include: {
      guest: { select: { firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(gift, { status: 201 });
}
