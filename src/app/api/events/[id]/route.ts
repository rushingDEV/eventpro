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
    include: {
      guests: { include: { group: true } },
      groups: { include: { _count: { select: { guests: true } } } },
      tables: { include: { _count: { select: { guests: true } } } },
      _count: { select: { guests: true, gifts: true, tasks: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const body = await request.json();
  const { name, type, date, time, venueId, minGuarantee, pricePerPlate, miniSiteSlug, miniSiteConfig } = body;

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(type && { type }),
      ...(date && { date: new Date(date) }),
      ...(time !== undefined && { time }),
      ...(venueId !== undefined && { venueId }),
      ...(minGuarantee !== undefined && {
        minGuarantee: minGuarantee ? parseInt(minGuarantee) : null,
      }),
      ...(pricePerPlate !== undefined && {
        pricePerPlate: pricePerPlate ? parseFloat(pricePerPlate) : null,
      }),
      ...(miniSiteSlug !== undefined && { miniSiteSlug }),
      ...(miniSiteConfig !== undefined && { miniSiteConfig }),
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
