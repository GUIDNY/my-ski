"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconMountain, IconBus, IconCheck, IconPlane } from "@/components/Icons";
import Logo from "@/components/Logo";

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
      <label className="text-xs font-bold uppercase tracking-wider text-[var(--stone-soft)]">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]";
const inputStyle = { borderColor: "rgba(28,27,23,0.15)", color: "var(--charcoal)", background: "var(--ivory-deep)" } as const;

/* ── Flight leg form ───────────────────────────────────────── */
function FlightLeg({ title, flightNum, date, time, onFlight, onDate, onTime }: {
  title: string;
  flightNum: string; date: string; time: string;
  onFlight(v: string): void; onDate(v: string): void; onTime(v: string): void;
}) {
  const elal = isElAl(flightNum);
  return (
    <div className="rounded p-4 border" style={{ background: "var(--ivory-deep)", borderColor: "rgba(28,27,23,0.08)" }}>
      <div className="flex items-center gap-2 mb-3">
        <IconPlane size={15} className="text-[var(--gold-deep)]" />
        <span className="font-bold text-sm text-[var(--charcoal)]">{title}</span>
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
            className={inputCls} style={inputStyle} dir="ltr" />
        </Field>
        <Field label="תאריך">
          <input type="date" value={date} onChange={e => onDate(e.target.value)}
            className={inputCls} style={inputStyle} dir="ltr" />
        </Field>
        <Field label="שעה">
          <input type="time" value={time} onChange={e => onTime(e.target.value)}
            className={inputCls} style={inputStyle} dir="ltr" />
        </Field>
      </div>
      {flightNum && !elal && (
        <p className="text-xs text-amber-600 mt-2 bg-amber-50 rounded px-3 py-2">
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

  const directions = direction === "both" ? 2 : 1;
  const totalPrice = PRICE_PER_DIRECTION * directions * passengers;

  // Is confirmed price? All selected legs must be El Al
  const outIsElal = isElAl(outFlight);
  const retIsElal = isElAl(retFlight);
  const priceConfirmed = isElAlOverride || (() => {
    if (direction === "outbound") return outFlight ? outIsElal : false;
    if (direction === "return")   return retFlight ? retIsElal : false;
    return (outFlight || retFlight) ? (outIsElal && retIsElal) : false;
  })();
  const hasAnyFlight = direction === "both"
    ? (outFlight || retFlight)
    : direction === "outbound" ? outFlight : retFlight;

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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--ivory)" }} dir="rtl">
      <div className="card-luxury p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <IconCheck size={28} className="text-green-600" />
        </div>
        <h2 className="font-display text-2xl font-medium mb-2 text-[var(--charcoal)]">ההזמנה התקבלה!</h2>
        <p className="text-sm mb-1 text-[var(--stone)]">הסעה ל-{AIRPORTS.find(a=>a.code===airport)?.label}</p>
        <p className="text-sm mb-4 text-[var(--stone)]">{passengers} נוסעים · {directions} כיוון{directions > 1 ? "ות" : ""} · <span style={{ color: "var(--gold-deep)", fontWeight: 700 }}>€{totalPrice}</span></p>
        {!priceConfirmed && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-4 py-3 mb-4">
            המחיר משוער — נציג יצור איתך קשר לאישור סופי
          </p>
        )}
        <p className="text-xs mb-6 text-[var(--stone-soft)]">נציג יצור איתך קשר בקרוב לאישור ופרטי תשלום</p>
        <a href="/" className="btn-dark inline-flex px-6 py-3 text-sm">
          ← חזור לדף הבית
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--ivory)" }} dir="rtl">

      {/* Nav */}
      <div className="sticky top-0 z-40 backdrop-blur-sm border-b" style={{ background: "rgba(255,255,255,0.95)", borderColor: "rgba(28,27,23,0.08)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="flex items-center"><Logo className="h-9" /></a>
          <span className="text-[var(--stone-soft)]">/</span>
          <span className="text-sm font-semibold flex items-center gap-1.5 text-[var(--charcoal)]">
            <IconBus size={14} className="text-[var(--gold-deep)]" /> הזמנת הסעה
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Form ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Header */}
            <div>
              <span className="eyebrow">Val Thorens</span>
              <h1 className="font-display text-3xl font-medium mt-2 text-[var(--charcoal)]">הזמנת הסעה</h1>
              <p className="text-sm mt-1 text-[var(--stone)]">שאטל ישיר משדה התעופה לוואל תורנס</p>
              {aptName && checkin && checkout && (
                <div className="mt-3 text-sm px-3 py-2 rounded inline-flex items-center gap-2" style={{ color: "var(--stone)", background: "var(--gold-wash)" }}>
                  <span className="text-[var(--gold-deep)]">🏠</span>
                  {aptName} · {fmtDate(checkin)} — {fmtDate(checkout)}
                </div>
              )}
            </div>

            {/* Airport */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-2 text-[var(--stone-soft)]">שדה תעופה</div>
              <div className="flex gap-2">
                {AIRPORTS.map(a => (
                  <button key={a.code} onClick={() => setAirport(a.code)}
                    className="flex-1 flex flex-col items-center py-3 rounded border transition-all text-sm font-bold"
                    style={airport === a.code
                      ? { borderColor: "var(--gold)", background: "var(--gold-wash)", color: "var(--gold-deep)" }
                      : { borderColor: "rgba(28,27,23,0.1)", background: "var(--paper)", color: "var(--stone)" }}>
                    ✈️ {a.label}
                    <span className="text-xs font-normal mt-0.5 text-[var(--stone-soft)]">{a.note}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direction */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-2 text-[var(--stone-soft)]">כיוון נסיעה</div>
              <div className="flex gap-2">
                {([["both","הלוך וחזור"],["outbound","הלוך בלבד"],["return","חזור בלבד"]] as const).map(([k,label]) => (
                  <button key={k} onClick={() => setDirection(k)}
                    className="flex-1 py-2.5 rounded border text-sm font-bold transition-all"
                    style={direction === k
                      ? { borderColor: "var(--gold)", background: "var(--gold-wash)", color: "var(--gold-deep)" }
                      : { borderColor: "rgba(28,27,23,0.1)", background: "var(--paper)", color: "var(--stone)" }}>
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
              <div className="text-xs font-bold uppercase tracking-wider mb-2 text-[var(--stone-soft)]">מספר נוסעים</div>
              <div className="flex items-center gap-3 border rounded p-3 w-fit" style={{ background: "var(--paper)", borderColor: "rgba(28,27,23,0.15)" }}>
                <button onClick={() => setPassengers(v => Math.max(1, v - 1))}
                  className="w-9 h-9 rounded-full border flex items-center justify-center font-bold transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-deep)]"
                  style={{ borderColor: "rgba(28,27,23,0.15)", color: "var(--stone)" }}>−</button>
                <span className="font-bold text-lg w-8 text-center text-[var(--charcoal)]">{passengers}</span>
                <button onClick={() => setPassengers(v => Math.min(20, v + 1))}
                  className="w-9 h-9 rounded-full border flex items-center justify-center font-bold transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-deep)]"
                  style={{ borderColor: "rgba(28,27,23,0.15)", color: "var(--stone)" }}>+</button>
                <span className="text-sm mr-1 text-[var(--stone-soft)]">{passengers === 1 ? "אדם" : "אנשים"}</span>
              </div>
            </div>

            {/* Contact */}
            <div className="card-luxury p-5">
              <div className="text-xs font-bold uppercase tracking-wider mb-4 text-[var(--stone-soft)]">פרטי יצירת קשר</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="שם מלא *">
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="ישראל ישראלי" className={inputCls} style={inputStyle} />
                </Field>
                <Field label="טלפון">
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="050-0000000" className={inputCls} style={inputStyle} dir="ltr" />
                </Field>
                <Field label="אימייל">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="name@email.com" className={inputCls} style={inputStyle} dir="ltr" />
                </Field>
                <Field label="הערות">
                  <input value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="כמות מזוודות, בעלי חיים..." className={inputCls} style={inputStyle} />
                </Field>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded">{error}</p>}
          </div>

          {/* ── Price sidebar ─────────────────────────────────── */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-20 card-luxury overflow-hidden">

              <div className="px-5 py-4 border-b" style={{ background: "var(--gold-wash)", borderColor: "rgba(28,27,23,0.08)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <IconBus size={18} className="text-[var(--gold-deep)]" />
                  <span className="font-display font-medium text-[var(--charcoal)]">סיכום הסעה</span>
                </div>
                <p className="text-xs text-[var(--stone-soft)]">שאטל ישיר — Val Thorens</p>
              </div>

              <div className="p-5 flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--stone)]">שדה תעופה</span>
                  <span className="font-semibold text-[var(--charcoal)]">{AIRPORTS.find(a=>a.code===airport)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--stone)]">כיוון</span>
                  <span className="font-semibold text-[var(--charcoal)]">{direction === "both" ? "הלוך וחזור" : direction === "outbound" ? "הלוך" : "חזור"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--stone)]">נוסעים</span>
                  <span className="font-semibold text-[var(--charcoal)]">{passengers}</span>
                </div>

                <div className="pt-3 mt-1 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(28,27,23,0.08)" }}>
                  <div className="flex justify-between text-xs text-[var(--stone-soft)]">
                    <span>€{PRICE_PER_DIRECTION} × {directions} כיוון × {passengers} נוסעים</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[var(--charcoal)]">סה״כ</span>
                    <div className="text-right">
                      <span className="font-display text-2xl font-medium text-[var(--gold-deep)]">€{totalPrice}</span>
                      {hasAnyFlight && (
                        <div className={`text-xs font-bold mt-0.5 ${priceConfirmed ? "text-green-600" : "text-amber-600"}`}>
                          {priceConfirmed ? "✓ מחיר קבוע" : "⚠ מחיר משוער"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* El Al checkbox */}
                <button onClick={() => setIsElAlOverride(v => !v)}
                  className="w-full flex items-center gap-3 p-3 rounded border-2 transition-all text-right"
                  style={isElAlOverride || priceConfirmed
                    ? { borderColor: "#4ade80", background: "#f0fdf4" }
                    : { borderColor: "rgba(28,27,23,0.12)", background: "var(--ivory-deep)" }}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${isElAlOverride || priceConfirmed ? "bg-green-500 border-green-500" : "border-gray-300"}`}>
                    {(isElAlOverride || priceConfirmed) && <IconCheck size={11} className="text-white" />}
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-xs font-bold text-[var(--charcoal)]">✈️ טיסת אל על ישירה</div>
                    <div className="text-xs mt-0.5 text-[var(--stone-soft)]">מחיר קבוע: €{PRICE_PER_DIRECTION}/אדם/כיוון</div>
                  </div>
                  {(isElAlOverride || priceConfirmed)
                    ? <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full whitespace-nowrap">✓ מאושר</span>
                    : <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: "var(--stone-soft)", background: "var(--ivory-deep)" }}>משוער</span>
                  }
                </button>

                <button onClick={handleSubmit} disabled={!canSubmit || submitting}
                  className="btn-gold w-full py-3.5 text-base disabled:opacity-40 disabled:cursor-not-allowed mt-1">
                  {submitting ? "שולח..." : "← הזמן הסעה"}
                </button>
                <p className="text-center text-xs text-[var(--stone-soft)]">נציג יצור קשר לאישור ותשלום</p>
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
