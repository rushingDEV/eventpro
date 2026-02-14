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

  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const groups = await prisma.guestGroup.findMany({
    where: { eventId: id },
    include: {
      _count: { select: { guests: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(groups);
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
  const { name, side, color, priority } = body;

  if (!name) {
    return NextResponse.json(
      { error: "שם הקבוצה הוא שדה חובה" },
      { status: 400 }
    );
  }

  const group = await prisma.guestGroup.create({
    data: {
      eventId: id,
      name,
      side: side || "SHARED",
      color: color || "#3B82F6",
      priority: priority ? parseInt(priority) : 5,
    },
    include: {
      _count: { select: { guests: true } },
    },
  });

  return NextResponse.json(group, { status: 201 });
}
