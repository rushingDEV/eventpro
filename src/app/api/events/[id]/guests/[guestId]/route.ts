import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, guestId } = await params;

  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const body = await request.json();

  const guest = await prisma.guest.update({
    where: { id: guestId },
    data: body,
    include: { group: true },
  });

  return NextResponse.json(guest);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, guestId } = await params;

  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  await prisma.guest.delete({ where: { id: guestId } });

  return NextResponse.json({ success: true });
}
