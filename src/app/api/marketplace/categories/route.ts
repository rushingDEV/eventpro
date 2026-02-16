import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.vendorCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            vendors: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (e) {
    console.error("Categories fetch error:", e);
    return NextResponse.json([], { status: 500 });
  }
}
