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

    const reviews = await prisma.vendorReview.findMany({
      where: { vendorId: profile.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json(reviews);
  } catch (e) {
    console.error("Reviews fetch error:", e);
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
    const { reviewId, vendorResponse } = body;

    if (!reviewId || !vendorResponse) {
      return NextResponse.json({ error: "חסרים פרטים" }, { status: 400 });
    }

    await prisma.vendorReview.updateMany({
      where: { id: reviewId, vendorId: profile.id },
      data: {
        vendorResponse,
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Review respond error:", e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
