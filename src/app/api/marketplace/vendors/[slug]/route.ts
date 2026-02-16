import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const vendor = await prisma.vendorProfile.findUnique({
      where: { slug, status: "ACTIVE" },
      include: {
        category: true,
        user: { select: { name: true } },
        images: { orderBy: { order: "asc" } },
        packages: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        reviews: {
          where: { isPublished: true },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: { select: { name: true } },
          },
        },
        _count: {
          select: {
            reviews: { where: { isPublished: true } },
            favorites: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "ספק לא נמצא" }, { status: 404 });
    }

    // Compute rating distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: vendor.reviews.filter((r) => r.rating === rating).length,
    }));

    return NextResponse.json({ ...vendor, ratingDistribution });
  } catch (e) {
    console.error("Vendor fetch error:", e);
    return NextResponse.json({ error: "שגיאה בטעינת הספק" }, { status: 500 });
  }
}
