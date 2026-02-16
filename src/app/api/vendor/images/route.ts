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

    if (!profile) {
      return NextResponse.json({ error: "לא נמצא פרופיל" }, { status: 404 });
    }

    const images = await prisma.vendorImage.findMany({
      where: { vendorId: profile.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(images);
  } catch (e) {
    console.error("Images fetch error:", e);
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

    if (!profile) {
      return NextResponse.json({ error: "לא נמצא פרופיל" }, { status: 404 });
    }

    const body = await request.json();
    const { url, publicId, caption, width, height } = body;

    if (!url) {
      return NextResponse.json({ error: "חסר URL" }, { status: 400 });
    }

    // Get current max order
    const lastImage = await prisma.vendorImage.findFirst({
      where: { vendorId: profile.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const image = await prisma.vendorImage.create({
      data: {
        vendorId: profile.id,
        url,
        publicId: publicId || null,
        caption: caption || null,
        width: width || null,
        height: height || null,
        order: (lastImage?.order || 0) + 1,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (e) {
    console.error("Image create error:", e);
    return NextResponse.json({ error: "שגיאה בהעלאת תמונה" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("id");

    if (!imageId) {
      return NextResponse.json({ error: "חסר מזהה תמונה" }, { status: 400 });
    }

    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "לא נמצא פרופיל" }, { status: 404 });
    }

    await prisma.vendorImage.deleteMany({
      where: { id: imageId, vendorId: profile.id },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Image delete error:", e);
    return NextResponse.json({ error: "שגיאה במחיקת תמונה" }, { status: 500 });
  }
}
