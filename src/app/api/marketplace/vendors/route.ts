import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const minRating = searchParams.get("minRating");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const verified = searchParams.get("verified");
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort") || "relevance";
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // Build where clause
    const where: Record<string, unknown> = {
      status: "ACTIVE",
    };

    if (category) {
      where.category = { slug: category };
    }

    if (city) {
      where.OR = [
        { city: { contains: city, mode: "insensitive" } },
        { areasServed: { has: city } },
      ];
    }

    if (minRating) {
      where.ratingAverage = { gte: parseFloat(minRating) };
    }

    if (minPrice || maxPrice) {
      where.priceRangeMin = {};
      if (minPrice) (where.priceRangeMin as Record<string, number>).gte = parseInt(minPrice);
      if (maxPrice) (where.priceRangeMin as Record<string, number>).lte = parseInt(maxPrice);
    }

    if (verified === "true") {
      where.isVerified = true;
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build orderBy
    let orderBy: Record<string, string>[] = [];
    switch (sort) {
      case "rating":
        orderBy = [{ ratingAverage: "desc" }, { reviewCount: "desc" }];
        break;
      case "price_asc":
        orderBy = [{ priceRangeMin: "asc" }];
        break;
      case "price_desc":
        orderBy = [{ priceRangeMin: "desc" }];
        break;
      case "newest":
        orderBy = [{ createdAt: "desc" }];
        break;
      default: // relevance
        orderBy = [{ isFeatured: "desc" }, { ratingAverage: "desc" }, { reviewCount: "desc" }];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendorProfile.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { name: true, slug: true } },
          images: {
            take: 1,
            orderBy: { order: "asc" },
            select: { url: true },
          },
          _count: { select: { reviews: true, leads: true } },
        },
      }),
      prisma.vendorProfile.count({ where }),
    ]);

    return NextResponse.json({
      vendors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("Vendors fetch error:", e);
    return NextResponse.json({ vendors: [], total: 0, page: 1, totalPages: 0 }, { status: 500 });
  }
}
