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

  const guests = await prisma.guest.findMany({
    where: { eventId: id },
    include: { group: true, table: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(guests);
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
    firstName,
    lastName,
    phone,
    email,
    groupId,
    side,
    relation,
    invitedCount,
    dietaryNeeds,
    accessibility,
    hasChildren,
    childrenCount,
    notes,
    vipLevel,
  } = body;

  if (!firstName) {
    return NextResponse.json(
      { error: "שם פרטי הוא שדה חובה" },
      { status: 400 }
    );
  }

  const guest = await prisma.guest.create({
    data: {
      eventId: id,
      firstName,
      lastName: lastName || null,
      phone: phone || null,
      email: email || null,
      groupId: groupId || null,
      side: side || "SHARED",
      relation: relation || null,
      invitedCount: invitedCount ? parseInt(invitedCount) : 1,
      dietaryNeeds: dietaryNeeds || null,
      accessibility: accessibility || null,
      hasChildren: hasChildren || false,
      childrenCount: childrenCount ? parseInt(childrenCount) : 0,
      notes: notes || null,
      vipLevel: vipLevel ? parseInt(vipLevel) : 0,
    },
    include: { group: true },
  });

  // Update event pending count
  await prisma.event.update({
    where: { id },
    data: { pendingCount: { increment: 1 } },
  });

  return NextResponse.json(guest, { status: 201 });
}
