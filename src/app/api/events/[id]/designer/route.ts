import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { DesignerSaveData } from "@/lib/designer/types";

// GET — load designer state for event
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      floorPlan: true,
      tables: {
        select: {
          id: true,
          number: true,
          name: true,
          shape: true,
          capacity: true,
          posX: true,
          posY: true,
          rotation: true,
          width: true,
          height: true,
          radius: true,
          isLocked: true,
          isVIP: true,
          zone: true,
          _count: { select: { guests: true } },
        },
        orderBy: { number: "asc" },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    floorPlan: event.floorPlan || null,
    tables: event.tables,
  });
}

// PUT — save designer state
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as DesignerSaveData;

  // Verify ownership
  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Save designer state to floorPlan JSON field
  await prisma.event.update({
    where: { id },
    data: { floorPlan: JSON.parse(JSON.stringify(body)) },
  });

  // Sync table elements back to EventTable records
  const tableElements = (body.elements || []).filter(
    (el) => el.type === "table",
  );

  if (tableElements.length > 0) {
    // Get existing tables for this event
    const existingTables = await prisma.eventTable.findMany({
      where: { eventId: id },
      select: { id: true, number: true },
    });
    const existingByNumber = new Map(existingTables.map((t) => [t.number, t.id]));

    for (const el of tableElements) {
      const meta = el.metadata as Record<string, unknown>;
      const tableNumber = (meta.tableNumber as number) || 0;
      const tableShape = (meta.tableShape as string) || "ROUND";
      const capacity = (meta.capacity as number) || 8;
      const isVIP = (meta.isVIP as boolean) || false;
      const radius = (meta.radius as number) || undefined;
      const eventTableId = meta.eventTableId as string | undefined;

      const tableData = {
        number: tableNumber,
        name: el.name || null,
        shape: tableShape as "ROUND" | "RECTANGLE" | "SQUARE" | "OVAL" | "LONG",
        capacity,
        posX: Math.round(el.x),
        posY: Math.round(el.y),
        rotation: Math.round(el.rotation),
        width: Math.round(el.width),
        height: Math.round(el.height),
        radius: radius ? Math.round(radius) : null,
        isLocked: el.locked,
        isVIP,
      };

      if (eventTableId && existingByNumber.has(tableNumber)) {
        await prisma.eventTable.update({
          where: { id: eventTableId },
          data: tableData,
        });
      } else if (existingByNumber.has(tableNumber)) {
        await prisma.eventTable.update({
          where: { id: existingByNumber.get(tableNumber)! },
          data: tableData,
        });
      } else {
        const newTable = await prisma.eventTable.create({
          data: { ...tableData, eventId: id },
        });
        // Update the element metadata with the new DB id
        (meta as Record<string, unknown>).eventTableId = newTable.id;
      }
    }
  }

  return NextResponse.json({ ok: true });
}
