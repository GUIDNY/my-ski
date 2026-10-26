"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTop, card, btn, field, fieldLabel, chip, wrap } from "@/components/ui";

type VehicleClass = { class: string; vehicle_class_id: string; max_pax: number; max_luggage: number; on_request: boolean; price_cents: number };
type Supplement = { id: string; name: string; price_cents: number };
type Shared = { available: boolean; price_cents?: number; seats_remaining?: number; on_request?: boolean } | null;
type LiveQuote = { private: VehicleClass[]; supplements: Supplement[]; shared: Shared; travel: { drive_minutes?: number; km?: number } | null } | null;

// Full Winteride /quotes response for one leg (vehicle classes, shared seats, supplements, the drive).
async function fetchLiveQuote(params: { airport_code: string; resort_slug: string; date: string; pax: number; out_direction: "arrival" | "departure"; flight_no?: string; luggage?: number; ski?: number }): Promise<LiveQuote> {
  try {
    const res = await fetch("/api/transfers/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
    if (!res.ok) return null;
    const q = await res.json();
    if (!q.private?.length) return null;
    return { private: q.private, supplements: q.supplements ?? [], shared: q.shared ?? null, travel: q.travel ?? null };
  } catch {
    return null;
  }
}

/** A value that settles a moment after the user stops typing (the flight number fetches prices). */
function useSettled<T>(v: T, ms = 700): T {
  const [s, setS] = useState(v);
  useEffect(() => { const t = setTimeout(() => setS(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return s;
}

const CLASS_HE: Record<string, string> = {
  sedan: "רכב פרטי (סדאן)", minivan: "מיניוואן", van: "ואן", "Premium minivan": "מיניוואן פרימיום",
  minibus: "מיניבוס", coach: "אוטובוס",
};
const sharedSeat = (q: LiveQuote) => (q?.shared?.available && q.shared.price_cents ? q.shared : null);

const SUPPLEMENT_LABELS: Record<string, string> = {
  "Additional stop": "עצירה נוספת",
  "Baby seat (0–13 kg)": "כיסא תינוק (0–13 ק״ג)",
  "Booster seat (15–36 kg)": "בוסטר (15–36 ק״ג)",
};

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`; };

const PRICE_PER_DIRECTION = 90;

const AIRPORTS = [
  { code: "GVA", label: "ז'נבה (GVA)", note: "כשעתיים וחצי נסיעה" },
  { code: "LYS", label: "ליון (LYS)",   note: "כשלוש שעות נסיעה" },
];

function isElAl(flightNum: string) {
  return flightNum.trim().toUpperCase().startsWith("LY");
}

/* ── Icons (stroke, follow the text color) ─────────────────── */
const ico = (path: React.ReactNode, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const IcoPlane = ({ size = 20 }: { size?: number }) => ico(<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />, size);
const IcoVan = ({ size = 20 }: { size?: number }) => ico(<><rect x="3" y="6" width="18" height="10" rx="2" /><path d="M3 11h18" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="16.5" cy="18" r="1.5" /></>, size);
const IcoTag = ({ size = 20 }: { size?: number }) => ico(<><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>, size);
const IcoHome = ({ size = 20 }: { size?: number }) => ico(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>, size);
const IcoInfo = ({ size = 18 }: { size?: number }) => ico(<><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></>, size);
const IcoCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l4 4 10-10" /></svg>
);

/* ── Pieces ────────────────────────────────────────────────── */
function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={htmlFor} className={fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className={`${card} p-5 md:p-6 flex flex-col gap-4`} aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="flex items-center gap-3 font-display font-bold text-[19px] md:text-[20px] text-ink">
        <span className="w-8 h-8 rounded-full bg-accent-soft text-accent text-[15px] font-extrabold flex items-center justify-center shrink-0">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A selectable box (airport, direction, vehicle): the design's option cards. */
const optionCls = (on: boolean) =>
  `rounded-2xl border text-right transition-colors ${on ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line bg-white hover:border-line-strong"}`;

/* ── Flight leg form ───────────────────────────────────────── */
function FlightLeg({ id, title, flightNum, date, time, onFlight, onDate, onTime, found }: {
  id: string;
  title: string;
  flightNum: string; date: string; time: string;
  onFlight(v: string): void; onDate(v: string): void; onTime(v: string): void;
  /** the flight's own time, from the transfer company's flight lookup */
  found?: string | null;
}) {
  const elal = isElAl(flightNum);
  return (
    <div className="rounded-2xl border border-line bg-soft p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2 mb-3.5">
        <span className="text-accent"><IcoPlane size={18} /></span>
        <span className="font-bold text-ink text-[16px]">{title}</span>
        {flightNum && (
          <span className={`text-[13px] font-bold px-2.5 py-0.5 rounded-full ${elal ? "bg-ok-soft text-ok-text" : "bg-warn-soft text-warn"}`}>
            {elal ? "אל על ישיר · מחיר קבוע" : "מחיר משוער"}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="מספר טיסה" htmlFor={`${id}-flight`}>
          <input id={`${id}-flight`} value={flightNum} onChange={e => onFlight(e.target.value)}
            placeholder="LY311 / FR1234..."
            className={`${field} text-right`} dir="ltr" autoComplete="off" />
        </Field>
        <Field label="תאריך" htmlFor={`${id}-date`}>
          <input id={`${id}-date`} type="date" value={date} onChange={e => onDate(e.target.value)}
            className={`${field} text-right`} dir="ltr" />
        </Field>
        <Field label="שעה" htmlFor={`${id}-time`}>
          <input id={`${id}-time`} type="time" value={time} onChange={e => onTime(e.target.value)}
            className={`${field} text-right`} dir="ltr" />
        </Field>
      </div>
      {found && (
        <p className="flex items-center gap-2 text-[14px] text-ok-text mt-3 bg-ok-soft rounded-xl px-3.5 py-2.5">
          <IcoCheck size={15} /> מצאנו את הטיסה: {id === "out" ? "נוחתת" : "ממריאה"} ב-<span dir="ltr">{found}</span>{time && time !== found ? <> (בטופס: <span dir="ltr">{time}</span>)</> : null}
        </p>
      )}
      {flightNum && !elal && (
        <p className="flex items-start gap-2 text-[14px] text-warn mt-3 bg-warn-soft rounded-xl px-3.5 py-2.5">
          <span className="mt-0.5 shrink-0"><IcoInfo size={16} /></span>
          טיסות שאינן אל על ישיר: המחיר משוער ועשוי להשתנות בהתאם לשעות הנחיתה
        </p>
      )}
    </div>
  );
}

export type TransferInitial = { checkin: string; checkout: string; guests: number; aptName: string; aptId: string; airport?: string; direction?: "outbound" | "return" | "both"; outTime?: string; retTime?: string; outFlight?: string; retFlight?: string };

/* ── The booking form (the page around it renders on the server) ── */
export default function TransfersClient({ initial }: { initial: TransferInitial }) {
  const { checkin, checkout, aptName, aptId } = initial;
  const guestsParam = initial.guests;

  // Direction
  const [direction, setDirection] = useState<"outbound" | "return" | "both">(initial.direction || "both");

  // Outbound flight
  const [outFlight, setOutFlight] = useState(initial.outFlight || "");
  const [outDate,   setOutDate]   = useState(checkin);
  const [outTime,   setOutTime]   = useState(initial.outTime || "");

  // Return flight
  const [retFlight, setRetFlight] = useState(initial.retFlight || "");
  const [retDate,   setRetDate]   = useState(checkout);
  const [retTime,   setRetTime]   = useState(initial.retTime || "");

  // Other
  const [isElAlOverride, setIsElAlOverride] = useState(false);
  const [airport,   setAirport]   = useState(initial.airport === "LYS" ? "LYS" : "GVA");
  const [passengers, setPassengers] = useState(guestsParam);
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [notes,     setNotes]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]     = useState("");

  // Live pricing from Winteride, fetched per active leg once its date is set.
  const [outQuote, setOutQuote] = useState<LiveQuote>(null);
  const [retQuote, setRetQuote] = useState<LiveQuote>(null);
  const [quoting,  setQuoting]  = useState(false);

  // Vehicle class + extras — chosen once, applied to every active leg.
  const [vehicleClassId, setVehicleClassId] = useState<string | null>(null);
  const [luggage, setLuggage] = useState(passengers);
  const [ski,     setSki]     = useState(0);
  // a private car, or a seat on the shared shuttle (when the transfer company runs one for the flight)
  const [service, setService] = useState<"private" | "shared">("private");
  const [suppQty, setSuppQty] = useState<Record<string, number>>({});
  const [outFound, setOutFound] = useState<string | null>(null);
  const [retFound, setRetFound] = useState<string | null>(null);
  const outFlightQ = useSettled(outFlight.trim().toUpperCase());
  const retFlightQ = useSettled(retFlight.trim().toUpperCase());
  const luggageQ = useSettled(luggage), skiQ = useSettled(ski);

  // The live-price effects are kept as they were: they clear a leg's quote when
  // it's switched off, and pick the cheapest vehicle once classes arrive.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (direction === "return" || !outDate) { setOutQuote(null); return; }
    let cancelled = false;
    setQuoting(true);
    fetchLiveQuote({ airport_code: airport, resort_slug: "val-thorens", date: outDate, pax: passengers, out_direction: "arrival", flight_no: outFlightQ || undefined, luggage: luggageQ, ski: skiQ })
      .then(q => { if (!cancelled) setOutQuote(q); })
      .finally(() => { if (!cancelled) setQuoting(false); });
    return () => { cancelled = true; };
  }, [airport, outDate, passengers, outFlightQ, luggageQ, skiQ, direction]);

  useEffect(() => {
    if (direction === "outbound" || !retDate) { setRetQuote(null); return; }
    let cancelled = false;
    setQuoting(true);
    fetchLiveQuote({ airport_code: airport, resort_slug: "val-thorens", date: retDate, pax: passengers, out_direction: "departure", flight_no: retFlightQ || undefined, luggage: luggageQ, ski: skiQ })
      .then(q => { if (!cancelled) setRetQuote(q); })
      .finally(() => { if (!cancelled) setQuoting(false); });
    return () => { cancelled = true; };
  }, [airport, retDate, passengers, retFlightQ, luggageQ, skiQ, direction]);

  // the flight's own time: shown under the leg, and filled in when the time is still empty
  useEffect(() => {
    setOutFound(null);
    if (direction === "return" || !outDate || !/^[A-Z0-9]{2}\d{1,4}$/.test(outFlightQ)) return;
    let cancelled = false;
    fetch(`/api/transfers/flight?flight_no=${outFlightQ}&date=${outDate}&direction=arrival&airport_code=${airport}`)
      .then(r => r.json()).then(f => {
        if (cancelled || !f?.found || !f.time) return;
        setOutFound(f.time); setOutTime(t => t || f.time);
      }).catch(() => {});
    return () => { cancelled = true; };
  }, [airport, outDate, outFlightQ, direction]);
  useEffect(() => {
    setRetFound(null);
    if (direction === "outbound" || !retDate || !/^[A-Z0-9]{2}\d{1,4}$/.test(retFlightQ)) return;
    let cancelled = false;
    fetch(`/api/transfers/flight?flight_no=${retFlightQ}&date=${retDate}&direction=departure&airport_code=${airport}`)
      .then(r => r.json()).then(f => {
        if (cancelled || !f?.found || !f.time) return;
        setRetFound(f.time); setRetTime(t => t || f.time);
      }).catch(() => {});
    return () => { cancelled = true; };
  }, [airport, retDate, retFlightQ, direction]);

  // Master class/supplements list — whichever leg has answered first.
  const referenceQuote = outQuote ?? retQuote;
  const availableClasses = referenceQuote?.private ?? [];
  const availableSupplements = referenceQuote?.supplements ?? [];

  // a car fits when the people and the bags (suitcases and ski sets) fit in it
  const fits = (c: VehicleClass) => c.max_pax >= passengers && c.max_luggage >= luggage + ski;
  useEffect(() => {
    if (!availableClasses.length) return;
    const cur = availableClasses.find(c => c.vehicle_class_id === vehicleClassId);
    if (cur && fits(cur)) return;
    const fitting = availableClasses.filter(c => !c.on_request && fits(c));
    const bookable = fitting.length ? fitting : availableClasses.filter(c => !c.on_request);
    const cheapest = (bookable.length ? bookable : availableClasses).reduce((a, b) => (b.price_cents < a.price_cents ? b : a));
    setVehicleClassId(cheapest.vehicle_class_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableClasses.map(c => c.vehicle_class_id).join(","), passengers, luggage, ski]);

  // shared seats: on each active leg, for the flight given (priced per person)
  const outShared = direction !== "return" ? sharedSeat(outQuote) : null;
  const retShared = direction !== "outbound" ? sharedSeat(retQuote) : null;
  const sharedOffered = (direction === "return" || !!outShared) && (direction === "outbound" || !!retShared);
  useEffect(() => { if (service === "shared" && !sharedOffered) setService("private"); }, [service, sharedOffered]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const directions = direction === "both" ? 2 : 1;
  const classPriceFor = (q: LiveQuote) => q?.private.find(c => c.vehicle_class_id === vehicleClassId)?.price_cents ?? null;
  const outClassPrice = direction !== "return" ? classPriceFor(outQuote) : null;
  const retClassPrice = direction !== "outbound" ? classPriceFor(retQuote) : null;
  const hasLivePrice = (direction !== "return" ? outClassPrice != null : true) && (direction !== "outbound" ? retClassPrice != null : true);
  const supplementsCentsPerLeg = availableSupplements.reduce((sum, s) => sum + s.price_cents * (suppQty[s.id] || 0), 0);
  const isShared = service === "shared" && sharedOffered;
  const sharedCents = ((outShared?.price_cents ?? 0) + (retShared?.price_cents ?? 0)) * passengers;
  const liveCentsTotal = isShared ? sharedCents + supplementsCentsPerLeg * directions
    : (outClassPrice ?? 0) + (retClassPrice ?? 0) + supplementsCentsPerLeg * directions;
  const totalPrice = isShared || hasLivePrice ? Math.round(liveCentsTotal / 100) : PRICE_PER_DIRECTION * directions * passengers;
  const travel = (outQuote ?? retQuote)?.travel;
  const driveText = travel?.drive_minutes ? `כ-${Math.floor(travel.drive_minutes / 60)}:${String(travel.drive_minutes % 60).padStart(2, "0")} שעות נסיעה${travel.km ? ` · ${travel.km} ק״מ` : ""}` : "";

  // Is confirmed price? All selected legs must be El Al
  const outIsElal = isElAl(outFlight);
  const retIsElal = isElAl(retFlight);
  const priceConfirmed = isElAlOverride || (() => {
    if (direction === "outbound") return outFlight ? outIsElal : false;
    if (direction === "return")   return retFlight ? retIsElal : false;
    return (outFlight || retFlight) ? (outIsElal && retIsElal) : false;
  })();
  const canSubmit = name.trim() &&
    (direction !== "outbound" || (outFlight && outDate && outTime)) &&
    (direction !== "return"   || (retFlight && retDate && retTime)) &&
    (direction !== "both"     || (outFlight && outDate && outTime && retFlight && retDate && retTime));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const body = {
        direction,
        outbound_flight: outFlight || null,
        outbound_date:   outDate   || null,
        outbound_time:   outTime   || null,
        return_flight:   retFlight || null,
        return_date:     retDate   || null,
        return_time:     retTime   || null,
        airport,
        passengers,
        is_elal: priceConfirmed,
        total_price: totalPrice,
        customer_name:  name,
        customer_email: email || null,
        customer_phone: phone || null,
        notes: [aptName ? `דירה: ${aptName}` : "", notes].filter(Boolean).join(" | ") || null,
        apartment_id: aptId || null,
        resort_slug: "val-thorens",
        vehicle_class: isShared ? "shared" : availableClasses.find(c => c.vehicle_class_id === vehicleClassId)?.class ?? "sedan",
        vehicle_class_id: isShared ? null : vehicleClassId,
        supplements: Object.entries(suppQty).flatMap(([id, n]) => Array.from({ length: n }, () => id)),
        luggage,
        ski,
        quote_snapshot: { outbound: outQuote, return: retQuote },
        status: "pending",
      };
      const res = await fetch("/api/transfers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("שגיאה בשמירת ההזמנה");
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "שגיאה לא צפויה");
    } finally {
      setSubmitting(false);
    }
  };

  // the confirmation replaces the (long) form: bring it into view
  useEffect(() => {
    if (submitted) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [submitted]);

  const airportLabel = AIRPORTS.find(a => a.code === airport)?.label;
  const directionLabel = direction === "both" ? "הלוך וחזור" : direction === "outbound" ? "הלוך" : "חזור";
  // what's still missing before the order can be sent (shown under the button)
  const missing = [
    !name.trim() && "שם מלא",
    ((direction !== "return" && !(outFlight && outDate && outTime)) || (direction !== "outbound" && !(retFlight && retDate && retTime))) && "פרטי הטיסה (מספר, תאריך ושעה)",
  ].filter(Boolean) as string[];

  if (submitted) return (
    <div className={`${wrap} py-12 md:py-20 flex justify-center`} dir="rtl">
      <div className={`${card} w-full max-w-[520px] p-7 md:p-9 text-center flex flex-col items-center gap-3`} role="status">
        <span className="w-16 h-16 rounded-full bg-ok-soft text-ok flex items-center justify-center mb-1"><IcoCheck size={30} /></span>
        <h1 className="font-display font-bold text-[26px] md:text-[30px] text-ink">ההזמנה התקבלה</h1>
        <p className="text-[16px] text-body">הסעה מ-{airportLabel}</p>
        <p className="text-[16px] text-body">{passengers} נוסעים · {directions} כיוון{directions > 1 ? "ות" : ""} · <span className="font-bold text-ink">€{totalPrice}</span></p>
        {!priceConfirmed && (
          <p className="w-full text-[14px] text-warn bg-warn-soft rounded-xl px-4 py-3 mt-1">
            המחיר משוער, ונאשר אותו מולכם לפני התשלום
          </p>
        )}
        <p className="text-[15px] text-muted">נחזור אליכם בקרוב לאישור ולפרטי התשלום</p>
        <Link href="/" className={`${btn.primary} mt-3`}>לדף הבית</Link>
      </div>
    </div>
  );

  const submitButton = (
    <button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting}
      className={`${btn.primaryLg} w-full`}>
      {submitting ? "שולחים…" : "להזמין הסעה"}
    </button>
  );

  return (
    <div dir="rtl" className="bg-white">
      <PageTop soft
        crumbs={[{ label: "דף הבית", href: "/" }, { label: "הסעות" }]}
        title="הסעה משדה התעופה לואל טורנס"
        sub="שאטל ישיר משדה התעופה בז'נבה או בליון עד הדירה בואל טורנס. ממלאים את פרטי הטיסה ורואים מחיר."
        aside={aptName && checkin && checkout ? (
          <span className={chip}><span className="text-accent"><IcoHome size={16} /></span>{aptName} · {fmtDate(checkin)} עד {fmtDate(checkout)}</span>
        ) : undefined}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 md:mt-8">
          {AIRPORTS.map(a => (
            <div key={a.code} className="bg-white border border-line rounded-[18px] p-4 flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0"><IcoPlane /></span>
              <div>
                <div className="font-display font-bold text-[18px] text-ink">{a.label}</div>
                <div className="text-[14px] text-muted">{a.note}</div>
              </div>
            </div>
          ))}
          <div className="bg-white border border-line rounded-[18px] p-4 flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0"><IcoTag /></span>
            <div>
              <div className="font-display font-bold text-[18px] text-ink">€{PRICE_PER_DIRECTION} לאדם לכיוון</div>
              <div className="text-[14px] text-muted">מחיר קבוע לטיסות אל על ישירות</div>
            </div>
          </div>
        </div>
      </PageTop>

      <div className={`${wrap} py-8 md:py-12`}>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* ── Form ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-5">

            <Step n={1} title="מאיזה שדה ולאיזה כיוון?">
              <div role="radiogroup" aria-label="שדה תעופה" className="grid grid-cols-2 gap-3">
                {AIRPORTS.map(a => (
                  <button key={a.code} type="button" role="radio" aria-checked={airport === a.code} onClick={() => setAirport(a.code)}
                    className={`${optionCls(airport === a.code)} p-4 flex items-start gap-3 min-h-[72px]`}>
                    <span className={`hidden sm:inline ${airport === a.code ? "text-accent" : "text-muted"}`}><IcoPlane /></span>
                    <span className="flex flex-col">
                      <span className="font-bold text-[16px] text-ink">{a.label}</span>
                      <span className="text-[14px] text-muted">{a.note}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div role="radiogroup" aria-label="כיוון נסיעה" className="grid grid-cols-3 gap-1 bg-soft border border-line rounded-2xl p-1">
                {([["both","הלוך וחזור"],["outbound","הלוך בלבד"],["return","חזור בלבד"]] as const).map(([k,label]) => (
                  <button key={k} type="button" role="radio" aria-checked={direction === k} onClick={() => setDirection(k)}
                    className={`min-h-[44px] rounded-xl text-[15px] font-bold transition-colors ${direction === k ? "bg-ink text-white" : "text-ink hover:bg-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </Step>

            <Step n={2} title="פרטי הטיסה">
              {(direction === "outbound" || direction === "both") && (
                <FlightLeg id="out"
                  title="טיסת הלוך · נחיתה בשדה התעופה"
                  flightNum={outFlight} date={outDate} time={outTime}
                  onFlight={setOutFlight} onDate={setOutDate} onTime={setOutTime} found={outFound}
                />
              )}
              {(direction === "return" || direction === "both") && (
                <FlightLeg id="ret"
                  title="טיסת חזור · המראה משדה התעופה"
                  flightNum={retFlight} date={retDate} time={retTime}
                  onFlight={setRetFlight} onDate={setRetDate} onTime={setRetTime} found={retFound}
                />
              )}
            </Step>

            <Step n={3} title="נוסעים וציוד">
              <div className="flex flex-col">
                <span className={fieldLabel} id="pax-label">מספר נוסעים</span>
                <div className="flex items-center gap-3 border border-line-strong rounded-xl p-1.5 w-fit" role="group" aria-labelledby="pax-label">
                  <button type="button" onClick={() => setPassengers(v => Math.max(1, v - 1))} aria-label="נוסע אחד פחות"
                    className="w-11 h-11 rounded-lg border border-line flex items-center justify-center text-[20px] font-bold text-ink hover:border-ink transition-colors">−</button>
                  <span className="font-display font-extrabold text-ink text-[20px] w-8 text-center" aria-live="polite">{passengers}</span>
                  <button type="button" onClick={() => setPassengers(v => Math.min(20, v + 1))} aria-label="נוסע אחד יותר"
                    className="w-11 h-11 rounded-lg border border-line flex items-center justify-center text-[20px] font-bold text-ink hover:border-ink transition-colors">+</button>
                  <span className="text-[15px] text-muted ms-1 me-2">{passengers === 1 ? "אדם" : "אנשים"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="מספר מזוודות" htmlFor="luggage">
                  <input id="luggage" type="number" inputMode="numeric" min={0} max={30} value={luggage}
                    onChange={e => setLuggage(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`${field} text-right`} dir="ltr" />
                </Field>
                <Field label="ציוד סקי (סטים)" htmlFor="ski">
                  <input id="ski" type="number" inputMode="numeric" min={0} max={30} value={ski}
                    onChange={e => setSki(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`${field} text-right`} dir="ltr" />
                </Field>
              </div>

              {(
                <div className="flex flex-col gap-2">
                  <span className={fieldLabel}>איך נוסעים</span>
                  <div role="radiogroup" aria-label="סוג ההסעה" className="grid grid-cols-2 gap-1 bg-soft border border-line rounded-2xl p-1">
                    <button type="button" role="radio" aria-checked={!isShared} onClick={() => setService("private")}
                      className={`min-h-[52px] rounded-xl text-[15px] font-bold transition-colors flex flex-col items-center justify-center ${!isShared ? "bg-ink text-white" : "text-ink hover:bg-white"}`}>
                      רכב פרטי<span className={`text-[12px] font-medium ${!isShared ? "text-white/75" : "text-muted"}`}>רק אתם, מהשדה עד הדלת</span>
                    </button>
                    <button type="button" role="radio" aria-checked={isShared} onClick={() => sharedOffered && setService("shared")} disabled={!sharedOffered}
                      className={`min-h-[52px] rounded-xl text-[15px] font-bold transition-colors flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${isShared ? "bg-ink text-white" : "text-ink hover:bg-white"}`}>
                      שאטל משותף<span className={`text-[12px] font-medium ${isShared ? "text-white/75" : "text-muted"}`}>
                        {sharedOffered ? `€${Math.round(((outShared?.price_cents ?? 0) + (retShared?.price_cents ?? 0)) / 100)} לאדם` : "מחיר לפי מספר הטיסה"}
                      </span>
                    </button>
                  </div>
                  {isShared ? (
                    <p className="text-[14px] text-body bg-soft rounded-xl px-3.5 py-2.5">
                      מושב בשאטל עם נוסעים מטיסות באותו זמן, עד הכפר. זול יותר, וייתכנו המתנה קצרה ועצירות בדרך.
                      {[outShared?.seats_remaining, retShared?.seats_remaining].some(n => typeof n === "number" && n < 8) && <> נשארו מעט מקומות.</>}
                    </p>
                  ) : !sharedOffered && (
                    <p className="text-[13px] text-muted">
                      {quoting ? "בודקים מחירים ואפשרויות…"
                        : !availableClasses.length ? "המחירים והרכבים מופיעים אחרי שבוחרים תאריך. שאטל משותף מופיע כשיש לטיסה שלכם שאטל, לפי מספר הטיסה."
                        : "שאטל משותף מופיע כשיש לטיסה שלכם שאטל: כותבים את מספר הטיסה בשלב 2."}
                    </p>
                  )}
                </div>
              )}

              {availableClasses.length > 0 && !isShared && (
                <div className="flex flex-col gap-2">
                  <span className={fieldLabel}>סוג רכב</span>
                  <div role="radiogroup" aria-label="סוג רכב" className="flex flex-col gap-2">
                    {availableClasses.filter(c => c.max_pax >= passengers).map(c => {
                      const on = vehicleClassId === c.vehicle_class_id;
                      const tight = c.max_luggage < luggage + ski;
                      return (
                        <button key={c.vehicle_class_id} type="button" role="radio" aria-checked={on}
                          onClick={() => setVehicleClassId(c.vehicle_class_id)}
                          disabled={c.on_request}
                          className={`${optionCls(on)} flex items-center justify-between gap-3 px-4 py-3.5 min-h-[60px] disabled:opacity-45 disabled:cursor-not-allowed`}>
                          <span className="flex items-center gap-3">
                            <span className={on ? "text-accent" : "text-muted"}><IcoVan /></span>
                            <span className="flex flex-col">
                              <span className="font-bold text-[16px] text-ink">{CLASS_HE[c.class] ?? c.class}{c.on_request && " (לפי בקשה בלבד)"}</span>
                              <span className={`text-[14px] ${tight ? "text-warn" : "text-muted"}`}>עד {c.max_pax} נוסעים · עד {c.max_luggage} מזוודות{tight ? " · צפוף לכמות התיקים" : ""}</span>
                            </span>
                          </span>
                          <span className="font-display font-bold text-[17px] text-ink whitespace-nowrap">€{Math.round(c.price_cents / 100)}{direction === "both" ? <span className="text-[14px] font-medium text-muted"> / כיוון</span> : ""}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {availableSupplements.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className={fieldLabel}>תוספות</span>
                  {availableSupplements.map(s => {
                    const n = suppQty[s.id] || 0;
                    const set = (v: number) => setSuppQty(q => ({ ...q, [s.id]: Math.max(0, Math.min(6, v)) }));
                    return (
                      <div key={s.id} className={`${optionCls(n > 0)} flex items-center justify-between gap-3 px-4 py-3 min-h-[56px]`}>
                        <span className="flex flex-col">
                          <span className="text-[16px] font-bold text-ink">{SUPPLEMENT_LABELS[s.name] ?? s.name}</span>
                          <span className="text-[14px] text-muted"><span dir="ltr">+€{(s.price_cents / 100).toFixed(0)}</span> ליחידה{directions > 1 ? " לכל כיוון" : ""}</span>
                        </span>
                        <span className="flex items-center gap-2" role="group" aria-label={SUPPLEMENT_LABELS[s.name] ?? s.name}>
                          <button type="button" onClick={() => set(n - 1)} disabled={n === 0} aria-label="פחות"
                            className="w-10 h-10 rounded-lg border border-line bg-white flex items-center justify-center text-[18px] font-bold text-ink disabled:opacity-40">−</button>
                          <span className="w-6 text-center font-bold text-ink" aria-live="polite">{n}</span>
                          <button type="button" onClick={() => set(n + 1)} aria-label="עוד"
                            className="w-10 h-10 rounded-lg border border-line bg-white flex items-center justify-center text-[18px] font-bold text-ink">+</button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Step>

            <Step n={4} title="פרטים ליצירת קשר">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="שם מלא *" htmlFor="name">
                  <input id="name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" required
                    placeholder="ישראל ישראלי" className={field} />
                </Field>
                <Field label="טלפון" htmlFor="phone">
                  <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel"
                    placeholder="050-0000000" className={`${field} text-right`} dir="ltr" />
                </Field>
                <Field label="אימייל" htmlFor="email">
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                    placeholder="name@email.com" className={`${field} text-right`} dir="ltr" />
                </Field>
                <Field label="הערות" htmlFor="notes">
                  <input id="notes" value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="כמות מזוודות, בעלי חיים..." className={field} />
                </Field>
              </div>
            </Step>

            {error && <p role="alert" className="text-[15px] text-danger bg-danger-soft border border-danger/20 px-4 py-3 rounded-xl">{error}</p>}
          </div>

          {/* ── Summary ───────────────────────────────────────── */}
          <aside aria-label="סיכום ההסעה" className="w-full lg:w-[380px] shrink-0 lg:sticky lg:top-[96px]">
            <div className={`${card} p-5 md:p-6 flex flex-col gap-4 shadow-card`}>
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center"><IcoVan /></span>
                <div>
                  <div className="font-display font-bold text-[18px] text-ink">סיכום ההסעה</div>
                  <div className="text-[14px] text-muted">שאטל ישיר לואל טורנס</div>
                </div>
              </div>

              <dl className="flex flex-col gap-2.5 text-[15px]">
                <div className="flex justify-between gap-3"><dt className="text-body">שדה תעופה</dt><dd className="font-bold text-ink">{airportLabel}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-body">כיוון</dt><dd className="font-bold text-ink">{directionLabel}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-body">נוסעים</dt><dd className="font-bold text-ink">{passengers}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-body">הסעה</dt><dd className="font-bold text-ink">{isShared ? "שאטל משותף" : CLASS_HE[availableClasses.find(c => c.vehicle_class_id === vehicleClassId)?.class ?? ""] ?? "רכב פרטי"}</dd></div>
                {driveText && <div className="flex justify-between gap-3"><dt className="text-body">הדרך</dt><dd className="font-bold text-ink">{driveText}</dd></div>}
              </dl>

              <div className="border-t border-line pt-4 flex flex-col gap-1">
                <span className="text-[13px] text-muted">
                  {quoting ? "בודקים מחיר עדכני…" : isShared ? `${passengers} מושבים · ${directions === 1 ? "כיוון אחד" : `${directions} כיוונים`} · מחיר חי` : hasLivePrice ? `${directions === 1 ? "כיוון אחד" : `${directions} כיוונים`} · מחיר חי מספק ההסעות` : `€${PRICE_PER_DIRECTION} × ${directions === 1 ? "כיוון אחד" : `${directions} כיוונים`} × ${passengers} נוסעים`}
                </span>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] text-muted">סה״כ</span>
                  <span className="font-display font-extrabold text-[36px] leading-none text-ink">€{totalPrice}</span>
                </div>
                <span className={`self-end text-[13px] font-bold ${isShared || hasLivePrice ? "text-ok-text" : "text-warn"}`}>
                  {isShared || hasLivePrice ? "מחיר חי" : "מחיר משוער, יעודכן לפני האישור"}
                </span>
              </div>

              {/* El Al: a fixed price per person and direction */}
              <button type="button" role="checkbox" aria-checked={isElAlOverride || priceConfirmed} onClick={() => setIsElAlOverride(v => !v)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-right transition-colors
                  ${isElAlOverride || priceConfirmed ? "border-ok bg-ok-soft" : "border-line bg-white hover:border-line-strong"}`}>
                <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors
                  ${isElAlOverride || priceConfirmed ? "bg-ok border-ok text-white" : "border-line-strong"}`}>
                  {(isElAlOverride || priceConfirmed) && <IcoCheck size={14} />}
                </span>
                <span className="flex-1 flex flex-col">
                  <span className="text-[15px] font-bold text-ink">טיסת אל על ישירה</span>
                  <span className="text-[13px] text-muted">מחיר קבוע: €{PRICE_PER_DIRECTION}/אדם/כיוון</span>
                </span>
                <span className={`text-[13px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${isElAlOverride || priceConfirmed ? "bg-white text-ok-text" : "bg-soft text-muted"}`}>
                  {isElAlOverride || priceConfirmed ? "מאושר" : "משוער"}
                </span>
              </button>

              <div className="hidden lg:flex flex-col gap-2">
                {submitButton}
                {!canSubmit && missing.length > 0 && <p className="text-[13px] text-muted text-center">כדי להזמין חסרים: {missing.join(", ")}</p>}
              </div>
              <p className="text-center text-[14px] text-muted">נחזור אליכם לאישור ולתשלום</p>
            </div>
          </aside>
        </div>
      </div>

      {/* Phone: the total and the button always at hand (sticks to the bottom
          while the form is on screen, and stays above the footer) */}
      <div className="lg:hidden sticky bottom-0 z-40 bg-white border-t border-line px-4 pt-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))", boxShadow: "0 -8px 24px rgba(11,27,51,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex flex-col">
            <span className="text-[12px] text-muted leading-tight">{hasLivePrice ? "סה״כ" : "סה״כ משוער"}</span>
            <span className="font-display font-extrabold text-[24px] leading-none text-ink">€{totalPrice}</span>
          </div>
          <div className="flex-1">{submitButton}</div>
        </div>
        {!canSubmit && missing.length > 0 && <p className="text-[12px] text-muted mt-1.5 text-center">חסרים: {missing.join(", ")}</p>}
      </div>
    </div>
  );
}
