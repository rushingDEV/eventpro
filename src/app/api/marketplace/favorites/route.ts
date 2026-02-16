import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const favorites = await prisma.vendorFavorite.findMany({
      where: { userId: session.user.id },
      include: {
        vendor: {
          include: {
            category: { select: { name: true, slug: true } },
            images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(favorites);
  } catch (e) {
    console.error("Favorites fetch error:", e);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const { vendorId } = await request.json();
    if (!vendorId) {
      return NextResponse.json({ error: "חסר מזהה ספק" }, { status: 400 });
    }

    const existing = await prisma.vendorFavorite.findUnique({
      where: { userId_vendorId: { userId: session.user.id, vendorId } },
    });

    if (existing) {
      // Toggle off — remove
      await prisma.vendorFavorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ favorited: false });
    }

    // Toggle on — add
    await prisma.vendorFavorite.create({
      data: { userId: session.user.id, vendorId },
    });

    return NextResponse.json({ favorited: true }, { status: 201 });
  } catch (e) {
    console.error("Favorite toggle error:", e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
