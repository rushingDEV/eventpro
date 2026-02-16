import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

// Extract the direct DB URL from the prisma+postgres:// proxy URL
function getDirectUrl(): string {
  const url = process.env.DATABASE_URL!;
  if (!url.startsWith("prisma+postgres://")) return url;
  const apiKey = new URL(url).searchParams.get("api_key")!;
  const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString());
  return decoded.databaseUrl as string;
}

const directUrl = getDirectUrl();
const pool = new Pool({ connectionString: directUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "צלמים ווידאו", slug: "photographers", icon: "camera", order: 1, description: "צילום סטילס, וידאו, דרון ומגנטים לאירוע" },
  { name: "DJ ומוזיקה", slug: "music", icon: "music", order: 2, description: "תקליטנים, להקות, זמרים ומוזיקה חיה" },
  { name: "עיצוב פרחים", slug: "florists", icon: "flower-2", order: 3, description: "סידורי פרחים, חופה, שולחנות ועיצוב אירוע" },
  { name: "שמלות וחליפות", slug: "fashion", icon: "shirt", order: 4, description: "שמלות כלה, חליפות חתן ואביזרים" },
  { name: "קייטרינג", slug: "catering", icon: "utensils-crossed", order: 5, description: "קייטרינג, שף פרטי ותפריט אירועים" },
  { name: "הזמנות", slug: "invitations", icon: "mail", order: 6, description: "הזמנות דיגיטליות ומודפסות" },
  { name: "עוגות ומאפים", slug: "cakes", icon: "cake-slice", order: 7, description: "עוגות חתונה, מאפים וקינוחים" },
  { name: "רכב", slug: "transportation", icon: "car", order: 8, description: "רכב יוקרה, הסעות והסעות לאורחים" },
  { name: "מגנטים ופוטובוס", slug: "photo-booth", icon: "image", order: 9, description: "מגנטים, פוטובוס ואטרקציות צילום" },
  { name: "מייקאפ ושיער", slug: "beauty", icon: "sparkles", order: 10, description: "איפור כלה, עיצוב שיער וטיפוח" },
  { name: "תאורה", slug: "lighting", icon: "lightbulb", order: 11, description: "תאורת אירועים, לדים ואפקטים" },
  { name: "ריקודים ובידור", slug: "entertainment", icon: "party-popper", order: 12, description: "להקת ריקודים, בדרנים ובידור" },
  { name: "הפקה", slug: "production", icon: "clapperboard", order: 13, description: "הפקת אירועים, ניהול וקורדינציה" },
  { name: "רבנות", slug: "rabbinate", icon: "scroll-text", order: 14, description: "רבנות, חופה וקידושין" },
  { name: "אטרקציות", slug: "attractions", icon: "ferris-wheel", order: 15, description: "אטרקציות, משחקים ופעילויות" },
  { name: "אחר", slug: "other", icon: "plus-circle", order: 99, description: "ספקים נוספים" },
];

async function main() {
  console.log("Seeding vendor categories...");

  for (const cat of categories) {
    await prisma.vendorCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, order: cat.order, description: cat.description },
      create: cat,
    });
  }

  console.log(`Seeded ${categories.length} vendor categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
