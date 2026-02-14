export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
}

export const messageTemplates: MessageTemplate[] = [
  {
    id: "save_the_date",
    name: "Save The Date",
    category: "הזמנה",
    content: `שלום {guestName}! 🎉
שמרו את התאריך!
{eventName}
📅 {eventDate}
🕖 {eventTime}
📍 {venueName}

פרטים נוספים ימסרו בקרוב!
❤️ {coupleName}`,
    variables: [
      "guestName",
      "eventName",
      "eventDate",
      "eventTime",
      "venueName",
      "coupleName",
    ],
  },
  {
    id: "invitation",
    name: "הזמנה רשמית",
    category: "הזמנה",
    content: `שלום {guestName}! 💌
שמחים להזמין אותך ל{eventName}!

📅 {eventDate}
🕖 {eventTime}
📍 {venueName}, {venueAddress}

נשמח לדעת אם תגיעו:
👉 {rsvpLink}

❤️ {coupleName}`,
    variables: [
      "guestName",
      "eventName",
      "eventDate",
      "eventTime",
      "venueName",
      "venueAddress",
      "rsvpLink",
      "coupleName",
    ],
  },
  {
    id: "reminder",
    name: "תזכורת",
    category: "תזכורת",
    content: `שלום {guestName}! 🔔
רק רצינו לוודא — האם תגיעו ל{eventName}?

📅 {eventDate}
📍 {venueName}

עדיין לא אישרת? לחץ כאן:
👉 {rsvpLink}

❤️ {coupleName}`,
    variables: [
      "guestName",
      "eventName",
      "eventDate",
      "venueName",
      "rsvpLink",
      "coupleName",
    ],
  },
  {
    id: "pre_event",
    name: "יום לפני האירוע",
    category: "אירוע",
    content: `שלום {guestName}! 🎉
מחר זה היום!
{eventName}

📍 {venueName}
🕖 שעת הגעה: {eventTime}
🪑 השולחן שלך: {tableNumber}

📍 הגעה ב-Waze: {wazeLink}

נתראה מחר! ❤️ {coupleName}`,
    variables: [
      "guestName",
      "eventName",
      "venueName",
      "eventTime",
      "tableNumber",
      "wazeLink",
      "coupleName",
    ],
  },
  {
    id: "thank_you",
    name: "תודה",
    category: "אחרי אירוע",
    content: `{guestName} יקר/ה! 💝
תודה שהגעתם ל{eventName}!
היה לנו כל כך כיף לראות אתכם.

תודה על המתנה המדהימה! 🎁

❤️ {coupleName}`,
    variables: ["guestName", "eventName", "coupleName"],
  },
];

export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}
