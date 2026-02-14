import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { runSeatingAlgorithm } from "@/lib/seating/algorithm";
import type { SeatingGuest, SeatingTable } from "@/lib/seating/types";

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
    include: {
      guests: { include: { group: true } },
      tables: true,
      groups: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    maxEmptySeatsPerTable = 2,
    respectGroupIntegrity = true,
    balanceSides = true,
    apply = false,
  } = body;

  // Map guests
  const seatingGuests: SeatingGuest[] = event.guests
    .filter((g) => g.rsvpStatus === "CONFIRMED" || g.rsvpStatus === "PENDING")
    .map((g) => ({
      id: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      groupId: g.groupId,
      side: g.side,
      rsvpStatus: g.rsvpStatus,
      rsvpCount: g.rsvpCount,
      vipLevel: g.vipLevel,
      dietaryNeeds: g.dietaryNeeds,
      accessibility: g.accessibility,
      tableId: g.tableId,
      proximityScores: g.proximityScores as Record<string, number> | null,
    }));

  // Map tables
  const seatingTables: SeatingTable[] = event.tables.map((t) => ({
    id: t.id,
    number: t.number,
    name: t.name,
    capacity: t.capacity,
    isLocked: t.isLocked,
    isVIP: t.isVIP,
    zone: t.zone,
    guests: event.guests
      .filter((g) => g.tableId === t.id)
      .map((g) => g.id),
  }));

  // Build group proximities
  const groupProximities = new Map<string, Record<string, number>>();
  for (const group of event.groups) {
    if (group.proximity) {
      groupProximities.set(
        group.id,
        group.proximity as Record<string, number>
      );
    }
  }

  // Locked assignments (already assigned guests at locked tables)
  const lockedAssignments = new Map<string, string>();
  for (const guest of event.guests) {
    if (guest.tableId) {
      const table = event.tables.find((t) => t.id === guest.tableId);
      if (table?.isLocked) {
        lockedAssignments.set(guest.id, guest.tableId);
      }
    }
  }

  const result = runSeatingAlgorithm(
    seatingGuests,
    seatingTables,
    {
      maxEmptySeatsPerTable,
      respectGroupIntegrity,
      balanceSides,
      separateList: [],
      togetherList: [],
      lockedAssignments,
    },
    groupProximities,
    event.pricePerPlate || 0
  );

  // Apply assignments to database if requested
  if (apply) {
    const updates = [];
    for (const [guestId, tableId] of result.assignments) {
      updates.push(
        prisma.guest.update({
          where: { id: guestId },
          data: { tableId },
        })
      );
    }
    await Promise.all(updates);

    // Update event stats
    await prisma.event.update({
      where: { id },
      data: { totalSeated: result.stats.totalSeated },
    });
  }

  // Serialize Maps for JSON
  return NextResponse.json({
    assignments: Object.fromEntries(result.assignments),
    score: result.score,
    tableScores: Object.fromEntries(result.tableScores),
    warnings: result.warnings,
    suggestions: result.suggestions,
    stats: result.stats,
  });
}
