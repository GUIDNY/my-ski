import { createServerClient } from "@/lib/supabase-server";
import { matchingWeek, skiDaysFromNights } from "@/lib/pricing";
import type { Apartment, SkiPass } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Same per-night formula used everywhere else on the site (apartments/[id],
// /combo, QuoteView): €30/night under a week, €120 for a full week, +€20 per
// extra night beyond that.
const equipCost = (n: number) => (n <= 0 ? 0 : n < 6 ? 30 * n : 120 + 20 * (n - 6));
const TRANSFER_PRICE = 180; // flat, per person — matches the site's own add-on pricing, not a live transfer quote
const BAGGAGE_PRICE = 120; // default per-traveler checked-bag fee, matches the Telegram bot's default

type ChatMessage = { role: "user" | "assistant"; text: string };

type Extracted = {
  guests: number | null;
  checkin: string | null;
  checkout: string | null;
  equipment: boolean;
  ski_area: "val_thorens" | "trois_vallees" | null;
};

type FlightLeg = {
  direction: "out" | "return";
  date: string;
  from: string;
  to: string;
  airline: string;
  depart: string;
  arrive: string;
  nonstop: boolean;
};
type FlightData = { legs: FlightLeg[]; total_price_eur: number | null } | null;

const GEMINI_URL = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

async function extractFromConversation(transcript: string): Promise<Extracted> {
  const prompt = `היום התאריך ${new Date().toISOString().slice(0, 10)}. אתה עוזר שמנתח שיחה בעברית עם לקוח שמתכנן חופשת סקי בואל טורנס, צרפת. קרא את כל השיחה (כולל הודעות קודמות) וחלץ ממנה, במצטבר: guests (מספר האורחים, מספר שלם, או null אם לא צוין באף הודעה), checkin (תאריך הגעה בפורמט YYYY-MM-DD, או null), checkout (תאריך עזיבה בפורמט YYYY-MM-DD, או null), no_equipment (true רק אם הלקוח אמר במפורש שהוא לא רוצה ציוד סקי/סנובורד; אחרת false — ברירת המחדל היא לכלול ציוד), ski_area ("val_thorens" אם מוזכר ואל טורנס/מקומי, "trois_vallees" אם מוזכר שלושת העמקים/כל האזור, אחרת null). הפורמט העברי לתאריכים הוא יום.חודש — למשל "17-21.1" זה 17-21 בינואר, לא יוני. אם השנה לא צוינה וכבר עברה השנה הנוכחית, קח את השנה הבאה. החזר אך ורק JSON תקני: {"guests": מספר או null, "checkin": מחרוזת או null, "checkout": מחרוזת או null, "no_equipment": true או false, "ski_area": מחרוזת או null}.

השיחה:
${transcript}`;

  const res = await fetch(GEMINI_URL("gemini-2.5-flash-lite"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(cleaned); } catch { parsed = {}; }

  return {
    guests: typeof parsed.guests === "number" ? parsed.guests : null,
    checkin: typeof parsed.checkin === "string" ? parsed.checkin : null,
    checkout: typeof parsed.checkout === "string" ? parsed.checkout : null,
    equipment: parsed.no_equipment !== true,
    ski_area: parsed.ski_area === "val_thorens" || parsed.ski_area === "trois_vallees" ? (parsed.ski_area as "val_thorens" | "trois_vallees") : null,
  };
}

async function extractFlightFromImage(base64: string, mimeType: string): Promise<FlightData> {
  const prompt = `נתח את צילום המסך הזה של חיפוש טיסות (למשל מ-Skyscanner). זהה עד שתי טיסות (הלוך וחזור אם שתיהן מוצגות). החזר אך ורק אובייקט JSON תקני: {"legs": [{"direction": "out" או "return", "date": "YYYY-MM-DD או ריק", "from": "עיר מוצא", "to": "עיר יעד", "airline": "חברת תעופה", "depart": "HH:MM", "arrive": "HH:MM", "nonstop": true או false}], "total_price_eur": מספר ביורו או null אם לא נראה מחיר}`;
  try {
    const res = await fetch(GEMINI_URL("gemini-2.5-flash-lite"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
      }),
    });
    const json = await res.json();
    const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

const fmt = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ reply: "העוזר החכם עדיין לא מוגדר בשרת — נסו שוב מאוחר יותר." }, { status: 200 });
  }

  const body = await req.json().catch(() => ({}));
  const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
  const image: { base64: string; mimeType: string } | undefined = body.image;

  const transcript = messages.map(m => `${m.role === "user" ? "לקוח" : "עוזר"}: ${m.text}`).join("\n");

  const [extracted, flightData] = await Promise.all([
    extractFromConversation(transcript || "(אין הודעות עדיין)"),
    image ? extractFlightFromImage(image.base64, image.mimeType) : Promise.resolve(null as FlightData),
  ]);

  const { guests, checkin, checkout, equipment, ski_area } = extracted;
  if (!guests || !checkin || !checkout) {
    const missing = [];
    if (!guests) missing.push("כמה אורחים תהיו");
    if (!checkin || !checkout) missing.push("תאריכי הגעה ועזיבה");
    return NextResponse.json({
      complete: false,
      reply: `עוד חסר לי: ${missing.join(", ")}. תוכלו לספר לי?`,
    });
  }

  const nights = Math.round((+new Date(checkout) - +new Date(checkin)) / 86400000);
  if (!(nights > 0)) {
    return NextResponse.json({ complete: false, reply: "תאריך העזיבה צריך להיות אחרי תאריך ההגעה — תוכלו לבדוק שוב?" });
  }
  const skiDays = skiDaysFromNights(nights);
  const db = createServerClient();

  // Cheapest single option that fits: a regular apartment big enough on its
  // own, or a La Cime apartment whose fixed Sat–Sat week covers this exact
  // stay — same matchingWeek() rule as /search and /apartments/[id].
  const [{ data: regularApts }, { data: laCimeApts }, { data: skiPasses }] = await Promise.all([
    db.from("apartments").select("*").eq("available", true).gte("max_guests", guests)
      .or("source.is.null,source.neq.la_cime").order("price_per_night", { ascending: true }).limit(1),
    db.from("apartments").select("*").eq("available", true).eq("source", "la_cime").gte("max_guests", guests),
    db.from("ski_passes").select("*").eq("available", true).eq("type", "adult").eq("area", ski_area || "val_thorens").order("duration_days", { ascending: true }),
  ]);

  type Candidate = { name: string; total: number; isLaCime: boolean };
  const candidates: Candidate[] = [];
  const regular = (regularApts as Apartment[] | null)?.[0];
  if (regular) candidates.push({ name: regular.name, total: regular.price_per_night * nights, isLaCime: false });
  for (const apt of (laCimeApts as Apartment[] | null) ?? []) {
    const week = matchingWeek(apt, checkin, checkout);
    if (week) candidates.push({ name: apt.name, total: week.price, isLaCime: true });
  }
  candidates.sort((a, b) => a.total - b.total);
  const chosen = candidates[0];

  if (!chosen) {
    return NextResponse.json({
      complete: true,
      reply: `בדקתי ל-${guests} אורחים בין ${checkin} ל-${checkout} — לא מצאתי דירה פנויה שמתאימה. אפשר לנסות תאריכים אחרים, או לעבור ל-${req.nextUrl.origin}/search ולחפש ידנית.`,
    });
  }

  const passOptions = (skiPasses as SkiPass[] | null) ?? [];
  const skiTier = passOptions.length ? (passOptions.find(p => p.duration_days >= skiDays) ?? passOptions[passOptions.length - 1]) : null;
  const skiPassUnit = skiTier ? (skiDays > skiTier.duration_days ? Math.round((skiTier.price / skiTier.duration_days) * skiDays) : skiTier.price) : 0;
  const skiPassTotal = skiPassUnit * guests;

  const equipUnit = equipment ? equipCost(skiDays) : 0;
  const equipTotal = equipUnit * (equipment ? guests : 0);

  const transferTotal = TRANSFER_PRICE * guests;

  const flightFound = flightData && typeof flightData.total_price_eur === "number" && flightData.total_price_eur > 0;
  const flightTotal = flightFound ? (flightData!.total_price_eur as number) * guests : 0;
  const baggageTotal = flightData ? BAGGAGE_PRICE * guests : 0;

  const grandTotal = chosen.total + skiPassTotal + equipTotal + transferTotal + flightTotal + baggageTotal;

  const lines = [
    `מצאתי! ${guests} אורחים, ${checkin} עד ${checkout} (${nights} לילות):`,
    `🏠 ${chosen.name}${chosen.isLaCime ? " (שבת עד שבת, שבוע מלא)" : ""} — ${fmt(chosen.total)}`,
  ];
  if (skiTier) lines.push(`⛷️ סקי פס — ${ski_area === "trois_vallees" ? "שלושת העמקים" : "Val Thorens/Orelle"}, ${skiDays} ימי סקי — ${fmt(skiPassTotal)}`);
  if (equipment) lines.push(`🎿 השכרת ציוד, ${skiDays} ימים — ${fmt(equipTotal)}`);
  lines.push(`🚐 הסעה משדה התעופה הלוך-חזור — ${fmt(transferTotal)}`);
  if (flightFound) {
    lines.push(`✈️ טיסות — ${fmt(flightTotal)}`);
    lines.push(`🧳 כבודה נוספת — ${fmt(baggageTotal)}`);
  } else {
    lines.push(`✈️ טיסות — עדיין לא כלולות. שלחו לי צילום מסך של חיפוש טיסות מ-Skyscanner ואוסיף גם אותן.`);
  }
  lines.push(`\nסה"כ עד כה: ${fmt(grandTotal)} (${fmt(grandTotal / guests)} לאדם)`);

  return NextResponse.json({
    complete: true,
    reply: lines.join("\n"),
    breakdown: { guests, checkin, checkout, nights, chosen, skiPassTotal, equipTotal, transferTotal, flightTotal, baggageTotal, grandTotal },
  });
}
