import type { Metadata } from "next";
import ProposalDocument, { PROPOSAL_CSS } from "@/components/ProposalDocument";
import { createServerClient } from "@/lib/supabase-server";
import { rulesWithAirbnb } from "@/lib/airbnb-calendar";
import { decodeExtras } from "@/lib/quote-extras";
import { quoteLines } from "@/lib/quote-lines";
import { AIRPORT_CITY, dayLabel, time24, type DirectFlight, type FlightAirport } from "@/lib/flight-format";
import type { Apartment, ProposalBlock, ProposalData, ProposalSection, SkiPass } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "הצעת מחיר — SkiShare", robots: { index: false, follow: false } };

const SITE = "https://skisharebook.com";
const HE_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
const isIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const longDate = (iso: string) => { const d = new Date(iso + "T12:00:00"); return `${d.getDate()} ב${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const dayDate = (iso: string) => `${WEEKDAYS[new Date(iso + "T12:00:00").getDay()]}, ${longDate(iso)}`;
// The PDF browser on the server has no emoji font: emoji would print as empty boxes.
const plain = (t: string) => t.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, "").replace(/[ \t]+/g, " ").trim();
/** the description as a short paragraph + up to 8 points, without emoji */
function describe(desc: string): ProposalBlock[] {
  const lines = desc.split("\n").map(plain).filter(l => l.length > 1);
  if (!lines.length) return [];
  const [first, ...rest] = lines;
  return [{ type: "text", text: first }, ...(rest.length ? [{ type: "list", items: rest.slice(0, 8) } as ProposalBlock] : [])];
}

type SP = Record<string, string | string[] | undefined>;

/*
 * The printable quote, priced on the server from live data (the same
 * quoteLines() the quote page uses), in the branded proposal design.
 * /api/quote-pdf renders this page to a PDF file. Only the choices come in
 * the address, never prices, so it can't print a made-up offer.
 */
export default async function QuotePrintPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const apartmentId = one("apartment_id");
  const checkin = one("checkin"), checkout = one("checkout");
  const guests = Math.min(Math.max(parseInt(one("guests")) || 2, 1), 40);
  const cancel = ["regular", "flexible", "none"].includes(one("cancel")) ? one("cancel") : "regular";
  const service = one("service") === "ai" ? "ai" : "human";
  const extras = decodeExtras(one("x")) ?? {};
  const quoteId = /^[a-z0-9]{4,12}$/i.test(one("q")) ? one("q") : "";
  const retDepart = one("rd").slice(0, 16) || null, retArrive = one("ra").slice(0, 16) || null;

  const bad = <div dir="rtl" style={{ padding: 40, textAlign: "center", fontFamily: "Arial" }}>לא מצאנו את ההצעה.</div>;
  if (!/^[0-9a-f-]{36}$/i.test(apartmentId) || !isIso(checkin) || !isIso(checkout) || checkout <= checkin) return bad;

  const db = createServerClient();
  const [{ data: apt }, rulesMap, { data: passes }, { data: flights }] = await Promise.all([
    db.from("apartments").select("*").eq("id", apartmentId).maybeSingle(),
    rulesWithAirbnb(db, [apartmentId]),
    db.from("ski_passes").select("*").eq("available", true),
    db.from("flight_price_cache").select("*").eq("origin", "TLV").in("dest", ["GVA", "LYS"]).eq("checkin", checkin).eq("checkout", checkout),
  ]);
  if (!apt) return bad;
  const a = apt as Apartment;

  // the cheapest direct flight the site found for these dates (the cache /api/flight-price fills)
  const direct: DirectFlight | null = ((flights ?? []) as { dest: FlightAirport; price_eur: number | null; nonstop: boolean; airline?: string | null; url?: string | null; depart_time?: string | null; arrive_time?: string | null }[])
    .filter(f => f.nonstop && typeof f.price_eur === "number")
    .map(f => ({ airport: f.dest, city: AIRPORT_CITY[f.dest], price: Number(f.price_eur), airline: f.airline ?? null, url: f.url ?? null, departTime: f.depart_time ?? null, arriveTime: f.arrive_time ?? null }))
    .sort((x, y) => x.price - y.price)[0] ?? null;

  const calc = quoteLines({
    apt: a, rules: rulesMap?.get(apartmentId) ?? [], passes: (passes ?? []) as SkiPass[],
    checkin, checkout, guests, extras, cancel, service, flight: direct,
  });
  const flightLine = calc.lines.find(l => l.key === "flight");

  const nameSlug = a.name.trim().replace(/\s+/g, "-").replace(/[/?#&]/g, "");
  const code = Object.keys(extras).length ? new URLSearchParams({ x: one("x") }).toString() : "";
  const payUrl = quoteId
    ? `${SITE}/q/${encodeURIComponent(nameSlug)}/${quoteId}${code ? `?${code}` : ""}`
    : `${SITE}/apartments/${a.id}?checkin=${checkin}&checkout=${checkout}&guests=${guests}`;
  const today = new Date();
  const issued = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;

  const sections: ProposalSection[] = [];
  sections.push({
    heading: "הדירה",
    blocks: [
      { type: "kv", rows: [
        ["דירה", a.name],
        ["מקום", "ואל טורנס, צרפת"],
        ["כניסה", dayDate(checkin)],
        ["יציאה", dayDate(checkout)],
        ["לילות", calc.weekly ? "7 (שבת עד שבת)" : String(calc.nights)],
        ["אנשים", String(guests)],
        ...(a.sqm ? [["גודל", `${a.sqm} מ"ר`] as [string, string]] : []),
        ...(a.max_guests ? [["מתאימה", `עד ${a.max_guests} אנשים`] as [string, string]] : []),
      ] },
      ...(a.images?.length ? [{ type: "gallery", urls: a.images.slice(0, 3) } as ProposalBlock] : []),
      ...(a.description ? describe(a.description) : []),
    ],
  });

  sections.push({
    heading: "המחיר",
    blocks: [
      { type: "table", header: ["מה", "פירוט", "מחיר"],
        rows: calc.lines.map(l => [l.label, l.sub ?? "", l.amount < 0 ? `−${eur(-l.amount)}` : eur(l.amount)]),
        total: ["סה\"כ לכל החבורה", "", eur(calc.total)] },
      { type: "summary", rows: [
        ["מחיר לאדם", `${eur(calc.perPerson)} (${guests} ${guests === 1 ? "אדם" : "אנשים"})`],
        ["בתשלום בכרטיס", "נוספת עמלת סליקה של 1.9%"],
      ] },
      { type: "note", text: `המחירים נכונים ל-${issued}. מחיר הדירה לפי לוח המחירים לתאריכים האלה${flightLine ? ", ומחיר הטיסה כמו ב-Google Flights באותו יום, והוא יכול להשתנות עד שסוגרים את הטיסה" : ""}.` },
    ],
  });

  if (flightLine && direct) {
    const d = time24(direct.departTime), ar = time24(direct.arriveTime);
    const rd = time24(retDepart), ra = time24(retArrive);
    sections.push({
      heading: "הטיסה",
      blocks: [
        { type: "banner", text: `טיסה ישירה הלוך וחזור, תל אביב – ${direct.city}` },
        { type: "kv", rows: [
          ...(direct.airline ? [["חברת תעופה", direct.airline] as [string, string]] : []),
          ["הלוך", `${dayLabel(checkin)}${d && ar ? `, המראה ${d}, נחיתה ${ar}` : ""}`],
          ["חזור", `${dayLabel(checkout)}${rd && ra ? `, המראה ${rd}, נחיתה ${ra}` : ""}`],
          ["מחיר", `${eur(direct.price)} לאדם, הלוך וחזור`],
        ] },
        ...((d || rd) ? [{ type: "note", text: "השעות לפי השעון המקומי בכל שדה." } as ProposalBlock] : []),
      ],
    });
  }

  sections.push({
    heading: "תשלום",
    blocks: [
      { type: "text", text: "אפשר לשלם באתר בכרטיס אשראי, עד 3 תשלומים בלי ריבית, וכל אחד מהחבורה יכול לשלם את החלק שלו. בהעברה בנקאית אין עמלה (דברו איתנו)." },
      { type: "payment", label: "להזמנה ולתשלום באתר", url: payUrl },
    ],
  });

  const data: ProposalData = {
    title: a.name,
    subtitle: `ואל טורנס · ${calc.weekly ? "שבוע שלם" : `${calc.nights} לילות`} · ${guests} ${guests === 1 ? "אדם" : "אנשים"}${quoteId ? ` · הצעה ${quoteId}` : ""}`,
    intro: `הצעת מחיר אישית לחופשה בואל טורנס, ${longDate(checkin)} עד ${longDate(checkout)}. כל המחירים באירו, לפי מה שבחרתם באתר.`,
    sections,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROPOSAL_CSS }} />
      <div className="proposal-screen">
        <ProposalDocument data={data} />
      </div>
    </>
  );
}
