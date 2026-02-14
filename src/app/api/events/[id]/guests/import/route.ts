import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface ImportRow {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  group?: string;
  side?: string;
  invitedCount?: number;
  notes?: string;
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
  const { guests: rows } = body as { guests: ImportRow[] };

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "לא נמצאו נתונים לייבוא" },
      { status: 400 }
    );
  }

  // Get or create groups
  const groupNames = [...new Set(rows.map((r) => r.group).filter(Boolean))] as string[];
  const existingGroups = await prisma.guestGroup.findMany({
    where: { eventId: id, name: { in: groupNames } },
  });

  const groupMap = new Map(existingGroups.map((g) => [g.name, g.id]));

  for (const name of groupNames) {
    if (!groupMap.has(name)) {
      const group = await prisma.guestGroup.create({
        data: { eventId: id, name, side: "SHARED" },
      });
      groupMap.set(name, group.id);
    }
  }

  // Create guests
  const sideMap: Record<string, string> = {
    חתן: "GROOM",
    כלה: "BRIDE",
    משותף: "SHARED",
  };

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.firstName) {
      skipped++;
      continue;
    }

    try {
      await prisma.guest.create({
        data: {
          eventId: id,
          firstName: row.firstName,
          lastName: row.lastName || null,
          phone: row.phone || null,
          email: row.email || null,
          groupId: row.group ? groupMap.get(row.group) || null : null,
          side: (sideMap[row.side || ""] as "GROOM" | "BRIDE" | "SHARED") || "SHARED",
          invitedCount: row.invitedCount || 1,
          notes: row.notes || null,
        },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({
    created,
    skipped,
    total: rows.length,
  });
}
