import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateSlug, makeUniqueSlug } from "@/lib/vendor-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, businessName, categoryId, city, contactPhone } = body;

    if (!name || !email || !password || !businessName || !categoryId || !city) {
      return NextResponse.json(
        { error: "כל השדות המסומנים הם חובה" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "הסיסמה חייבת להכיל לפחות 6 תווים" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "כתובת האימייל כבר רשומה במערכת" },
        { status: 409 }
      );
    }

    const category = await prisma.vendorCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json(
        { error: "קטגוריה לא חוקית" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = generateSlug(businessName);
    const existingSlugs = (
      await prisma.vendorProfile.findMany({
        where: { slug: { startsWith: baseSlug } },
        select: { slug: true },
      })
    ).map((v) => v.slug);
    const slug = makeUniqueSlug(baseSlug, existingSlugs);

    const passwordHash = await hash(password, 12);

    // Create User + VendorProfile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "VENDOR",
        },
      });

      const vendor = await tx.vendorProfile.create({
        data: {
          userId: user.id,
          businessName,
          slug,
          categoryId,
          city,
          contactPhone: contactPhone || null,
          contactEmail: email,
          status: "DRAFT",
          completionScore: 15, // businessName + city = base score
        },
      });

      return { user, vendor };
    });

    return NextResponse.json(
      {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        vendorId: result.vendor.id,
        slug: result.vendor.slug,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("Vendor registration error:", e);
    return NextResponse.json(
      { error: "שגיאה ביצירת חשבון הספק" },
      { status: 500 }
    );
  }
}
