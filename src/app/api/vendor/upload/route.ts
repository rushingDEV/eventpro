import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUploadSignature } from "@/lib/cloudinary";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    }

    const { timestamp, signature, cloudName, apiKey } = getUploadSignature("eventpro/vendors");

    return NextResponse.json({
      timestamp,
      signature,
      cloudName,
      apiKey,
      folder: "eventpro/vendors",
    });
  } catch (e) {
    console.error("Upload signature error:", e);
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }
}
