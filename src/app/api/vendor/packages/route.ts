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

    const packages = await prisma.vendorPackage.findMany({
      where: { vendorId: profile.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(packages);
  } catch (e) {
    console.error("Packages fetch error:", e);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const { name, description, price, features, isPopular } = body;

    if (!name) {
      return NextResponse.json({ error: "שם חבילה הוא חובה" }, { status: 400 });
    }

    const lastPkg = await prisma.vendorPackage.findFirst({
      where: { vendorId: profile.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const pkg = await prisma.vendorPackage.create({
      data: {
        vendorId: profile.id,
        name,
        description: description || null,
        price: price ? parseFloat(price) : null,
        features: features || [],
        isPopular: isPopular || false,
        order: (lastPkg?.order || 0) + 1,
      },
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (e) {
    console.error("Package create error:", e);
    return NextResponse.json({ error: "שגיאה ביצירת חבילה" }, { status: 500 });
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
    const { id, name, description, price, features, isPopular, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "חסר מזהה חבילה" }, { status: 400 });
    }

    const pkg = await prisma.vendorPackage.updateMany({
      where: { id, vendorId: profile.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(features !== undefined && { features }),
        ...(isPopular !== undefined && { isPopular }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ updated: pkg.count });
  } catch (e) {
    console.error("Package update error:", e);
    return NextResponse.json({ error: "שגיאה בעדכון חבילה" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pkgId = searchParams.get("id");

    if (!pkgId) return NextResponse.json({ error: "חסר מזהה" }, { status: 400 });

    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) return NextResponse.json({ error: "לא נמצא פרופיל" }, { status: 404 });

    await prisma.vendorPackage.deleteMany({
      where: { id: pkgId, vendorId: profile.id },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Package delete error:", e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
