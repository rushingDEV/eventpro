import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL!;

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  // Check existing users
  const users = await pool.query('SELECT id, email, name FROM "User"');
  console.log("Users:", JSON.stringify(users.rows, null, 2));

  if (users.rows.length === 0) {
    console.log("No users found. Please register first.");
    await pool.end();
    return;
  }

  const userId = users.rows[0].id;
  console.log(`Using user: ${users.rows[0].name} (${users.rows[0].email})`);

  // Create demo event
  const eventResult = await pool.query(
    `INSERT INTO "Event" (id, name, type, date, time, "userId", "miniSiteSlug", "minGuarantee", "pricePerPlate", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     RETURNING id, name, "miniSiteSlug"`,
    [
      "החתונה של דנה ויואב",
      "WEDDING",
      "2026-06-20T00:00:00.000Z",
      "19:00",
      userId,
      "dana-yoav-wedding",
      300,
      380,
    ]
  );

  const eventId = eventResult.rows[0].id;
  console.log(`Created event: ${eventResult.rows[0].name} (${eventId})`);

  // Create guest groups
  const groups = [
    { name: "משפחת החתן", color: "#3B82F6", side: "GROOM", proximity: 10 },
    { name: "משפחת הכלה", color: "#EC4899", side: "BRIDE", proximity: 10 },
    { name: "חברים של החתן", color: "#10B981", side: "GROOM", proximity: 7 },
    { name: "חברים של הכלה", color: "#F59E0B", side: "BRIDE", proximity: 7 },
    { name: "עבודה", color: "#8B5CF6", side: "SHARED", proximity: 5 },
    { name: "שכנים", color: "#6B7280", side: "SHARED", proximity: 4 },
  ];

  const groupIds: Record<string, string> = {};
  for (const g of groups) {
    const res = await pool.query(
      `INSERT INTO "GuestGroup" (id, name, color, side, proximity, "eventId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
       RETURNING id, name`,
      [g.name, g.color, g.side, g.proximity, eventId]
    );
    groupIds[g.name] = res.rows[0].id;
    console.log(`Created group: ${res.rows[0].name}`);
  }

  // Create guests
  const guests = [
    // משפחת החתן
    { first: "אבי", last: "כהן", phone: "0501111111", group: "משפחת החתן", rsvp: "CONFIRMED", count: 2, side: "GROOM" },
    { first: "רחל", last: "כהן", phone: "0501111112", group: "משפחת החתן", rsvp: "CONFIRMED", count: 2, side: "GROOM" },
    { first: "דוד", last: "כהן", phone: "0501111113", group: "משפחת החתן", rsvp: "CONFIRMED", count: 3, side: "GROOM" },
    { first: "שרה", last: "לוי", phone: "0501111114", group: "משפחת החתן", rsvp: "CONFIRMED", count: 2, side: "GROOM" },
    { first: "משה", last: "כהן", phone: "0501111115", group: "משפחת החתן", rsvp: "PENDING", count: 4, side: "GROOM" },
    { first: "יעל", last: "כהן", phone: "0501111116", group: "משפחת החתן", rsvp: "CONFIRMED", count: 2, side: "GROOM" },
    // משפחת הכלה
    { first: "יוסי", last: "מזרחי", phone: "0502222221", group: "משפחת הכלה", rsvp: "CONFIRMED", count: 2, side: "BRIDE" },
    { first: "מירה", last: "מזרחי", phone: "0502222222", group: "משפחת הכלה", rsvp: "CONFIRMED", count: 2, side: "BRIDE" },
    { first: "אלון", last: "מזרחי", phone: "0502222223", group: "משפחת הכלה", rsvp: "CONFIRMED", count: 3, side: "BRIDE" },
    { first: "נועה", last: "אברהם", phone: "0502222224", group: "משפחת הכלה", rsvp: "DECLINED", count: 0, side: "BRIDE" },
    { first: "חיים", last: "מזרחי", phone: "0502222225", group: "משפחת הכלה", rsvp: "CONFIRMED", count: 2, side: "BRIDE" },
    { first: "רינה", last: "מזרחי", phone: "0502222226", group: "משפחת הכלה", rsvp: "MAYBE", count: 2, side: "BRIDE" },
    // חברים של החתן
    { first: "עומר", last: "שמעוני", phone: "0503333331", group: "חברים של החתן", rsvp: "CONFIRMED", count: 2, side: "GROOM" },
    { first: "תומר", last: "ברק", phone: "0503333332", group: "חברים של החתן", rsvp: "CONFIRMED", count: 1, side: "GROOM" },
    { first: "ליאור", last: "גולן", phone: "0503333333", group: "חברים של החתן", rsvp: "CONFIRMED", count: 2, side: "GROOM" },
    { first: "אייל", last: "פרץ", phone: "0503333334", group: "חברים של החתן", rsvp: "PENDING", count: 2, side: "GROOM" },
    { first: "נועם", last: "רוזן", phone: "0503333335", group: "חברים של החתן", rsvp: "CONFIRMED", count: 2, side: "GROOM" },
    { first: "איתמר", last: "דהן", phone: "0503333336", group: "חברים של החתן", rsvp: "NO_RESPONSE", count: 0, side: "GROOM" },
    // חברים של הכלה
    { first: "שירה", last: "אלון", phone: "0504444441", group: "חברים של הכלה", rsvp: "CONFIRMED", count: 2, side: "BRIDE" },
    { first: "מיכל", last: "בן דוד", phone: "0504444442", group: "חברים של הכלה", rsvp: "CONFIRMED", count: 1, side: "BRIDE" },
    { first: "הילה", last: "שפירא", phone: "0504444443", group: "חברים של הכלה", rsvp: "CONFIRMED", count: 2, side: "BRIDE" },
    { first: "רוני", last: "קליין", phone: "0504444444", group: "חברים של הכלה", rsvp: "PENDING", count: 2, side: "BRIDE" },
    { first: "טלי", last: "נחמיאס", phone: "0504444445", group: "חברים של הכלה", rsvp: "CONFIRMED", count: 2, side: "BRIDE" },
    // עבודה
    { first: "רון", last: "אביב", phone: "0505555551", group: "עבודה", rsvp: "CONFIRMED", count: 2, side: "SHARED" },
    { first: "גלית", last: "חן", phone: "0505555552", group: "עבודה", rsvp: "CONFIRMED", count: 2, side: "SHARED" },
    { first: "אסף", last: "ישראלי", phone: "0505555553", group: "עבודה", rsvp: "MAYBE", count: 2, side: "SHARED" },
    { first: "דפנה", last: "עוז", phone: "0505555554", group: "עבודה", rsvp: "CONFIRMED", count: 1, side: "SHARED" },
    // שכנים
    { first: "יגאל", last: "סגל", phone: "0506666661", group: "שכנים", rsvp: "CONFIRMED", count: 2, side: "SHARED" },
    { first: "ורד", last: "קפלן", phone: "0506666662", group: "שכנים", rsvp: "PENDING", count: 2, side: "SHARED" },
    { first: "עמית", last: "הרוש", phone: "0506666663", group: "שכנים", rsvp: "CONFIRMED", count: 2, side: "SHARED" },
  ];

  for (const g of guests) {
    await pool.query(
      `INSERT INTO "Guest" (id, "firstName", "lastName", phone, side, "rsvpStatus", "rsvpCount", "groupId", "eventId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [g.first, g.last, g.phone, g.side, g.rsvp, g.count, groupIds[g.group], eventId]
    );
  }
  console.log(`Created ${guests.length} guests`);

  // Create tables
  const tables = [
    { number: 1, name: "שולחן כבוד", shape: "RECTANGLE", capacity: 12, posX: 450, posY: 80, width: 200, height: 80, isVIP: true },
    { number: 2, name: null, shape: "ROUND", capacity: 10, posX: 150, posY: 250, radius: 50, isVIP: false },
    { number: 3, name: null, shape: "ROUND", capacity: 10, posX: 350, posY: 250, radius: 50, isVIP: false },
    { number: 4, name: null, shape: "ROUND", capacity: 10, posX: 550, posY: 250, radius: 50, isVIP: false },
    { number: 5, name: null, shape: "ROUND", capacity: 10, posX: 750, posY: 250, radius: 50, isVIP: false },
    { number: 6, name: null, shape: "ROUND", capacity: 10, posX: 150, posY: 420, radius: 50, isVIP: false },
    { number: 7, name: null, shape: "ROUND", capacity: 10, posX: 350, posY: 420, radius: 50, isVIP: false },
    { number: 8, name: null, shape: "ROUND", capacity: 10, posX: 550, posY: 420, radius: 50, isVIP: false },
    { number: 9, name: null, shape: "ROUND", capacity: 10, posX: 750, posY: 420, radius: 50, isVIP: false },
    { number: 10, name: null, shape: "ROUND", capacity: 8, posX: 450, posY: 560, radius: 45, isVIP: false },
  ];

  for (const t of tables) {
    await pool.query(
      `INSERT INTO "EventTable" (id, number, name, shape, capacity, "posX", "posY", width, height, radius, "isVIP", "isLocked", zone, "eventId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, 'main', $11, NOW())`,
      [
        t.number,
        t.name,
        t.shape,
        t.capacity,
        t.posX,
        t.posY,
        t.shape === "RECTANGLE" ? (t as any).width : null,
        t.shape === "RECTANGLE" ? (t as any).height : null,
        t.shape === "ROUND" ? (t as any).radius : null,
        t.isVIP,
        eventId,
      ]
    );
  }
  console.log(`Created ${tables.length} tables`);

  // Create tasks
  const tasks = [
    { title: "לסגור DJ", category: "ספקים", priority: 9, dueDate: "2026-03-01" },
    { title: "להזמין הזמנות", category: "תקשורת", priority: 8, dueDate: "2026-03-15" },
    { title: "לאשר תפריט עם הקייטרינג", category: "ספקים", priority: 9, dueDate: "2026-04-01" },
    { title: "לבחור שירים לטקס", category: "כללי", priority: 6, dueDate: "2026-05-01" },
    { title: "לסגור צלם", category: "ספקים", priority: 10, dueDate: "2026-02-28" },
    { title: "לשלוח תזכורות RSVP", category: "תקשורת", priority: 7, dueDate: "2026-05-15" },
    { title: "להכין סידורי הושבה", category: "הושבה", priority: 8, dueDate: "2026-06-01" },
    { title: "לתאם הגעה עם רב", category: "לוגיסטיקה", priority: 7, dueDate: "2026-06-10" },
  ];

  for (const t of tasks) {
    await pool.query(
      `INSERT INTO "Task" (id, title, category, priority, "dueDate", completed, "eventId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, false, $5, NOW())`,
      [t.title, t.category, t.priority, t.dueDate, eventId]
    );
  }
  console.log(`Created ${tasks.length} tasks`);

  // Create some gifts
  const confirmedGuests = await pool.query(
    `SELECT id, "firstName", "lastName" FROM "Guest" WHERE "eventId" = $1 AND "rsvpStatus" = 'CONFIRMED' LIMIT 8`,
    [eventId]
  );

  const giftTypes = ["CASH", "CHECK", "TRANSFER", "CASH", "CASH", "CHECK", "TRANSFER", "CASH"];
  const giftAmounts = [500, 750, 1000, 300, 600, 800, 1500, 400];

  for (let i = 0; i < Math.min(confirmedGuests.rows.length, 8); i++) {
    const guest = confirmedGuests.rows[i];
    await pool.query(
      `INSERT INTO "Gift" (id, type, amount, "guestId", "eventId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
      [giftTypes[i], giftAmounts[i], guest.id, eventId]
    );
  }
  console.log(`Created ${Math.min(confirmedGuests.rows.length, 8)} gifts`);

  // Summary
  const guestCount = await pool.query(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN "rsvpStatus" = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed,
            SUM(CASE WHEN "rsvpStatus" = 'CONFIRMED' THEN "rsvpCount" ELSE 0 END) as confirmed_count
     FROM "Guest" WHERE "eventId" = $1`,
    [eventId]
  );

  console.log("\n=== DEMO DATA SUMMARY ===");
  console.log(`Event: ${eventResult.rows[0].name}`);
  console.log(`Event ID: ${eventId}`);
  console.log(`Mini-site slug: ${eventResult.rows[0].miniSiteSlug}`);
  console.log(`Total guests: ${guestCount.rows[0].total}`);
  console.log(`Confirmed: ${guestCount.rows[0].confirmed}`);
  console.log(`Confirmed count (people): ${guestCount.rows[0].confirmed_count}`);
  console.log(`Tables: ${tables.length}`);
  console.log(`Tasks: ${tasks.length}`);
  console.log(`Groups: ${groups.length}`);
  console.log("========================\n");

  await pool.end();
}

main().catch(console.error);
