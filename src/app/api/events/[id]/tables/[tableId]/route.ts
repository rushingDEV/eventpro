import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, tableId } = await params;

  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const body = await request.json();

  const table = await prisma.eventTable.update({
    where: { id: tableId },
    data: body,
  });

  return NextResponse.json(table);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, tableId } = await params;

  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  // Unseat guests first
  await prisma.guest.updateMany({
    where: { tableId },
    data: { tableId: null, seatNumber: null },
  });

  await prisma.eventTable.delete({ where: { id: tableId } });

  return NextResponse.json({ success: true });
}
