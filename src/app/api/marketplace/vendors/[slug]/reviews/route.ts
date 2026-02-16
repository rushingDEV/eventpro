import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { computeRatingAverage } from "@/lib/vendor-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;

    const vendor = await prisma.vendorProfile.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
    }

    const [reviews, total] = await Promise.all([
      prisma.vendorReview.findMany({
        where: { vendorId: vendor.id, isPublished: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { name: true } } },
      }),
      prisma.vendorReview.count({
        where: { vendorId: vendor.id, isPublished: true },
      }),
    ]);

    return NextResponse.json({ reviews, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("Reviews fetch error:", e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { rating, title, text, eventType } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "דירוג חייב להיות בין 1 ל-5" }, { status: 400 });
    }

    const vendor = await prisma.vendorProfile.findUnique({
      where: { slug },
      select: { id: true, userId: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
    }

    if (vendor.userId === session.user.id) {
      return NextResponse.json({ error: "לא ניתן לדרג את העסק שלך" }, { status: 400 });
    }

    const review = await prisma.vendorReview.create({
      data: {
        vendorId: vendor.id,
        userId: session.user.id,
        rating,
        title: title || null,
        text: text || null,
        eventType: eventType || null,
      },
    });

    // Update vendor rating stats
    const allRatings = await prisma.vendorReview.findMany({
      where: { vendorId: vendor.id, isPublished: true },
      select: { rating: true },
    });

    const avg = computeRatingAverage(allRatings.map((r) => r.rating));
    await prisma.vendorProfile.update({
      where: { id: vendor.id },
      data: {
        ratingAverage: avg,
        reviewCount: allRatings.length,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (e) {
    console.error("Review create error:", e);
    return NextResponse.json({ error: "שגיאה ביצירת ביקורת" }, { status: 500 });
  }
}
