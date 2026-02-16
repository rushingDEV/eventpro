import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { computeCompletionScore, generateSlug, makeUniqueSlug } from "@/lib/vendor-utils";

async function getVendorProfile(userId: string) {
  return prisma.vendorProfile.findUnique({
    where: { userId },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { images: true, packages: true, reviews: true, leads: true } },
    },
  });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const profile = await getVendorProfile(session.user.id);
    if (!profile) {
      return NextResponse.json({ error: "לא נמצא פרופיל ספק" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (e) {
    console.error("Profile fetch error:", e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const existing = await prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
      include: { _count: { select: { images: true, packages: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "לא נמצא פרופיל ספק" }, { status: 404 });
    }

    const body = await request.json();
    const {
      businessName, bio, shortDescription, categoryId, city, areasServed,
      contactPhone, contactEmail, website, instagramUrl, facebookUrl, tiktokUrl,
      whatsappNumber, logoUrl, coverUrl, priceRangeMin, priceRangeMax,
      experienceYears, eventsCompleted, availabilityNote,
    } = body;

    // If business name changed, regenerate slug
    let slug = existing.slug;
    if (businessName && businessName !== existing.businessName) {
      const baseSlug = generateSlug(businessName);
      const existingSlugs = (
        await prisma.vendorProfile.findMany({
          where: { slug: { startsWith: baseSlug }, id: { not: existing.id } },
          select: { slug: true },
        })
      ).map((v) => v.slug);
      slug = makeUniqueSlug(baseSlug, existingSlugs);
    }

    // Compute completion score
    const scoreInput = {
      businessName: businessName || existing.businessName,
      bio: bio !== undefined ? bio : existing.bio,
      shortDescription: shortDescription !== undefined ? shortDescription : existing.shortDescription,
      city: city || existing.city,
      contactPhone: contactPhone !== undefined ? contactPhone : existing.contactPhone,
      contactEmail: contactEmail !== undefined ? contactEmail : existing.contactEmail,
      logoUrl: logoUrl !== undefined ? logoUrl : existing.logoUrl,
      coverUrl: coverUrl !== undefined ? coverUrl : existing.coverUrl,
      priceRangeMin: priceRangeMin !== undefined ? priceRangeMin : existing.priceRangeMin,
      priceRangeMax: priceRangeMax !== undefined ? priceRangeMax : existing.priceRangeMax,
      experienceYears: experienceYears !== undefined ? experienceYears : existing.experienceYears,
      website: website !== undefined ? website : existing.website,
      instagramUrl: instagramUrl !== undefined ? instagramUrl : existing.instagramUrl,
      areasServed: areasServed || existing.areasServed,
      imageCount: existing._count.images,
      packageCount: existing._count.packages,
    };
    const completionScore = computeCompletionScore(scoreInput);

    const updated = await prisma.vendorProfile.update({
      where: { id: existing.id },
      data: {
        ...(businessName !== undefined && { businessName }),
        slug,
        ...(bio !== undefined && { bio }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(categoryId !== undefined && { categoryId }),
        ...(city !== undefined && { city }),
        ...(areasServed !== undefined && { areasServed }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(website !== undefined && { website }),
        ...(instagramUrl !== undefined && { instagramUrl }),
        ...(facebookUrl !== undefined && { facebookUrl }),
        ...(tiktokUrl !== undefined && { tiktokUrl }),
        ...(whatsappNumber !== undefined && { whatsappNumber }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(priceRangeMin !== undefined && { priceRangeMin }),
        ...(priceRangeMax !== undefined && { priceRangeMax }),
        ...(experienceYears !== undefined && { experienceYears }),
        ...(eventsCompleted !== undefined && { eventsCompleted }),
        ...(availabilityNote !== undefined && { availabilityNote }),
        completionScore,
        // Auto-publish when profile is reasonably complete
        ...(completionScore >= 50 && existing.status === "DRAFT" && { status: "ACTIVE" }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { images: true, packages: true, reviews: true, leads: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("Profile update error:", e);
    return NextResponse.json({ error: "שגיאה בעדכון הפרופיל" }, { status: 500 });
  }
}
