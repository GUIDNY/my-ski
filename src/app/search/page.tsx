"use client";
import { aptDisplayName, aptShortName, aptKind, aptParts, aptSqm, forWho } from "@/lib/apartment-display";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { Apartment, SkiPass } from "@/types";
import SkiCalendar from "@/components/SkiCalendar";
import OpenChatButton from "@/components/OpenChatButton";
import { wrap, card, btn, badgeLight, badgeDark, Check, EmptyState, Skeleton } from "@/components/ui";
import { getEffectivePrice, calcTotalForRange, matchingWeek } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import { packageExtras, PASS_AREA_LABEL } from "@/lib/deal-pricing";
import { useDirectFlight, type DirectFlightState } from "@/lib/useFlightPrice";
import { cardImage } from "@/lib/thumbs";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const WEEKDAYS = ["יום א׳","יום ב׳","יום ג׳","יום ד׳","יום ה׳","יום ו׳","שבת"];
const day = (s: string) => new Date(s + "T12:00:00");
/** "16–23 בינואר" / "28 בפברואר – 7 במרץ" */
const rangeLabel = (ci: string, co: string) => {
  const a = day(ci), b = day(co);
  return a.getMonth() === b.getMonth()
    ? `\u2066${a.getDate()}\u2060–\u2060${b.getDate()}\u2069 ב${HE_MONTHS[b.getMonth()]}` // "16–23" on one line, left to right
    : `${a.getDate()} ב${HE_MONTHS[a.getMonth()]} – ${b.getDate()} ב${HE_MONTHS[b.getMonth()]}`;
};
/** "שבת 16.1" */
const dayLabel = (s: string) => { const d = day(s); return `${WEEKDAYS[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}`; };
/** the date n days after an ISO date, as an ISO date */
const addDaysIso = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const eur = (n: number) => `€${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const capacity = (apt: Apartment) => apt.max_guests || apt.beds * 2 || 2;
const isAgency = (apt: Apartment) => apt.source === "la_cime";
/** under the name: size and bathrooms; agency apartments also their code (the name says the type and people) */
const metaLine = (apt: Apartment) => [
  !isAgency(apt) ? `${aptKind(apt)}${forWho(apt.max_guests) ? ` ${forWho(apt.max_guests)}` : ""}` : "",
  aptSqm(apt) ? `${aptSqm(apt)} מ"ר` : "",
  apt.baths ? (apt.baths === 1 ? "חדר רחצה" : `${apt.baths} חדרי רחצה`) : "",
  aptParts(apt).code ? `קוד ${aptParts(apt).code}` : "",
].filter(Boolean).join(" · ");

type Kind = "all" | "own" | "agency";
type Sort = "recommended" | "price";
type RulesMap = Record<string, PricingRule[]>;

type Extras = ReturnType<typeof packageExtras>;

/* What a full deal adds per person on top of the apartment, as a list: the
   pass that fits the dates and the transfer (real prices, in the price), and
   a direct flight only when one really exists (live price, not in the price). */
function dealItems(extras: Extras | null, flight: DirectFlightState, flightIn = false): { text: string; muted?: boolean; plane?: boolean }[] {
  const items: { text: string; muted?: boolean; plane?: boolean }[] = [];
  if (extras?.area && extras.tier) items.push({ text: `סקי פס ${PASS_AREA_LABEL[extras.area]}, ${extras.tier.duration_days} ימים` });
  else if (!extras) items.push({ text: "סקי פס לפי התאריכים" });
  items.push({ text: "הסעה הלוך וחזור מהשדה" });
  if (flightIn && flight.status === "found" && flight.flight)
    items.push({ text: `טיסה ישירה הלוך וחזור ל${flight.flight.city}, ${eur(flight.flight.price)} לאדם`, plane: true });
  else if (flight.status === "found" && flight.flight)
    items.push({ text: `טיסה ישירה הלוך וחזור ל${flight.flight.city}: עוד ${eur(flight.flight.price)} לאדם, אם בוחרים "עם טיסה ישירה"`, plane: true });
  else if (flight.status === "loading") items.push({ text: "בודקים טיסה ישירה…", muted: true, plane: true });
  return items;
}
const IcoPlane = () => ico(<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />, 15);

/* ── Icons (stroke, follow the text color) ─────────────────── */
const ico = (path: ReactNode, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const IcoCal = ({ size = 18 }: { size?: number }) => ico(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>, size);
const IcoUsers = () => ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></>);
const IcoChat = () => ico(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />, 16);
const IcoArrow = () => ico(<path d="M19 12H5M11 6l-6 6 6 6" />, 18);
const IcoPin = () => ico(<><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>, 16);

/* ── Full deal: with or without the flight ───────────────────
   One switch at the top of the results. "With flight" adds the cheapest
   direct round trip (live Google Flights price) to every card's price per
   person and pre-ticks it on the apartment page (?flight=1). The airline
   operates the flight, SkiShare only books it (terms, section 5). */
function FlightToggle({ on, setOn, flight, hasDates }: { on: boolean; setOn: (v: boolean) => void; flight: DirectFlightState; hasDates: boolean }) {
  const f = flight.status === "found" ? flight.flight : null;
  const opt = (v: boolean, label: ReactNode) => (
    <button type="button" aria-pressed={on === v} onClick={() => setOn(v)}
      className={`flex-1 min-h-[42px] px-3 rounded-[11px] text-[15px] font-bold whitespace-nowrap inline-flex items-center justify-center gap-2 transition-colors ${on === v ? "bg-ink text-white shadow-sm" : "text-ink hover:bg-white"}`}>
      {label}
    </button>
  );
  const line = !on ? "המחיר לאדם: דירה, סקי פס והסעה. את הטיסה מזמינים לבד."
    : !hasDates ? "בחרו תאריכים ונחפש טיסה ישירה."
    : flight.status === "loading" ? "מחפשים טיסה ישירה לתאריכים שלכם…"
    : f ? `נוספה לכל אחד טיסה ישירה הלוך וחזור, תל אביב ⇄ ${f.city}${f.airline ? `, ${f.airline}` : ""}: ${eur(f.price)} לאדם.`
    : flight.status === "none" ? "אין טיסה ישירה בתאריכים האלה, אז המחיר בלי טיסה."
    : "לא הצלחנו לבדוק טיסות כרגע, אז המחיר בלי טיסה.";
  return (
    <div className="rounded-[18px] border border-line bg-white p-3 md:p-3.5 flex flex-col gap-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
        <div className="flex gap-1 p-1 rounded-[14px] bg-soft border border-line sm:w-[340px] shrink-0" role="group" aria-label="טיסה">
          {opt(false, "בלי טיסה")}
          {opt(true, <><IcoPlane />עם טיסה ישירה</>)}
        </div>
        <p className="flex-1 text-[14px] md:text-[15px] leading-snug text-body" aria-live="polite">{line}</p>
      </div>
      {on && (
        <details className="group px-1">
          <summary className="cursor-pointer list-none text-[14px] font-bold text-accent hover:text-accent-hover w-fit">איך זה עובד? <span className="inline-block transition-transform group-open:rotate-180" aria-hidden="true">▾</span></summary>
          <ul className="mt-2 flex flex-col gap-1.5 text-[14px] leading-relaxed text-body">
            <li className="flex items-start gap-2"><span className="mt-1 shrink-0"><Check size={14} /></span>רק טיסה ישירה, בלי עצירות, לז&apos;נבה או לליון. הזולה ביותר לתאריכים שלכם.</li>
            <li className="flex items-start gap-2"><span className="mt-1 shrink-0"><Check size={14} /></span>המחיר הוא המחיר החי ב-Google Flights, והוא יכול להשתנות עד שסוגרים את הכרטיסים.</li>
            <li className="flex items-start gap-2"><span className="mt-1 shrink-0"><Check size={14} /></span>את הטיסה מפעילה חברת התעופה ואנחנו מתווכים: בעיכוב, ביטול או כבודה עוזרים לכם מולה. <Link href="/terms" className="font-bold text-accent">התקנון</Link></li>
            <li className="flex items-start gap-2"><span className="mt-1 shrink-0"><Check size={14} /></span>בעמוד הדירה הטיסה כבר מסומנת, ונכנסת לאותו תשלום. אפשר להוריד אותה שם.</li>
          </ul>
        </details>
      )}
    </div>
  );
}

/* ── Guests stepper ───────────────────────────────────────── */
function Stepper({ value, onChange, min = 1, max = 12 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  const b = "w-10 h-10 rounded-full border border-line-strong flex items-center justify-center text-ink text-[18px] leading-none hover:border-ink transition-colors disabled:opacity-40 disabled:hover:border-line-strong";
  return (
    <div className="flex items-center gap-2" role="group" aria-label="כמה אתם">
      <button type="button" className={b} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="פחות אנשים">−</button>
      <span className="w-6 text-center font-bold text-[17px] text-ink" aria-live="polite">{value}</span>
      <button type="button" className={b} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="עוד אנשים">+</button>
    </div>
  );
}

/* ── Deal type: full deal / apartment only ────────────────── */
function DealToggle({ value, onChange }: { value: "full" | ""; onChange: (v: "full" | "") => void }) {
  const opt = (v: "full" | "", label: string) => (
    <button type="button" aria-pressed={value === v} onClick={() => onChange(v)}
      className={`flex-1 min-h-[40px] px-3 rounded-[10px] text-[15px] font-bold transition-colors ${value === v ? "bg-ink text-white" : "text-ink hover:bg-soft"}`}>
      {label}
    </button>
  );
  return (
    <div className="flex gap-1 p-1 rounded-xl border border-line-strong bg-white" role="group" aria-label="מה בא לכם?">
      {opt("full", "דיל שלם")}
      {opt("", "רק דירה")}
    </div>
  );
}

/* ── Result card ──────────────────────────────────────────── */
function AptCard({ apt, nights, checkin, checkout, guests, deal, rules, badge, extras, flight, withFlight = false }: {
  apt: Apartment; nights: number; checkin: string; checkout: string; guests: number; deal?: string;
  rules: PricingRule[]; badge?: string;
  /** full deal: what it adds per person for these dates (null before the dates or the pass prices are known) */
  extras: Extras | null; flight: DirectFlightState;
  /** full deal with the direct flight in the price (when one was found) */
  withFlight?: boolean;
}) {
  const week = matchingWeek(apt, checkin, checkout);
  const total = week
    ? week.price
    : checkin && checkout && nights > 0
      ? calcTotalForRange(checkin, checkout, apt.price_per_night, rules)
      : apt.price_per_night * nights;

  // Minimum single-night price in the selected period
  const minNightly = (() => {
    if (!checkin || !checkout || nights === 0) return apt.price_per_night;
    const end = new Date(checkout + "T12:00:00");
    let min = Infinity;
    for (let d = new Date(checkin + "T12:00:00"); d < end; d.setDate(d.getDate() + 1))
      min = Math.min(min, getEffectivePrice(new Date(d), apt.price_per_night, rules));
    return min === Infinity ? apt.price_per_night : min;
  })();
  const fl = deal === "full" && withFlight && flight.status === "found" && flight.flight ? flight.flight : null;
  const query = new URLSearchParams({ checkin, checkout, guests: String(guests), ...(deal ? { deal } : {}), ...(fl ? { flight: "1" } : {}) }).toString();
  const hasDates = !!(checkin && checkout && nights > 0);
  const full = deal === "full";
  const included = full ? dealItems(hasDates ? extras : null, flight, !!fl) : (apt.amenities ?? []).slice(0, 3).map(text => ({ text } as { text: string; muted?: boolean; plane?: boolean }));
  // the package for one person: their share of the apartment + the pass + the transfer
  const dealReady = full && (hasDates || !!week) && !!extras;
  const flightPP = fl ? fl.price : 0;
  const pkgPerPerson = dealReady ? Math.round(total / guests + extras!.perPerson + flightPP) : 0;
  const pkgTotal = dealReady ? Math.round(total + (extras!.perPerson + flightPP) * guests) : 0;

  return (
    <Link href={`/apartments/${apt.id}?${query}`}
      className={`${card} group overflow-hidden flex flex-col sm:flex-row hover:border-line-strong transition-colors`}>
      {/* photo */}
      <div className="relative sm:w-[300px] lg:w-[320px] shrink-0 h-[210px] sm:h-auto sm:min-h-[230px] bg-soft-2 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...cardImage(apt.images?.[0], "/hero-ski.jpg")} alt={aptDisplayName(apt)} loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <span className={`absolute top-3.5 right-3.5 ${badgeLight}`}>{isAgency(apt) ? "שבת עד שבת" : "דירה שלנו"}</span>
        {badge && <span className={`absolute bottom-3.5 right-3.5 ${badgeDark}`}>{badge}</span>}
      </div>

      {/* details + price */}
      <div className="flex-1 min-w-0 p-5 md:p-6 flex flex-col md:flex-row gap-5 justify-between">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <h2 className="font-display font-bold text-[21px] md:text-[23px] leading-snug text-ink">{aptShortName(apt)}</h2>
          <div className="text-[15px] text-muted">{metaLine(apt) || "ואל טורנס"}</div>
          {hasDates && (
            <div className="flex items-center gap-2 text-[15px] text-body">
              <span className="text-muted"><IcoCal size={16} /></span>
              {week ? <>{dayLabel(week.week)} עד {dayLabel(addDaysIso(week.week, 7))} · שבוע מלא</>
                : <>{dayLabel(checkin)} עד {dayLabel(checkout)} · {nights} לילות</>}
            </div>
          )}
          {included.length > 0 && (
            <ul className="mt-1 flex flex-col gap-1.5 text-[15px] text-ink">
              {full && <li className="flex items-center gap-2"><Check />{week ? "דירה לשבוע, שבת עד שבת" : hasDates ? `דירה ל-${nights} לילות` : "דירה"}</li>}
              {included.map(f => (
                <li key={f.text} className={`flex items-start gap-2 ${f.muted ? "text-muted" : f.plane ? "text-body" : ""}`}>
                  {f.plane ? <span className="mt-0.5 shrink-0 text-accent"><IcoPlane /></span> : <span className="mt-0.5 shrink-0"><Check /></span>}
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="md:w-[210px] shrink-0 flex flex-col gap-3 border-t md:border-t-0 border-line pt-4 md:pt-0 md:items-end md:text-left md:justify-between">
          <div className="flex flex-col gap-0.5 md:items-end">
            {dealReady ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-extrabold text-[28px] md:text-[30px] leading-none text-ink">{eur(pkgPerPerson)}</span>
                  <span className="text-[15px] text-muted">לאדם</span>
                </div>
                <span className="text-[14px] text-muted">{eur(pkgTotal)} לכל החבורה, {guests} {guests === 1 ? "אדם" : "אנשים"}</span>
                <span className="text-[13px] text-muted">{fl ? "דירה, סקי פס, הסעה וטיסה" : "דירה, סקי פס והסעה"}</span>
              </>
            ) : week ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-extrabold text-[28px] md:text-[30px] leading-none text-ink">{eur(week.price)}</span>
                  <span className="text-[15px] text-muted">לשבוע</span>
                </div>
                {guests > 1 && <span className="text-[14px] text-muted">{eur(Math.round(week.price / guests))} לאדם, {guests} אנשים</span>}
              </>
            ) : hasDates ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-extrabold text-[28px] md:text-[30px] leading-none text-ink">{eur(total)}</span>
                  <span className="text-[15px] text-muted">ל-{nights} לילות</span>
                </div>
                <span className="text-[14px] text-muted">
                  {guests > 1 ? <>{eur(Math.round(total / guests))} לאדם · </> : null}מ-{eur(minNightly)} ללילה
                </span>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-extrabold text-[28px] md:text-[30px] leading-none text-ink">{eur(minNightly)}</span>
                  <span className="text-[15px] text-muted">ללילה</span>
                </div>
                <span className="text-[14px] text-muted">{full ? "בחרו תאריכים למחיר החבילה לאדם" : "בחרו תאריכים למחיר מדויק"}</span>
              </>
            )}
          </div>
          <span className={`${btn.primary} w-full`}>
            {full ? "לחבילה" : "לדירה"} <IcoArrow />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Combo card (two apartments together) ─────────────────── */
function ComboCard({ a, b, total, cap, checkin, checkout, guests, nights }: {
  a: Apartment; b: Apartment; total: number; cap: number;
  checkin: string; checkout: string; guests: number; nights: number;
}) {
  const query = new URLSearchParams({ a: a.id, b: b.id, checkin, checkout, guests: String(guests) }).toString();
  return (
    <Link href={`/combo?${query}`} className={`${card} group overflow-hidden flex flex-col sm:flex-row hover:border-line-strong transition-colors`}>
      <div className="relative sm:w-[300px] lg:w-[320px] shrink-0 h-[190px] sm:h-auto sm:min-h-[210px] flex bg-soft-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...cardImage(a.images?.[0], "/hero-ski.jpg")} alt={aptDisplayName(a)} loading="lazy" className="w-1/2 h-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...cardImage(b.images?.[0], "/hero-ski.jpg")} alt={aptDisplayName(b)} loading="lazy" className="w-1/2 h-full object-cover border-r-2 border-white" />
        <span className={`absolute top-3.5 right-3.5 ${badgeDark}`}>שתי דירות יחד</span>
      </div>
      <div className="flex-1 min-w-0 p-5 md:p-6 flex flex-col md:flex-row gap-5 justify-between">
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <h2 className="font-display font-bold text-[21px] md:text-[23px] leading-snug text-ink">{aptShortName(a)} + {aptShortName(b)}</h2>
          <div className="text-[15px] text-muted">עד {cap} אנשים בשתי הדירות</div>
          {nights > 0 && (
            <div className="flex items-center gap-2 text-[15px] text-body">
              <span className="text-muted"><IcoCal size={16} /></span>
              {dayLabel(checkin)} עד {dayLabel(checkout)} · {nights} לילות
            </div>
          )}
          <ul className="mt-1 flex flex-col gap-1.5 text-[15px] text-ink">
            <li className="flex items-center gap-2"><Check />הזמנה אחת לשתי הדירות</li>
            <li className="flex items-center gap-2"><Check />כל החבורה באותו מקום</li>
          </ul>
        </div>
        <div className="md:w-[210px] shrink-0 flex flex-col gap-3 border-t md:border-t-0 border-line pt-4 md:pt-0 md:items-end md:justify-between">
          <div className="flex flex-col gap-0.5 md:items-end">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-extrabold text-[28px] md:text-[30px] leading-none text-ink">{eur(total)}</span>
              <span className="text-[15px] text-muted">לשתיהן</span>
            </div>
            {guests > 1 && <span className="text-[14px] text-muted">≈ {eur(Math.round(total / guests))} לאדם</span>}
          </div>
          <span className={`${btn.primary} w-full`}>להמשך הזמנה <IcoArrow /></span>
        </div>
      </div>
    </Link>
  );
}

/* ── "Can't find?" box ────────────────────────────────────── */
function HelpBox() {
  return (
    <div className="bg-soft rounded-2xl p-4 flex flex-col gap-2">
      <span className="font-bold text-[15px] text-ink">לא מוצאים?</span>
      <span className="text-[14px] leading-relaxed text-muted">תכתבו לעוזר שלנו מה אתם מחפשים, והוא יבנה לכם הצעה.</span>
      <OpenChatButton className={`${btn.link} text-[15px] w-fit`}>
        <IcoChat />לפתוח צ&apos;אט
      </OpenChatButton>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
function SearchPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const checkin  = params.get("checkin")  ?? "";
  const checkout = params.get("checkout") ?? "";
  const guests   = parseInt(params.get("guests") ?? "2") || 2;
  const deal     = params.get("deal") ?? "";

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [rulesMap,   setRulesMap]   = useState<RulesMap>({});
  const [loading,    setLoading]    = useState(true);
  const [kind,       setKind]       = useState<Kind>("all");
  const [sort,       setSort]       = useState<Sort>("recommended");
  const [dateOpen,   setDateOpen]   = useState(!checkin || !checkout);
  const [editOpen,   setEditOpen]   = useState(!checkin || !checkout); // phone: the search form is folded under a summary
  const [gDraft,     setGDraft]     = useState(guests);
  const [dealDraft,  setDealDraft]  = useState<"full" | "">(deal === "full" ? "full" : "");
  const [blockedFor, setBlockedFor] = useState<{ key: string; ids: string[] }>({ key: "", ids: [] });
  const [passes,     setPasses]     = useState<SkiPass[] | null>(null);
  const [withFlight, setWithFlight] = useState(params.get("flight") === "1");
  const barRef       = useRef<HTMLDivElement>(null);

  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : 0;

  /* Load apartments, then fetch pricing rules for all in parallel */
  useEffect(() => {
    fetch("/api/apartments").then(r => r.json()).then((apts: Apartment[]) => {
      const list = Array.isArray(apts) ? apts : [];
      setApartments(list);
      setLoading(false);
      if (!list.length) return;
      Promise.all(
        list.map(apt =>
          fetch(`/api/pricing-rules?apartment_id=${apt.id}`)
            .then(r => r.json())
            .then(rules => ({ id: apt.id, rules: Array.isArray(rules) ? rules : [] }))
        )
      ).then(results => {
        const map: RulesMap = {};
        results.forEach(({ id, rules }) => { map[id] = rules; });
        setRulesMap(map);
      });
    });
  }, []);

  /* Full deal: the real ski-pass prices, and a direct flight only if there is one */
  const full = deal === "full";
  useEffect(() => {
    if (!full) return;
    fetch("/api/ski-passes").then(r => r.json()).then(d => setPasses(Array.isArray(d) ? d : [])).catch(() => setPasses([]));
  }, [full]);
  const extras = full && passes && checkin && checkout && nights > 0 ? packageExtras(passes, checkin, checkout, nights) : null;
  const flight = useDirectFlight(full ? checkin : "", full ? checkout : "");

  /* Which apartments are booked/unavailable for the selected dates */
  const rangeKey = checkin && checkout ? `${checkin}|${checkout}` : "";
  useEffect(() => {
    if (!rangeKey) return;
    let cancelled = false;
    fetch(`/api/availability/blocked?checkin=${checkin}&checkout=${checkout}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setBlockedFor({ key: rangeKey, ids: Array.isArray(d.blocked) ? d.blocked : [] }); })
      .catch(() => { if (!cancelled) setBlockedFor({ key: rangeKey, ids: [] }); });
    return () => { cancelled = true; };
  }, [rangeKey, checkin, checkout]);
  const blocked = rangeKey && blockedFor.key === rangeKey ? blockedFor.ids : [];

  /* Close the calendar on a click outside the search bar */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setDateOpen(false);
    };
    if (dateOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [dateOpen]);

  // La Cime ("שבת עד שבת") apartments only make sense once the searched dates
  // actually fit inside one of their synced weeks — otherwise they'd show up
  // with a made-up nightly price for a product that isn't really sold that way.
  const available = apartments.filter(a =>
    !blocked.includes(a.id) && (a.source !== "la_cime" || matchingWeek(a, checkin, checkout))
  );
  const fits = available.filter(a => capacity(a) >= guests);          // single apt holds the group
  const counts = { all: fits.length, own: fits.filter(a => !isAgency(a)).length, agency: fits.filter(isAgency).length };
  const filtered = kind === "all" ? fits : fits.filter(a => (kind === "agency") === isAgency(a));

  const priceFor = (a: Apartment) => {
    const week = matchingWeek(a, checkin, checkout);
    if (week) return week.price;
    return checkin && checkout && nights > 0
      ? calcTotalForRange(checkin, checkout, Number(a.price_per_night), rulesMap[a.id] ?? [])
      : Number(a.price_per_night) * Math.max(nights, 1);
  };
  const shown = sort === "price" ? [...filtered].sort((x, y) => priceFor(x) - priceFor(y)) : filtered;
  const cheapestId = shown.length > 1 && checkin && checkout
    ? shown.reduce((best, a) => (priceFor(a) < priceFor(best) ? a : best), shown[0]).id : "";

  // No single apartment is big enough → suggest combinations of two
  const maxSingleCap = available.length ? Math.max(...available.map(capacity)) : 0;
  const combos = (fits.length === 0 && guests > maxSingleCap)
    ? available.flatMap((a, i) => available.slice(i + 1)
        .filter(b => capacity(a) + capacity(b) >= guests)
        .map(b => ({ a, b, total: priceFor(a) + priceFor(b), cap: capacity(a) + capacity(b) })))
        .sort((x, y) => x.total - y.total)
    : [];

  /* "From €X a night": the lowest average night among our own apartments
     that are free for these dates and big enough for the group (agency
     apartments are priced by the week, so they're not in this figure) */
  const nightlyApts = fits.filter(a => a.source !== "la_cime");
  const minPrice = nightlyApts.length
    ? Math.min(...nightlyApts.map(a => {
        if (!checkin || !checkout || nights === 0) return Number(a.price_per_night);
        return Math.round(priceFor(a) / nights);
      }))
    : null;

  const searchUrl = (ci: string, co: string, g: number, d: string) => {
    const q = new URLSearchParams();
    if (ci) q.set("checkin", ci);
    if (co) q.set("checkout", co);
    q.set("guests", String(g));
    if (d === "full") q.set("deal", "full");
    return `/search?${q.toString()}`;
  };

  const applyDates = (ci: string, co: string) => {
    router.replace(searchUrl(ci, co, gDraft, dealDraft));
    setDateOpen(false);
    setEditOpen(false);
  };

  // apply the current draft (guests, deal type + existing dates)
  const applySearch = () => {
    router.replace(searchUrl(checkin, checkout, gDraft, dealDraft));
    setDateOpen(false);
    if (checkin && checkout) setEditOpen(false);
  };

  const hasDates = !!(checkin && checkout);
  const title = hasDates
    ? `ואל טורנס · ${rangeLabel(checkin, checkout)} · ${guests} ${guests === 1 ? "אדם" : "אנשים"}`
    : "דירות בואל טורנס";
  const summary = hasDates
    ? `${rangeLabel(checkin, checkout)} · ${guests} ${guests === 1 ? "אדם" : "אנשים"}${deal === "full" ? " · דיל שלם" : ""}`
    : "בחרו תאריכים";

  const kinds: { key: Kind; label: string }[] = [
    { key: "all", label: "הכל" },
    { key: "own", label: "הדירות שלנו" },
    { key: "agency", label: "שבת עד שבת" },
  ];

  return (
    <div className="flex-1 bg-soft" dir="rtl">

      {/* ── Search bar ─────────────────────────────────────── */}
      <div ref={barRef} className="relative z-30 bg-white border-b border-line">
        <div className={`${wrap} py-3 md:py-4`}>
          {/* phone: a summary that opens the form */}
          <button type="button" onClick={() => setEditOpen(o => !o)} aria-expanded={editOpen}
            className="md:hidden w-full flex items-center justify-between gap-3 min-h-[52px] px-4 rounded-2xl border border-line-strong bg-white text-right">
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="text-accent shrink-0"><IcoCal /></span>
              <span className="text-[16px] font-bold text-ink truncate">{summary}</span>
            </span>
            <span className="text-[15px] font-bold text-accent shrink-0">{editOpen ? "סגירה" : "שינוי"}</span>
          </button>

          <form role="search" aria-label="שינוי החיפוש" onSubmit={e => { e.preventDefault(); applySearch(); }}
            className={`${editOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row md:flex-wrap md:items-stretch gap-2 mt-3 md:mt-0`}>
            <button type="button" onClick={() => setDateOpen(o => !o)} aria-expanded={dateOpen}
              className={`md:flex-[1_1_240px] flex items-center gap-2.5 min-h-[52px] md:min-h-[48px] px-4 rounded-xl border text-right transition-colors ${dateOpen ? "border-accent bg-accent-soft" : "border-line-strong bg-white hover:border-ink"}`}>
              <span className="text-accent shrink-0"><IcoCal /></span>
              <span className="flex flex-col leading-tight min-w-0">
                <span className="text-[12px] font-bold text-muted">מתי?</span>
                <span className={`text-[15px] truncate ${hasDates ? "text-ink font-medium" : "text-accent font-bold"}`}>
                  {hasDates ? `${rangeLabel(checkin, checkout)} · ${nights} לילות` : "בחרו תאריכים"}
                </span>
              </span>
            </button>
            <div className="md:flex-[0_0_auto] flex items-center justify-between gap-4 min-h-[52px] md:min-h-[48px] px-4 rounded-xl border border-line-strong bg-white">
              <span className="flex items-center gap-2.5">
                <span className="text-accent"><IcoUsers /></span>
                <span className="text-[15px] font-bold text-ink whitespace-nowrap">כמה אתם?</span>
              </span>
              <Stepper value={gDraft} onChange={setGDraft} />
            </div>
            <div className="md:flex-[0_1_230px]">
              <DealToggle value={dealDraft} onChange={setDealDraft} />
            </div>
            <button type="submit" className={`${btn.primary} md:px-7`}>עדכון</button>
          </form>
        </div>

        {/* ── Calendar ───────────────────────────────────────── */}
        {dateOpen && (
          <div className="md:absolute md:top-full md:inset-x-0 md:z-40">
            <div className={`${wrap} pb-4 md:pt-2`}>
              <div className="md:max-w-[760px] md:shadow-pop md:rounded-2xl">
                <SkiCalendar
                  initialFrom={checkin || undefined}
                  initialTo={checkout || undefined}
                  onSelect={applyDates}
                  onCancel={hasDates ? () => setDateOpen(false) : undefined}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <main className={`${wrap} pt-6 md:pt-8 pb-16 md:pb-20 flex gap-7 items-start`}>

        {/* ── Filters (desktop) ──────────────────────────────── */}
        <aside aria-label="סינון" className="hidden lg:flex w-[290px] shrink-0 flex-col gap-6 bg-white border border-line rounded-[20px] p-5 sticky top-[96px]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[18px] text-ink">סינון</span>
            {(kind !== "all" || sort !== "recommended") && (
              <button type="button" onClick={() => { setKind("all"); setSort("recommended"); }}
                className="min-h-[44px] px-1 text-[14px] font-bold text-accent hover:text-accent-hover">ניקוי</button>
            )}
          </div>
          {combos.length === 0 && <>
          <fieldset className="flex flex-col gap-2.5">
            <legend className="font-bold text-[15px] text-ink mb-2">סוג הדירה</legend>
            {kinds.map(k => (
              <label key={k.key} className="flex items-center gap-2.5 text-[15px] text-ink min-h-[32px] cursor-pointer">
                <input type="radio" name="kind" checked={kind === k.key} onChange={() => setKind(k.key)}
                  className="w-[18px] h-[18px] accent-accent" />
                {k.label}{k.key === "agency" ? ", סוכנות" : ""} <span className="text-muted">({counts[k.key]})</span>
              </label>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2.5">
            <legend className="font-bold text-[15px] text-ink mb-2">סידור</legend>
            {([["recommended", "מומלץ"], ["price", "המחיר הנמוך קודם"]] as [Sort, string][]).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2.5 text-[15px] text-ink min-h-[32px] cursor-pointer">
                <input type="radio" name="sort" checked={sort === k} onChange={() => setSort(k)}
                  className="w-[18px] h-[18px] accent-accent" />
                {label}
              </label>
            ))}
          </fieldset>
          </>}
          {full && (
            <div className="flex flex-col gap-2">
              <span className="font-bold text-[15px] text-ink">בדיל השלם, לכל אחד</span>
              <ul className="flex flex-col gap-1.5 text-[14px] text-body">
                <li className="flex items-center gap-2"><Check size={15} />דירה</li>
                {dealItems(extras, flight, withFlight).map(f => (
                  <li key={f.text} className={`flex items-start gap-2 ${f.muted ? "text-muted" : ""}`}>
                    {f.plane ? <span className="mt-0.5 shrink-0 text-accent"><IcoPlane /></span> : <span className="mt-0.5 shrink-0"><Check size={15} /></span>}
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
              {hasDates && flight.status === "none" && <p className="text-[13px] text-muted leading-relaxed">אין טיסה ישירה הלוך וחזור בתאריכים האלה, אז אין טיסה בחבילה.</p>}
            </div>
          )}
          <HelpBox />
        </aside>

        {/* ── Results ────────────────────────────────────────── */}
        <section aria-label="תוצאות" className="flex-1 min-w-0 flex flex-col gap-4 md:gap-[18px]">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display font-bold text-[26px] leading-tight md:text-[32px] tracking-tight text-ink text-balance">{title}</h1>
            <p className="text-[15px] md:text-[16px] text-muted">
              {loading ? "בודקים מה פנוי…"
                : combos.length > 0 ? `אין דירה אחת לכל ${guests} האנשים, אז חיברנו שתי דירות יחד.`
                : shown.length === 0 ? (hasDates ? "לא מצאנו דירה מתאימה לתאריכים האלה." : "לא מצאנו דירה מתאימה.")
                : <>
                    {shown.length === 1 ? "אפשרות אחת פנויה" : `${shown.length} אפשרויות פנויות`}{hasDates ? " לתאריכים האלה" : ""}.
                    {minPrice !== null && <> החל מ-{eur(minPrice)} ללילה{nights > 0 ? " בממוצע" : ""} בדירות שלנו.</>}
                    {full && (withFlight && flight.status === "found" ? " המחיר לאדם כולל דירה, סקי פס, הסעה וטיסה ישירה." : " המחיר לאדם כולל דירה, סקי פס והסעה.")}
                    {full && hasDates && flight.status === "none" && " אין טיסה ישירה בתאריכים האלה."}
                  </>}
            </p>
          </div>

          {full && <FlightToggle on={withFlight} setOn={setWithFlight} flight={flight} hasDates={hasDates} />}

          {/* phone: filter chips + sort */}
          {!loading && combos.length === 0 && fits.length > 0 && (
            <div className="lg:hidden flex flex-wrap items-center gap-2">
              {kinds.map(k => (
                <button key={k.key} type="button" aria-pressed={kind === k.key} onClick={() => setKind(k.key)}
                  className={`min-h-[40px] px-4 rounded-full border text-[15px] font-bold transition-colors ${kind === k.key ? "bg-ink border-ink text-white" : "bg-white border-line-strong text-ink"}`}>
                  {k.label} <span className={kind === k.key ? "text-white/70" : "text-muted"}>{counts[k.key]}</span>
                </button>
              ))}
              <label className="ms-auto flex items-center gap-2 text-[14px] text-muted">
                <span className="sr-only md:not-sr-only">סידור</span>
                <select value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="סידור"
                  className="min-h-[40px] rounded-full border border-line-strong bg-white px-3 text-[15px] text-ink">
                  <option value="recommended">מומלץ</option>
                  <option value="price">המחיר הנמוך</option>
                </select>
              </label>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className={`${card} overflow-hidden flex flex-col sm:flex-row`}>
                  <Skeleton className="rounded-none sm:w-[300px] h-[210px] sm:h-[230px]" />
                  <div className="flex-1 p-6 flex flex-col gap-3">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : combos.length > 0 ? (
            <div className="flex flex-col gap-4">
              {combos.map(c => (
                <ComboCard key={c.a.id + c.b.id} a={c.a} b={c.b} total={c.total} cap={c.cap}
                  checkin={checkin} checkout={checkout} guests={guests} nights={nights} />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <EmptyState
              title={fits.length > 0 ? "אין דירות מהסוג הזה לתאריכים האלה" : `לא מצאנו דירה פנויה${guests > 1 ? ` ל-${guests} אנשים` : ""}`}
              text={fits.length > 0 ? "אפשר לראות את כל הסוגים, או לנסות תאריכים אחרים." : "נסו תאריכים אחרים, או תכתבו לעוזר שלנו ונמצא לכם משהו מתאים."}
              action={<>
                {kind !== "all" && fits.length > 0 && (
                  <button type="button" onClick={() => setKind("all")} className={btn.outline}>לכל הדירות</button>
                )}
                <button type="button" onClick={() => { setDateOpen(true); setEditOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={btn.outline}>תאריכים אחרים</button>
                <OpenChatButton className={btn.primary}><IcoChat />לכתוב לעוזר</OpenChatButton>
              </>}
            />
          ) : (
            <div className="flex flex-col gap-4 md:gap-[18px]">
              {shown.map(apt => (
                <AptCard key={apt.id} apt={apt} nights={nights}
                  checkin={checkin} checkout={checkout} guests={guests} deal={deal}
                  rules={rulesMap[apt.id] ?? []} badge={apt.id === cheapestId ? "הכי זול" : undefined}
                  extras={extras} flight={flight} withFlight={withFlight} />
              ))}
            </div>
          )}

          {!loading && (shown.length > 0 || combos.length > 0) && (
            <p className="flex items-start gap-2 text-[14px] text-muted mt-1">
              <span className="mt-0.5 shrink-0"><IcoPin /></span>
              {hasDates
                ? "המחירים לתאריכים שבחרתם. בדירות שלנו המחיר הוא לכל הלילות, ובדירות הסוכנות מחיר השבוע המלא (שבת עד שבת)."
                : "כל הדירות בואל טורנס. בחרו תאריכים כדי לראות מה פנוי ובכמה."}
            </p>
          )}

          {/* phone: the chat box at the end of the list (the empty state has its own button) */}
          {(loading || shown.length > 0 || combos.length > 0) && <div className="lg:hidden"><HelpBox /></div>}
        </section>
      </main>
    </div>
  );
}

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<SkiLoader />}>
      <SearchPage />
    </Suspense>
  );
}
