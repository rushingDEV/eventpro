import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, groupId } = await params;

  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const body = await request.json();

  const group = await prisma.guestGroup.update({
    where: { id: groupId },
    data: body,
    include: { _count: { select: { guests: true } } },
  });

  return NextResponse.json(group);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, groupId } = await params;

  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  // Unassign guests from this group first
  await prisma.guest.updateMany({
    where: { groupId },
    data: { groupId: null },
  });

  await prisma.guestGroup.delete({ where: { id: groupId } });

  return NextResponse.json({ success: true });
}
