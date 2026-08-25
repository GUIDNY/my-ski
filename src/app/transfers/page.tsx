"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconMountain, IconBus, IconCheck, IconPlane } from "@/components/Icons";
import Logo from "@/components/Logo";

type VehicleClass = { class: string; vehicle_class_id: string; max_pax: number; max_luggage: number; on_request: boolean; price_cents: number };
type Supplement = { id: string; name: string; price_cents: number };
type LiveQuote = { private: VehicleClass[]; supplements: Supplement[] } | null;

// Full Winteride /quotes response for one leg (vehicle classes + available supplements).
async function fetchLiveQuote(params: { airport_code: string; resort_slug: string; date: string; pax: number; out_direction: "arrival" | "departure"; flight_no?: string }): Promise<LiveQuote> {
  try {
    const res = await fetch("/api/transfers/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
    if (!res.ok) return null;
    const q = await res.json();
    if (!q.private?.length) return null;
    return { private: q.private, supplements: q.supplements ?? [] };
  } catch {
    return null;
  }
}

const SUPPLEMENT_LABELS: Record<string, string> = {
  "Additional stop": "עצירה נוספת",
  "Baby seat (0–13 kg)": "כיסא תינוק (0–13 ק״ג)",
  "Booster seat (15–36 kg)": "בוסטר (15–36 ק״ג)",
};

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`; };

const PRICE_PER_DIRECTION = 90;

const AIRPORTS = [
  { code: "GVA", label: "Geneva (GVA)", note: "2.5 שעות נסיעה" },
  { code: "LYS", label: "Lyon (LYS)",   note: "3 שעות נסיעה" },
];

function isElAl(flightNum: string) {
  return flightNum.trim().toUpperCase().startsWith("LY");
}

/* ── Field wrapper ─────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400";

/* ── Flight leg form ───────────────────────────────────────── */
function FlightLeg({ title, flightNum, date, time, onFlight, onDate, onTime }: {
  title: string;
  flightNum: string; date: string; time: string;
  onFlight(v: string): void; onDate(v: string): void; onTime(v: string): void;
}) {
  const elal = isElAl(flightNum);
  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <IconPlane size={15} className="text-blue-500" />
        <span className="font-bold text-gray-800 text-sm">{title}</span>
        {flightNum && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${elal ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {elal ? "✓ אל על ישיר — מחיר קבוע" : "מחיר משוער"}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="מספר טיסה">
          <input value={flightNum} onChange={e => onFlight(e.target.value)}
            placeholder="LY311 / FR1234..."
            className={inputCls} dir="ltr" />
        </Field>
        <Field label="תאריך">
          <input type="date" value={date} onChange={e => onDate(e.target.value)}
            className={inputCls} dir="ltr" />
        </Field>
        <Field label="שעה">
          <input type="time" value={time} onChange={e => onTime(e.target.value)}
            className={inputCls} dir="ltr" />
        </Field>
      </div>
      {flightNum && !elal && (
        <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded-lg px-3 py-2">
          ⚠️ טיסות שאינן אל על ישיר — המחיר משוער ועשוי להשתנות בהתאם לשעות הנחיתה
        </p>
      )}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
function TransfersPage() {
  const params      = useSearchParams();
  const checkin     = params.get("checkin")  ?? "";
  const checkout    = params.get("checkout") ?? "";
  const guestsParam = parseInt(params.get("guests") ?? "2");
  const aptName     = params.get("apartment") ?? "";
  const aptId       = params.get("apartment_id") ?? "";

  // Direction
  const [direction, setDirection] = useState<"outbound" | "return" | "both">("both");

  // Outbound flight
  const [outFlight, setOutFlight] = useState("");
  const [outDate,   setOutDate]   = useState(checkin);
  const [outTime,   setOutTime]   = useState("");

  // Return flight
  const [retFlight, setRetFlight] = useState("");
  const [retDate,   setRetDate]   = useState(checkout);
  const [retTime,   setRetTime]   = useState("");

  // Other
  const [isElAlOverride, setIsElAlOverride] = useState(false);
  const [airport,   setAirport]   = useState("GVA");
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
  const [supplementIds, setSupplementIds]   = useState<string[]>([]);
  const [luggage, setLuggage] = useState(passengers);
  const [ski,     setSki]     = useState(0);

  useEffect(() => {
    if (direction === "return" || !outDate) { setOutQuote(null); return; }
    let cancelled = false;
    setQuoting(true);
    fetchLiveQuote({ airport_code: airport, resort_slug: "val-thorens", date: outDate, pax: passengers, out_direction: "arrival", flight_no: outFlight || undefined })
      .then(q => { if (!cancelled) setOutQuote(q); })
      .finally(() => { if (!cancelled) setQuoting(false); });
    return () => { cancelled = true; };
  }, [airport, outDate, passengers, outFlight, direction]);

  useEffect(() => {
    if (direction === "outbound" || !retDate) { setRetQuote(null); return; }
    let cancelled = false;
    setQuoting(true);
    fetchLiveQuote({ airport_code: airport, resort_slug: "val-thorens", date: retDate, pax: passengers, out_direction: "departure", flight_no: retFlight || undefined })
      .then(q => { if (!cancelled) setRetQuote(q); })
      .finally(() => { if (!cancelled) setQuoting(false); });
    return () => { cancelled = true; };
  }, [airport, retDate, passengers, retFlight, direction]);

  // Master class/supplements list — whichever leg has answered first.
  const referenceQuote = outQuote ?? retQuote;
  const availableClasses = referenceQuote?.private ?? [];
  const availableSupplements = referenceQuote?.supplements ?? [];

  useEffect(() => {
    if (!availableClasses.length) return;
    if (vehicleClassId && availableClasses.some(c => c.vehicle_class_id === vehicleClassId)) return;
    const bookable = availableClasses.filter(c => !c.on_request);
    const cheapest = (bookable.length ? bookable : availableClasses).reduce((a, b) => (b.price_cents < a.price_cents ? b : a));
    setVehicleClassId(cheapest.vehicle_class_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableClasses.map(c => c.vehicle_class_id).join(",")]);

  const directions = direction === "both" ? 2 : 1;
  const classPriceFor = (q: LiveQuote) => q?.private.find(c => c.vehicle_class_id === vehicleClassId)?.price_cents ?? null;
  const outClassPrice = direction !== "return" ? classPriceFor(outQuote) : null;
  const retClassPrice = direction !== "outbound" ? classPriceFor(retQuote) : null;
  const hasLivePrice = (direction !== "return" ? outClassPrice != null : true) && (direction !== "outbound" ? retClassPrice != null : true);
  const supplementsCentsPerLeg = availableSupplements.filter(s => supplementIds.includes(s.id)).reduce((sum, s) => sum + s.price_cents, 0);
  const liveCentsTotal = (outClassPrice ?? 0) + (retClassPrice ?? 0) + supplementsCentsPerLeg * directions;
  const totalPrice = hasLivePrice ? Math.round(liveCentsTotal / 100) : PRICE_PER_DIRECTION * directions * passengers;

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
        vehicle_class: availableClasses.find(c => c.vehicle_class_id === vehicleClassId)?.class ?? "sedan",
        vehicle_class_id: vehicleClassId,
        supplements: supplementIds,
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

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <IconCheck size={28} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">ההזמנה התקבלה!</h2>
        <p className="text-gray-500 text-sm mb-1">הסעה ל-{AIRPORTS.find(a=>a.code===airport)?.label}</p>
        <p className="text-gray-500 text-sm mb-4">{passengers} נוסעים · {directions} כיוון{directions > 1 ? "ות" : ""} · €{totalPrice}</p>
        {!priceConfirmed && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-4 py-3 mb-4">
            המחיר משוער — נציג יצור איתך קשר לאישור סופי
          </p>
        )}
        <p className="text-xs text-gray-400 mb-6">נציג יצור איתך קשר בקרוב לאישור ופרטי תשלום</p>
        <a href="/" className="inline-block bg-blue-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-blue-700 transition-colors">
          ← חזור לדף הבית
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* Nav */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="flex items-center"><Logo className="h-9" /></a>
          <span className="text-gray-200">/</span>
          <span className="text-sm text-gray-600 font-semibold flex items-center gap-1.5">
            <IconBus size={14} className="text-blue-500" /> הזמנת הסעה
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Form ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Header */}
            <div>
              <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-1">Val Thorens</p>
              <h1 className="text-3xl font-black text-gray-900">הזמנת הסעה</h1>
              <p className="text-gray-500 text-sm mt-1">שאטל ישיר משדה התעופה לוואל תורנס</p>
              {aptName && checkin && checkout && (
                <div className="mt-2 text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-lg inline-flex items-center gap-2">
                  <span className="text-blue-400">🏠</span>
                  {aptName} · {fmtDate(checkin)} — {fmtDate(checkout)}
                </div>
              )}
            </div>

            {/* Airport */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">שדה תעופה</div>
              <div className="flex gap-2">
                {AIRPORTS.map(a => (
                  <button key={a.code} onClick={() => setAirport(a.code)}
                    className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 transition-all text-sm font-bold
                      ${airport === a.code ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"}`}>
                    ✈️ {a.label}
                    <span className="text-xs font-normal text-gray-400 mt-0.5">{a.note}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direction */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">כיוון נסיעה</div>
              <div className="flex gap-2">
                {([["both","הלוך וחזור"],["outbound","הלוך בלבד"],["return","חזור בלבד"]] as const).map(([k,label]) => (
                  <button key={k} onClick={() => setDirection(k)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all
                      ${direction === k ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Outbound leg */}
            {(direction === "outbound" || direction === "both") && (
              <FlightLeg
                title="טיסת הלוך — נחיתה בשדה התעופה"
                flightNum={outFlight} date={outDate} time={outTime}
                onFlight={setOutFlight} onDate={setOutDate} onTime={setOutTime}
              />
            )}

            {/* Return leg */}
            {(direction === "return" || direction === "both") && (
              <FlightLeg
                title="טיסת חזור — המראה משדה התעופה"
                flightNum={retFlight} date={retDate} time={retTime}
                onFlight={setRetFlight} onDate={setRetDate} onTime={setRetTime}
              />
            )}

            {/* Passengers */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">מספר נוסעים</div>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 w-fit">
                <button onClick={() => setPassengers(v => Math.max(1, v - 1))}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">−</button>
                <span className="font-black text-gray-900 text-lg w-8 text-center">{passengers}</span>
                <button onClick={() => setPassengers(v => Math.min(20, v + 1))}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">+</button>
                <span className="text-sm text-gray-400 mr-1">{passengers === 1 ? "אדם" : "אנשים"}</span>
              </div>
            </div>

            {/* Luggage / ski */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="מספר מזוודות">
                <input type="number" min={0} max={30} value={luggage}
                  onChange={e => setLuggage(Math.max(0, parseInt(e.target.value) || 0))}
                  className={inputCls} dir="ltr" />
              </Field>
              <Field label="ציוד סקי (סטים)">
                <input type="number" min={0} max={30} value={ski}
                  onChange={e => setSki(Math.max(0, parseInt(e.target.value) || 0))}
                  className={inputCls} dir="ltr" />
              </Field>
            </div>

            {/* Vehicle class */}
            {availableClasses.length > 0 && (
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">סוג רכב</div>
                <div className="flex flex-col gap-2">
                  {availableClasses.map(c => (
                    <button key={c.vehicle_class_id} onClick={() => setVehicleClassId(c.vehicle_class_id)}
                      disabled={c.on_request}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed
                        ${vehicleClassId === c.vehicle_class_id ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                      <span className="text-right">
                        <span className="font-bold block text-gray-900">{c.class}{c.on_request && " (לפי בקשה בלבד)"}</span>
                        <span className="text-xs text-gray-400">עד {c.max_pax} נוסעים · עד {c.max_luggage} מזוודות</span>
                      </span>
                      <span className="font-bold text-blue-700">€{Math.round(c.price_cents / 100)}{direction === "both" ? " / כיוון" : ""}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Supplements */}
            {availableSupplements.length > 0 && (
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">תוספות</div>
                <div className="flex flex-col gap-2">
                  {availableSupplements.map(s => {
                    const checked = supplementIds.includes(s.id);
                    return (
                      <label key={s.id}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all
                          ${checked ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                        <span className="flex items-center gap-2.5">
                          <input type="checkbox" checked={checked}
                            onChange={() => setSupplementIds(v => checked ? v.filter(id => id !== s.id) : [...v, s.id])}
                            className="w-4 h-4" />
                          <span className="text-sm font-semibold text-gray-900">{SUPPLEMENT_LABELS[s.name] ?? s.name}</span>
                        </span>
                        <span className="text-sm font-bold text-blue-700">+€{(s.price_cents / 100).toFixed(0)}{directions > 1 ? " / כיוון" : ""}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">פרטי יצירת קשר</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="שם מלא *">
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="ישראל ישראלי" className={inputCls} />
                </Field>
                <Field label="טלפון">
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="050-0000000" className={inputCls} dir="ltr" />
                </Field>
                <Field label="אימייל">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="name@email.com" className={inputCls} dir="ltr" />
                </Field>
                <Field label="הערות">
                  <input value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="כמות מזוודות, בעלי חיים..." className={inputCls} />
                </Field>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
          </div>

          {/* ── Price sidebar ─────────────────────────────────── */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">

              <div className="px-5 py-4 bg-gradient-to-br from-gray-50 to-blue-50 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <IconBus size={18} className="text-blue-600" />
                  <span className="font-black text-gray-900">סיכום הסעה</span>
                </div>
                <p className="text-xs text-gray-400">שאטל ישיר — Val Thorens</p>
              </div>

              <div className="p-5 flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">שדה תעופה</span>
                  <span className="font-semibold">{AIRPORTS.find(a=>a.code===airport)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">כיוון</span>
                  <span className="font-semibold">{direction === "both" ? "הלוך וחזור" : direction === "outbound" ? "הלוך" : "חזור"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">נוסעים</span>
                  <span className="font-semibold">{passengers}</span>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-1 flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>
                      {quoting ? "בודק מחיר עדכני..." : hasLivePrice ? `${directions} כיוון · מחיר חי מספק ההסעות` : `€${PRICE_PER_DIRECTION} × ${directions} כיוון × ${passengers} נוסעים`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-gray-900">סה״כ</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-gray-900">€{totalPrice}</span>
                      <div className={`text-xs font-bold mt-0.5 ${hasLivePrice ? "text-green-600" : "text-amber-600"}`}>
                        {hasLivePrice ? "✓ מחיר חי" : "⚠ מחיר משוער — יעודכן לפני האישור"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* El Al checkbox */}
                <button onClick={() => setIsElAlOverride(v => !v)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right
                    ${isElAlOverride || priceConfirmed ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-blue-300"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${isElAlOverride || priceConfirmed ? "bg-green-500 border-green-500" : "border-gray-300"}`}>
                    {(isElAlOverride || priceConfirmed) && <IconCheck size={11} className="text-white" />}
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-xs font-bold text-gray-800">✈️ טיסת אל על ישירה</div>
                    <div className="text-xs text-gray-400 mt-0.5">מחיר קבוע: €{PRICE_PER_DIRECTION}/אדם/כיוון</div>
                  </div>
                  {(isElAlOverride || priceConfirmed)
                    ? <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full whitespace-nowrap">✓ מאושר</span>
                    : <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap">משוער</span>
                  }
                </button>

                <button onClick={handleSubmit} disabled={!canSubmit || submitting}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base transition-colors mt-1">
                  {submitting ? "שולח..." : "← הזמן הסעה"}
                </button>
                <p className="text-center text-xs text-gray-400">נציג יצור קשר לאישור ותשלום</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function TransfersPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SkiLoader />
      </div>
    }>
      <TransfersPage />
    </Suspense>
  );
}
