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

type QAResult = { isQuestion: boolean; answer: string | null };

// Mirrors the Telegram bot's own Q&A follow-up: once a quote has been shown
// in the conversation, a customer often asks about it ("what's included in
// the ski pass?") rather than starting a new search. Answer those directly,
// grounded only in numbers/names already visible in the transcript or in
// fixed, known pricing rules — never invent policy details (cancellation,
// deposits, exact check-in times) that aren't in the conversation; hand
// those off to the real contact channel instead.
async function answerFollowUp(transcript: string): Promise<QAResult> {
  const prompt = `אתה עוזר לקוחות ידידותי באתר חופשות סקי בואל טורנס, צרפת (SkiShare). הנה שיחה עם לקוח. בדוק את ההודעה האחרונה של הלקוח בלבד:

- אם היא בקשה לחפש חבילה חדשה, או שינוי תאריכים/כמות אורחים/יעד — זו לא שאלה, החזר is_question:false.
- אם היא שאלת המשך על מה שכבר הוצג בשיחה (למשל: מה כלול, למה המחיר כזה, איזו דירה, כמה לילות, מה זה "ימי סקי", האם יש ציוד) — ענה עליה ישירות ובקצרה, תוך שימוש רק בנתונים שכבר מופיעים בשיחה עצמה. אם צריך, אפשר להיעזר בכללי התמחור הידועים האלה: הסעה משדה התעופה זה מחיר קבוע ל-180 יורו לאדם הלוך-חזור; השכרת ציוד סקי/סנובורד זה 30 יורו ליום עד שבוע ו-120 יורו לשבוע מלא (ועוד 20 ליום נוסף מעבר לשבוע); "ימי סקי" זה תמיד מספר הלילות פחות אחד; דירות "לה סים" מושכרות רק משבת לשבת, שבוע שלם.
- אם היא שאלה כללית שאין עליה מידע בשיחה (מדיניות ביטול, פיקדון, שעות צ'ק אין מדויקות, ודומה) — אל תמציא תשובה. תגיד בחום שכדאי לפנות ישירות לצוות ב-054-7701899 או skishareteam@gmail.com לתשובה מדויקת.
- אם היא שאלה כללית על האזור (ואל טורנס, סקי, טיסות) שאתה יודע עליה תשובה סבירה וכללית — אפשר לענות בקצרה, אבל בלי להתחייב על מספרים מדויקים שלא ניתנו.

החזר אך ורק JSON תקני: {"is_question": true או false, "answer": "התשובה בעברית" או null אם is_question הוא false}.

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
    isQuestion: parsed.is_question === true,
    answer: typeof parsed.answer === "string" ? parsed.answer : null,
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

  // Only worth checking for a follow-up question once the assistant has
  // actually replied at least once for real — the frontend always seeds the
  // conversation with a static welcome message, so a lone "assistant" entry
  // there isn't a quote to ask about, and running this check anyway would
  // add a pointless extra round-trip (and latency) to every very first
  // message a customer sends.
  if (messages.filter(m => m.role === "assistant").length >= 2 && !image) {
    const qa = await answerFollowUp(transcript);
    if (qa.isQuestion && qa.answer) {
      return NextResponse.json({ complete: true, reply: qa.answer });
    }
  }

  const [extracted, flightData] = await Promise.all([
    extractFromConversation(transcript || "(אין הודעות עדיין)"),
    image ? extractFlightFromImage(image.base64, image.mimeType) : Promise.resolve(null as FlightData),
  ]);

  const { guests, checkin, checkout, equipment, ski_area } = extracted;
  if (!guests || !checkin || !checkout) {
    // Nothing at all was extracted — this is a plain "hi"/small talk, not a
    // failed attempt at giving details, so it shouldn't read like the bot is
    // scolding them for missing info. Only use the "almost" framing once
    // they've actually given us something to go on.
    if (!guests && !checkin && !checkout) {
      return NextResponse.json({
        complete: false,
        reply: "היי! 😊 איזה כיף שאתם מתכננים חופשת סקי. ספרו לי כמה אתם ובאילו תאריכים, ואני כבר קופץ לבדוק לכם דירה, סקי פס והסעה.",
      });
    }
    const missing = [];
    if (!guests) missing.push("כמה אורחים תהיו");
    if (!checkin || !checkout) missing.push("תאריכי הגעה ועזיבה");
    return NextResponse.json({
      complete: false,
      reply: `כמעט! עוד רק תספרו לי ${missing.join(" ו")} ואני קופץ לבדוק 🙂`,
    });
  }

  const nights = Math.round((+new Date(checkout) - +new Date(checkin)) / 86400000);
  if (!(nights > 0)) {
    return NextResponse.json({ complete: false, reply: "תאריך העזיבה צריך להיות אחרי תאריך ההגעה — תוכלו לבדוק שוב?" });
  }
  const skiDays = skiDaysFromNights(nights);
  const db = createServerClient();

  // Every available unit that could plausibly house this group, regardless
  // of its own capacity — a single apartment may not fit a large group on
  // its own, but a combination of two or three (see bestCombo below) might.
  // Same matchingWeek() rule as /search and /apartments/[id] for La Cime's
  // fixed Sat–Sat weeks.
  const [{ data: regularApts }, { data: laCimeApts }, { data: skiPasses }] = await Promise.all([
    db.from("apartments").select("*").eq("available", true)
      .or("source.is.null,source.neq.la_cime").order("price_per_night", { ascending: true }),
    db.from("apartments").select("*").eq("available", true).eq("source", "la_cime"),
    db.from("ski_passes").select("*").eq("available", true).eq("type", "adult").eq("area", ski_area || "val_thorens").order("duration_days", { ascending: true }),
  ]);

  type Unit = { name: string; total: number; maxGuests: number; isLaCime: boolean };
  const pool: Unit[] = [];
  for (const apt of (regularApts as Apartment[] | null) ?? []) {
    pool.push({ name: apt.name, total: apt.price_per_night * nights, maxGuests: apt.max_guests ?? 0, isLaCime: false });
  }
  for (const apt of (laCimeApts as Apartment[] | null) ?? []) {
    const week = matchingWeek(apt, checkin, checkout);
    if (week) pool.push({ name: apt.name, total: week.price, maxGuests: apt.max_guests ?? 0, isLaCime: true });
  }

  // Cheapest combination of up to 4 units whose combined capacity fits the
  // group — plain apartments and La Cime weeks pooled together, same idea
  // as /combo and the Telegram bot's multi-apartment matcher.
  function bestCombo(units: Unit[], need: number, maxUnits = 4): Unit[] | null {
    const sorted = [...units].sort((a, b) => a.total - b.total);
    let best: Unit[] | null = null;
    let bestTotal = Infinity;
    function search(start: number, picked: Unit[], guestsSoFar: number, totalSoFar: number) {
      if (guestsSoFar >= need) {
        if (totalSoFar < bestTotal) { bestTotal = totalSoFar; best = [...picked]; }
        return;
      }
      if (picked.length >= maxUnits || totalSoFar >= bestTotal) return;
      for (let i = start; i < sorted.length; i++) {
        picked.push(sorted[i]);
        search(i + 1, picked, guestsSoFar + sorted[i].maxGuests, totalSoFar + sorted[i].total);
        picked.pop();
      }
    }
    search(0, [], 0, 0);
    return best;
  }

  const combo = bestCombo(pool, guests);

  if (!combo) {
    return NextResponse.json({
      complete: true,
      reply: `חיפשתי בכל הדירות שלנו ל-${guests} אורחים בין ${checkin} ל-${checkout} ופשוט אין לנו מספיק מקום בתאריכים האלה 😕 אפשר לנסות תאריכים אחרים (לחצו ↺ למעלה כדי להתחיל שיחה חדשה), או לעבור ל-${req.nextUrl.origin}/search ולחפש ידנית.`,
    });
  }
  const chosen = { total: combo.reduce((s, u) => s + u.total, 0) };

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
    `יש! מצאתי לכם משהו טוב — ${guests} אורחים, ${checkin} עד ${checkout} (${nights} לילות):`,
  ];
  for (const unit of combo) {
    lines.push(`🏠 ${unit.name}${unit.isLaCime ? " (שבת עד שבת, שבוע מלא)" : ""} — ${fmt(unit.total)}`);
  }
  if (combo.length > 1) lines.push(`(${combo.length} דירות ביחד, כדי לתת מקום לכולם)`);
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
    breakdown: { guests, checkin, checkout, nights, units: combo, apartmentsTotal: chosen.total, skiPassTotal, equipTotal, transferTotal, flightTotal, baggageTotal, grandTotal },
  });
}
