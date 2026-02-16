import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) return NextResponse.json([], { status: 404 });

    const leads = await prisma.vendorLead.findMany({
      where: { vendorId: profile.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(leads);
  } catch (e) {
    console.error("Leads fetch error:", e);
    return NextResponse.json([], { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) return NextResponse.json({ error: "לא נמצא פרופיל" }, { status: 404 });

    const body = await request.json();
    const { id, status, vendorNotes, dealAmount, commissionRate } = body;

    if (!id) return NextResponse.json({ error: "חסר מזהה ליד" }, { status: 400 });

    const updated = await prisma.vendorLead.updateMany({
      where: { id, vendorId: profile.id },
      data: {
        ...(status !== undefined && { status }),
        ...(vendorNotes !== undefined && { vendorNotes }),
        ...(dealAmount !== undefined && { dealAmount: parseFloat(dealAmount) }),
        ...(commissionRate !== undefined && { commissionRate: parseFloat(commissionRate) }),
      },
    });

    return NextResponse.json({ updated: updated.count });
  } catch (e) {
    console.error("Lead update error:", e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
