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

  const tables = await prisma.eventTable.findMany({
    where: { eventId: id },
    include: {
      guests: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          groupId: true,
          side: true,
          rsvpStatus: true,
        },
      },
      _count: { select: { guests: true } },
    },
    orderBy: { number: "asc" },
  });

  return NextResponse.json(tables);
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
  const { number, name, shape, capacity, posX, posY, isVIP, zone } = body;

  // Auto-number if not provided
  let tableNumber = number;
  if (!tableNumber) {
    const lastTable = await prisma.eventTable.findFirst({
      where: { eventId: id },
      orderBy: { number: "desc" },
    });
    tableNumber = (lastTable?.number || 0) + 1;
  }

  const table = await prisma.eventTable.create({
    data: {
      eventId: id,
      number: tableNumber,
      name: name || null,
      shape: shape || "ROUND",
      capacity: capacity || 10,
      posX: posX || Math.random() * 600 + 100,
      posY: posY || Math.random() * 400 + 100,
      isVIP: isVIP || false,
      zone: zone || null,
    },
    include: { _count: { select: { guests: true } } },
  });

  return NextResponse.json(table, { status: 201 });
}
