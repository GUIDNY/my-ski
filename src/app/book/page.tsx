"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Apartment, SkiPass } from "@/types";
import { IconMountain, IconSkis, IconBus, IconPlane, IconShield, IconUser, IconBot, IconCalendar, IconCheck } from "@/components/Icons";
import Logo from "@/components/Logo";

/* ── Constants ──────────────────────────────────────────────── */
const TRANSFER_PP  = 90; // per person per direction
const FLEXIBLE_PP  = 100;
const AI_DISC_PP   = 50;

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate  = (s: string) => { if (!s) return ""; const d = new Date(s); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtShort = (s: string) => { if (!s) return ""; const d = new Date(s); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`; };
const nightsN  = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
const fmtSky   = (s: string) => { const d = new Date(s); return `${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`; };
const orderRef = (id: string) => `VT-${id.replace(/-/g,"").slice(0,6).toUpperCase()}`;

/* ── Signature pad ─────────────────────────────────────────── */
function SignaturePad({ onChange }: { onChange: (v: string) => void }) {
  const ref   = useRef<HTMLCanvasElement>(null);
  const down  = useRef(false);
  const empty = useRef(true);

  const getXY = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = ref.current!;
    const rect   = canvas.getBoundingClientRect();
    const src    = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: (src.clientX - rect.left) * (canvas.width / rect.width), y: (src.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    down.current  = true;
    empty.current = false;
    const ctx = ref.current!.getContext("2d")!;
    const { x, y } = getXY(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!down.current) return;
    e.preventDefault();
    const ctx = ref.current!.getContext("2d")!;
    ctx.strokeStyle = "#1C1B17";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    const { x, y } = getXY(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    down.current = false;
    if (!empty.current) onChange(ref.current!.toDataURL());
  };

  const clear = () => {
    const canvas = ref.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    empty.current = true;
    onChange("");
  };

  return (
    <div>
      <div className="border border-dashed rounded overflow-hidden relative"
        style={{ touchAction: "none", borderColor: "var(--gold-line)", background: "var(--ivory-deep)" }}>
        <canvas ref={ref} width={400} height={100} className="w-full h-24 cursor-crosshair"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
        <div className="absolute top-2 left-2">
          <button onClick={clear} className="text-xs transition-colors px-2 py-0.5 rounded border hover:opacity-70"
            style={{ color: "var(--stone-soft)", background: "var(--paper)", borderColor: "rgba(28,27,23,0.12)" }}>
            נקה
          </button>
        </div>
        <div className="absolute bottom-1 right-2 text-xs select-none text-[var(--stone-soft)]">חתימה</div>
      </div>
    </div>
  );
}

/* ── Section wrapper ───────────────────────────────────────── */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card-luxury overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(28,27,23,0.06)" }}>
        <span className="text-[var(--gold-deep)]">{icon}</span>
        <h3 className="font-display font-medium text-[var(--charcoal)]">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/* ── Confirmation screen ───────────────────────────────────── */
function Confirmation({ bookingId, apt, checkin, checkout, guests, nights, skiPass, transfer, cancel, service, total, details, skyscannerUrl }: {
  bookingId: string; apt: Apartment | null; checkin: string; checkout: string; guests: number; nights: number;
  skiPass: SkiPass | null; transfer: boolean; cancel: string; service: string; total: number;
  details: { name: string; email: string; phone: string }; skyscannerUrl: string;
}) {
  return (
    <div className="min-h-screen flex items-start justify-center pt-12 px-4 pb-12" style={{ background: "var(--ivory)" }} dir="rtl">
      <div className="w-full max-w-2xl">
        {/* Success badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: "var(--gold-wash)" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--gold-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span className="eyebrow block mb-2">התשלום אושר</span>
          <h1 className="font-display text-3xl font-medium mb-1 text-[var(--charcoal)]">תודה, {details.name.split(" ")[0] || "אורח יקר"}!</h1>
          <p className="text-[var(--stone)]">הזמנה מספר <span className="font-bold text-[var(--gold-deep)]">{orderRef(bookingId)}</span></p>
        </div>

        {/* Booking card */}
        <div className="card-luxury overflow-hidden mb-5">
          {/* Header */}
          <div className="px-6 py-5" style={{ background: "var(--ink)", color: "var(--ivory)" }}>
            <div className="eyebrow eyebrow-light mb-1.5">SkiShare · Val Thorens</div>
            <div className="font-display text-xl font-medium">{apt?.name ?? "דירה"}</div>
            <div className="text-sm mt-1" style={{ color: "rgba(250,247,241,0.7)" }}>{fmtShort(checkin)} — {fmtShort(checkout)} · {nights} לילות · {guests} אנשים</div>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-0 text-sm">
            <div className="flex justify-between py-2.5" style={{ borderBottom: "1px solid rgba(28,27,23,0.06)" }}>
              <span className="text-[var(--stone-soft)]">לקוח</span>
              <span className="font-semibold text-[var(--charcoal)]">{details.name}</span>
            </div>
            <div className="flex justify-between py-2.5" style={{ borderBottom: "1px solid rgba(28,27,23,0.06)" }}>
              <span className="text-[var(--stone-soft)]">אימייל</span>
              <span className="font-semibold text-[var(--charcoal)]">{details.email}</span>
            </div>
            {details.phone && (
              <div className="flex justify-between py-2.5" style={{ borderBottom: "1px solid rgba(28,27,23,0.06)" }}>
                <span className="text-[var(--stone-soft)]">טלפון</span>
                <span className="font-semibold text-[var(--charcoal)]">{details.phone}</span>
              </div>
            )}
            <div className="flex justify-between py-2.5" style={{ borderBottom: "1px solid rgba(28,27,23,0.06)" }}>
              <span className="text-[var(--stone-soft)]">הגעה</span>
              <span className="font-semibold text-[var(--charcoal)]">{fmtDate(checkin)}</span>
            </div>
            <div className="flex justify-between py-2.5" style={{ borderBottom: "1px solid rgba(28,27,23,0.06)" }}>
              <span className="text-[var(--stone-soft)]">יציאה</span>
              <span className="font-semibold text-[var(--charcoal)]">{fmtDate(checkout)}</span>
            </div>
            {skiPass && (
              <div className="flex justify-between py-2.5" style={{ borderBottom: "1px solid rgba(28,27,23,0.06)" }}>
                <span className="text-[var(--stone-soft)]">סקי פס</span>
                <span className="font-semibold text-[var(--charcoal)]">{skiPass.name} × {guests}</span>
              </div>
            )}
            {transfer && (
              <div className="flex justify-between py-2.5" style={{ borderBottom: "1px solid rgba(28,27,23,0.06)" }}>
                <span className="text-[var(--stone-soft)]">הסעה</span>
                <span className="font-semibold text-[var(--charcoal)]">כלול</span>
              </div>
            )}
            <div className="flex justify-between py-2.5" style={{ borderBottom: "1px solid rgba(28,27,23,0.06)" }}>
              <span className="text-[var(--stone-soft)]">מדיניות ביטול</span>
              <span className="font-semibold text-[var(--charcoal)]">{cancel === "flexible" ? "גמישה (80% החזר)" : "לא ניתן לביטול"}</span>
            </div>
            <div className="flex justify-between py-2.5" style={{ borderBottom: "1px solid rgba(28,27,23,0.06)" }}>
              <span className="text-[var(--stone-soft)]">שירות</span>
              <span className="font-semibold text-[var(--charcoal)]">{service === "ai" ? "AI בלבד" : "שירות אנושי"}</span>
            </div>
            <div className="flex justify-between pt-4">
              <span className="font-display font-medium text-base text-[var(--charcoal)]">סה״כ שולם</span>
              <span className="font-display font-medium text-xl text-[var(--gold-deep)]">€{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded p-4 text-sm mb-4" style={{ background: "var(--gold-wash)", border: "1px solid var(--gold-line)", color: "var(--gold-deep)" }}>
          <div className="font-bold mb-1">⏰ הצעת מחיר תקפה ל-24 שעות</div>
          <div className="text-[var(--stone)]">תוך 24 שעות תקבל אישור מסודר ואישור הזמנה סופי מנציג SkiShare.</div>
        </div>

        {/* Flight suggestion */}
        <div className="card-luxury p-4 mb-4">
          <div className="text-sm font-bold mb-2 text-[var(--charcoal)]">עדיין לא הזמנת טיסה?</div>
          <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
            className="btn-dark flex items-center justify-between px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <IconPlane size={16} />
              <span>חפש טיסה TLV → Geneva (GVA)</span>
            </div>
            <span>Skyscanner ←</span>
          </a>
        </div>

        <a href="/" className="block text-center font-semibold text-sm hover:opacity-70 transition-opacity text-[var(--gold-deep)]">
          → חזור לעמוד הבית
        </a>
      </div>
    </div>
  );
}

/* ── Main book page ────────────────────────────────────────── */
function BookPage() {
  const params    = useSearchParams();
  const aptId     = params.get("apartment_id") ?? "";
  const aptName   = params.get("apartment") ?? "";
  const checkin   = params.get("checkin") ?? "";
  const checkout  = params.get("checkout") ?? "";
  const guests    = parseInt(params.get("guests") ?? "2");
  const initCancel  = (params.get("cancel") as "none" | "flexible") ?? "none";
  const initService = (params.get("service") as "human" | "ai") ?? "human";

  const nights = checkin && checkout ? nightsN(checkin, checkout) : 0;
  const skyscannerUrl = checkin && checkout
    ? `https://www.skyscanner.co.il/transport/flights/tlv/gva/${fmtSky(checkin)}/${fmtSky(checkout)}/?adultsv2=${guests}&cabinclass=economy&childrenv2=&rtn=1`
    : `https://www.skyscanner.co.il/transport/flights/tlv/gva/`;

  /* ── State ───────────────────────────────────────────────── */
  const [apt,        setApt]        = useState<Apartment | null>(null);
  const [skiPasses,  setSkiPasses]  = useState<SkiPass[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Selections
  const [selectedPass, setSelectedPass]   = useState<string | null>(null);
  const [transfer,     setTransfer]       = useState(params.get("transfer") === "true");
  const [cancel,       setCancel]         = useState<"none" | "flexible">(initCancel);
  const [service,      setService]        = useState<"human" | "ai">(initService);

  // Transfer details
  const [isElAlChecked, setIsElAlChecked] = useState(false);
  const [tDirection,  setTDirection]  = useState<"both"|"outbound"|"return">("both");
  const [tPassengers, setTPassengers] = useState(guests);
  const [tAirportIn,  setTAirportIn]  = useState("GVA");
  const [tArrival,    setTArrival]    = useState("");
  const [tFlightIn,   setTFlightIn]   = useState("");
  const [tAirportOut, setTAirportOut] = useState("GVA");
  const [tDeparture,  setTDeparture]  = useState("");
  const [tFlightOut,  setTFlightOut]  = useState("");

  // Personal details
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Payment
  const [cardNum,    setCardNum]    = useState("");
  const [cardName,   setCardName]   = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv,    setCardCvv]    = useState("");
  const [signature,  setSignature]  = useState("");
  const [terms,      setTerms]      = useState(false);

  // Submission
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  /* ── Load data ───────────────────────────────────────────── */
  useEffect(() => {
    const loadApt = aptId
      ? fetch(`/api/apartments/${aptId}`).then(r => r.json())
      : fetch("/api/apartments").then(r => r.json()).then((list: Apartment[]) =>
          list.find(a => a.name === aptName || a.id === aptName) ?? null);

    Promise.all([
      loadApt,
      fetch("/api/ski-passes").then(r => r.json()),
    ]).then(([aptData, passes]) => {
      setApt(aptData);
      const adultPasses = Array.isArray(passes) ? passes.filter((p: SkiPass) => p.type === "adult") : [];
      setSkiPasses(adultPasses);
      setLoading(false);
    });
  }, [aptId, aptName]);

  /* ── Constraint: flexible + AI not allowed ───────────────── */
  const setCancelSafe = (v: "none" | "flexible") => {
    setCancel(v);
    if (v === "flexible") setService("human");
  };
  const setServiceSafe = (v: "human" | "ai") => {
    setService(v);
    if (v === "ai") setCancel("none");
  };

  /* ── Price ───────────────────────────────────────────────── */
  const skiPass    = skiPasses.find(p => p.id === selectedPass);
  const aptPrice   = apt ? apt.price_per_night * nights : 0;
  const skiPrice   = 0; // price TBD — quoted separately
  const tDirs      = tDirection === "both" ? 2 : 1;
  const trPrice    = transfer && isElAlChecked ? TRANSFER_PP * tDirs * tPassengers : 0;
  const flexPrice  = cancel === "flexible" ? FLEXIBLE_PP * guests : 0;
  const aiDisc     = service === "ai" ? -(AI_DISC_PP * guests) : 0;
  const subtotal   = aptPrice + skiPrice + trPrice + flexPrice + aiDisc;
  const total      = subtotal;

  /* ── Card formatting ─────────────────────────────────────── */
  const fmtCard   = (v: string) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExpiry = (v: string) => { const d = v.replace(/\D/g,"").slice(0,4); return d.length >= 3 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };

  /* ── Submit ──────────────────────────────────────────────── */
  const submit = async () => {
    if (!name || !email) { setError("נא למלא שם ואימייל"); return; }
    if (!terms) { setError("נא לאשר את התקנון"); return; }
    if (transfer && (!tArrival || !tDeparture)) { setError("נא למלא פרטי טיסה להסעה"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartment_id: apt?.id ?? aptId ?? null,
          check_in: checkin,
          check_out: checkout,
          guests,
          total_price: total,
          status: "pending",
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          add_ons: {
            ski_pass: !!selectedPass,
            ski_pass_name: skiPass?.name,
            ski_pass_days: skiPass?.duration_days,
            transfer,
            transfer_is_elal: transfer ? isElAlChecked : null,
            transfer_airport_in: transfer ? tAirportIn : null,
            transfer_arrival: transfer ? tArrival : null,
            transfer_flight_in: transfer ? tFlightIn : null,
            transfer_airport_out: transfer ? tAirportOut : null,
            transfer_departure: transfer ? tDeparture : null,
            transfer_flight_out: transfer ? tFlightOut : null,
            cancel_policy: cancel,
            service_level: service,
          },
          notes,
        }),
      });
      if (!res.ok) throw new Error("שגיאה בשמירת ההזמנה");
      const booking = await res.json();
      setConfirmedId(booking.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Confirmation ────────────────────────────────────────── */
  if (confirmedId) return (
    <Confirmation
      bookingId={confirmedId} apt={apt} checkin={checkin} checkout={checkout}
      guests={guests} nights={nights} skiPass={skiPass ?? null}
      transfer={transfer} cancel={cancel} service={service} total={total}
      details={{ name, email, phone }} skyscannerUrl={skyscannerUrl}
    />
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ivory)" }}>
      <SkiLoader />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--ivory)" }} dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40" style={{ background: "var(--paper)", borderBottom: "1px solid rgba(28,27,23,0.08)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center"><Logo className="h-9" /></a>
          <div className="text-sm flex items-center gap-1.5 text-[var(--stone)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            הזמנה מאובטחת
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Apartment banner */}
        {apt && (
          <div className="card-luxury overflow-hidden flex gap-0 mb-6">
            <div className="w-40 sm:w-52 flex-shrink-0">
              <img src={apt.images?.[0] ?? "/apt1.jpg"} alt={apt.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 p-5 text-right">
              <div className="eyebrow mb-1">{apt.type}</div>
              <h2 className="font-display text-xl font-medium mb-1 text-[var(--charcoal)]">{apt.name}</h2>
              <div className="flex items-center gap-1.5 text-sm mb-3 text-[var(--stone)]">
                <IconMountain size={13} className="text-[var(--gold-deep)]" />
                Val Thorens, Trois Vallées
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-[var(--charcoal)]">
                  <IconCalendar size={14} className="text-[var(--gold-deep)]" />
                  {fmtShort(checkin)} — {fmtShort(checkout)}
                </span>
                <span className="text-[var(--stone-soft)]">·</span>
                <span className="text-[var(--stone)]">{nights} לילות</span>
                <span className="text-[var(--stone-soft)]">·</span>
                <span className="text-[var(--stone)]">{guests} אנשים</span>
              </div>
              <a href="/search" className="mt-3 inline-block text-xs hover:opacity-70 transition-opacity text-[var(--gold-deep)]">→ שנה בחירה</a>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT: sections ──────────────────────────────── */}
          <div className="flex-1 space-y-5">

            {/* Ski Pass */}
            <Section title="סקי פס — Trois Vallées" icon={<IconSkis size={18} />}>
              <div className="space-y-2">
                <button onClick={() => setSelectedPass(null)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded border text-sm transition-all"
                  style={selectedPass === null
                    ? { borderColor: "var(--gold)", background: "var(--gold-wash)" }
                    : { borderColor: "rgba(28,27,23,0.1)" }}>
                  <span className="font-medium text-[var(--stone)]">ללא סקי פס</span>
                  {selectedPass === null && <IconCheck size={15} className="text-[var(--gold-deep)]" />}
                </button>
                {skiPasses.map(pass => (
                  <div key={pass.id}
                    className="w-full flex items-center justify-between px-4 py-3 rounded border text-sm opacity-50 cursor-not-allowed select-none"
                    style={{ borderColor: "rgba(28,27,23,0.1)" }}>
                    <div className="text-right">
                      <div className="font-semibold text-[var(--stone)]">{pass.name}</div>
                      <div className="text-xs text-[var(--stone-soft)]">{pass.duration_days} ימי סקי</div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "var(--gold-wash)", color: "var(--gold-deep)" }}>הצעת מחיר בנפרד</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Transfer */}
            <Section title="הסעה משדה התעופה" icon={<IconBus size={18} />}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--charcoal)]">שאטל ישיר Geneva/Lyon → Val Thorens</div>
                  <div className="text-xs mt-0.5 text-[var(--stone-soft)]">€{TRANSFER_PP} לאדם לכיוון</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setTransfer(!transfer)}
                    className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
                    style={{ background: transfer ? "var(--gold)" : "rgba(28,27,23,0.15)" }}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${transfer ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              </div>

              {transfer && (
                <div className="rounded p-4 space-y-4" style={{ background: "var(--gold-wash)", border: "1px solid var(--gold-line)" }}>

                  {/* El Al checkbox */}
                  <button onClick={() => setIsElAlChecked(v => !v)}
                    className="w-full flex items-center gap-3 p-3.5 rounded border transition-all text-right"
                    style={isElAlChecked
                      ? { borderColor: "#7fb88f", background: "#f0f7f2" }
                      : { borderColor: "rgba(28,27,23,0.12)", background: "var(--paper)" }}>
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={isElAlChecked ? { background: "#4a9d63", borderColor: "#4a9d63" } : { borderColor: "rgba(28,27,23,0.2)" }}>
                      {isElAlChecked && <IconCheck size={13} className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[var(--charcoal)]">✈️ זוהי טיסת אל על ישירה</div>
                      <div className="text-xs mt-0.5 text-[var(--stone)]">מחיר מאושר: €{TRANSFER_PP} לאדם לכיוון</div>
                    </div>
                    {isElAlChecked
                      ? <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: "#2f6e42", background: "#e2f2e6" }}>✓ אל על</span>
                      : <span className="text-xs px-2.5 py-1 rounded-full" style={{ color: "var(--stone-soft)", background: "var(--ivory-deep)" }}>לא מסומן</span>
                    }
                  </button>

                  {/* Direction */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider mb-2 text-[var(--stone-soft)]">כיוון נסיעה</div>
                    <div className="flex gap-2">
                      {([["both","הלוך וחזור"],["outbound","הלוך בלבד"],["return","חזור בלבד"]] as const).map(([k,label]) => (
                        <button key={k} onClick={() => setTDirection(k)}
                          className="flex-1 py-2 rounded border text-xs font-bold transition-all"
                          style={tDirection === k
                            ? { borderColor: "var(--gold)", background: "var(--paper)", color: "var(--gold-deep)" }
                            : { borderColor: "rgba(28,27,23,0.12)", background: "var(--paper)", color: "var(--stone)" }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Passengers */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider mb-2 text-[var(--stone-soft)]">נוסעים</div>
                    <div className="flex items-center gap-3 rounded px-4 py-2 w-fit" style={{ background: "var(--paper)", border: "1px solid rgba(28,27,23,0.12)" }}>
                      <button onClick={() => setTPassengers(v => Math.max(1, v - 1))}
                        className="w-8 h-8 rounded-full border flex items-center justify-center font-bold hover:border-[var(--gold)] hover:text-[var(--gold-deep)] transition-colors"
                        style={{ borderColor: "rgba(28,27,23,0.12)", color: "var(--stone)" }}>−</button>
                      <span className="font-display font-medium text-lg w-6 text-center text-[var(--charcoal)]">{tPassengers}</span>
                      <button onClick={() => setTPassengers(v => Math.min(20, v + 1))}
                        className="w-8 h-8 rounded-full border flex items-center justify-center font-bold hover:border-[var(--gold)] hover:text-[var(--gold-deep)] transition-colors"
                        style={{ borderColor: "rgba(28,27,23,0.12)", color: "var(--stone)" }}>+</button>
                      <span className="text-sm text-[var(--stone-soft)]">{tPassengers === 1 ? "אדם" : "אנשים"}</span>
                    </div>
                  </div>

                  {/* Inbound fields */}
                  {(tDirection === "both" || tDirection === "outbound") && (
                    <div className="rounded p-3 space-y-2" style={{ background: "var(--paper)", border: "1px solid var(--gold-line)" }}>
                      <div className="text-xs font-bold mb-1 text-[var(--stone)]">✈️ טיסת הלוך — נחיתה בשדה התעופה</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs block mb-1 text-[var(--stone-soft)]">שדה תעופה</label>
                          <select value={tAirportIn} onChange={e => setTAirportIn(e.target.value)}
                            className="w-full rounded px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                            style={{ border: "1px solid rgba(28,27,23,0.14)", background: "var(--paper)" }}>
                            <option value="GVA">Geneva (GVA)</option>
                            <option value="LYS">Lyon (LYS)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs block mb-1 text-[var(--stone-soft)]">שעת נחיתה</label>
                          <input type="time" value={tArrival} onChange={e => setTArrival(e.target.value)}
                            className="w-full rounded px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                            style={{ border: "1px solid rgba(28,27,23,0.14)", background: "var(--paper)" }} />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs block mb-1 text-[var(--stone-soft)]">מספר טיסה</label>
                          <input type="text" value={tFlightIn} onChange={e => setTFlightIn(e.target.value.toUpperCase())}
                            placeholder="LY323 / FR1234"
                            className="w-full rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:outline-none"
                            style={{ border: "1px solid rgba(28,27,23,0.14)", background: "var(--paper)" }} dir="ltr" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Outbound fields */}
                  {(tDirection === "both" || tDirection === "return") && (
                    <div className="rounded p-3 space-y-2" style={{ background: "var(--paper)", border: "1px solid var(--gold-line)" }}>
                      <div className="text-xs font-bold mb-1 text-[var(--stone)]">✈️ טיסת חזור — המראה משדה התעופה</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs block mb-1 text-[var(--stone-soft)]">שדה תעופה</label>
                          <select value={tAirportOut} onChange={e => setTAirportOut(e.target.value)}
                            className="w-full rounded px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                            style={{ border: "1px solid rgba(28,27,23,0.14)", background: "var(--paper)" }}>
                            <option value="GVA">Geneva (GVA)</option>
                            <option value="LYS">Lyon (LYS)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs block mb-1 text-[var(--stone-soft)]">שעת המראה</label>
                          <input type="time" value={tDeparture} onChange={e => setTDeparture(e.target.value)}
                            className="w-full rounded px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                            style={{ border: "1px solid rgba(28,27,23,0.14)", background: "var(--paper)" }} />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs block mb-1 text-[var(--stone-soft)]">מספר טיסה</label>
                          <input type="text" value={tFlightOut} onChange={e => setTFlightOut(e.target.value.toUpperCase())}
                            placeholder="LY324 / FR1235"
                            className="w-full rounded px-3 py-2 text-sm font-mono focus:ring-2 focus:outline-none"
                            style={{ border: "1px solid rgba(28,27,23,0.14)", background: "var(--paper)" }} dir="ltr" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price note */}
                  {isElAlChecked ? (
                    <div className="text-sm rounded px-4 py-3 font-semibold flex justify-between items-center"
                      style={{ color: "#2f6e42", background: "#e2f2e6", border: "1px solid #b9dcc2" }}>
                      <span>✓ מחיר מאושר — אל על ישיר</span>
                      <span className="font-bold">€{TRANSFER_PP} × {tDirs} × {tPassengers} = €{trPrice}</span>
                    </div>
                  ) : (
                    <div className="text-xs rounded px-3 py-2.5" style={{ color: "var(--gold-deep)", background: "var(--gold-wash)", border: "1px solid var(--gold-line)" }}>
                      ⚠ הצעת מחיר להסעה תשלח בהקדם (מחיר ממוצע ~€{TRANSFER_PP} לאדם לכיוון)
                    </div>
                  )}
                </div>
              )}

              {/* Skyscanner suggestion */}
              <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center justify-between px-4 py-3 rounded border transition-all hover:bg-[var(--gold-wash)]"
                style={{ borderColor: "rgba(28,27,23,0.1)" }}>
                <div className="flex items-center gap-2 text-sm text-[var(--stone)]">
                  <IconPlane size={15} className="text-[var(--stone-soft)]" />
                  טרם הזמנת טיסה? חפש TLV → Geneva
                </div>
                <span className="text-xs font-bold text-[var(--gold-deep)]">Skyscanner ←</span>
              </a>
            </Section>

            {/* Cancellation Policy */}
            <Section title="מדיניות ביטול" icon={<IconShield size={18} />}>
              <div className="space-y-2">
                <button onClick={() => setCancelSafe("none")}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-right
                    ${cancel === "none" ? "border-[var(--gold)] bg-[var(--gold-wash)]" : "border-gray-100 hover:border-gray-200"}`}>
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                    ${cancel === "none" ? "border-[var(--gold)] bg-[var(--gold)]" : "border-gray-300"}`}>
                    {cancel === "none" && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">לא ניתן לביטול</div>
                    <div className="text-xs text-gray-400 mt-0.5">מחיר מוזל — אין החזר כספי לאחר ההזמנה</div>
                  </div>
                </button>
                <button onClick={() => setCancelSafe("flexible")}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-right
                    ${cancel === "flexible" ? "border-green-400 bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                    ${cancel === "flexible" ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                    {cancel === "flexible" && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">מדיניות גמישה</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">+€{FLEXIBLE_PP}/אדם</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">80% החזר עד 48 שעות לפני ההגעה</div>
                    {cancel === "flexible" && (
                      <div className="text-xs text-amber-600 mt-1.5 bg-amber-50 rounded px-2 py-1">
                        שימו לב: מדיניות גמישה כוללת שירות אנושי מלא
                      </div>
                    )}
                  </div>
                </button>
              </div>
              <a href="/cancellation-policy" target="_blank"
                className="mt-3 text-xs text-[var(--gold-deep)] hover:underline block text-center">
                ← קרא את מדיניות הביטול המלאה
              </a>
            </Section>

            {/* Service Level */}
            <Section title="רמת שירות" icon={<IconUser size={18} />}>
              <div className="space-y-2">
                <button onClick={() => setServiceSafe("human")}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-right
                    ${service === "human" ? "border-[var(--gold)] bg-[var(--gold-wash)]" : "border-gray-100 hover:border-gray-200"}`}>
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                    ${service === "human" ? "border-[var(--gold)] bg-[var(--gold)]" : "border-gray-300"}`}>
                    {service === "human" && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">שירות אנושי מלא</div>
                    <div className="text-xs text-gray-400 mt-0.5">נציג ישראלי זמין לפני, במהלך ואחרי הנסיעה</div>
                  </div>
                </button>
                <button onClick={() => setServiceSafe("ai")}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-right
                    ${service === "ai" ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                    ${service === "ai" ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
                    {service === "ai" && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">AI בלבד</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                        חסוך €{AI_DISC_PP * guests}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">ניהול עצמאי עם תמיכת צ׳אטבוט · חיסכון של €{AI_DISC_PP}/אדם</div>
                    <div className="text-xs text-red-500 mt-1.5 font-medium">
                      ⚠ לא ניתן לשלב עם מדיניות ביטול גמישה
                    </div>
                  </div>
                </button>
              </div>
            </Section>

            {/* Personal Details */}
            <Section title="פרטים אישיים" icon={<IconUser size={18} />}>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">שם מלא *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--gold)] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">טלפון</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+972-50-000-0000" type="tel"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--gold)] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">אימייל *</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="israel@example.com" type="email"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--gold)] focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">הערות</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="בקשות מיוחדות..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--gold)] focus:outline-none resize-none" />
                </div>
              </div>
            </Section>
          </div>

          {/* ── RIGHT: price + payment ───────────────────────── */}
          <div className="lg:w-[360px] flex-shrink-0">
            <div className="sticky top-20 space-y-4">

              {/* Price breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 pt-5 pb-4 border-b border-gray-50">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">פירוט מחיר</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">€{apt?.price_per_night ?? 0} × {nights} לילות</span>
                      <span className="font-semibold">€{aptPrice.toLocaleString()}</span>
                    </div>
                    {skiPass && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">{skiPass.name} × {guests}</span>
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">הצעת מחיר בנפרד</span>
                      </div>
                    )}
                    {transfer && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">הסעה × {tPassengers} × {tDirs} כיוונות</span>
                        {isElAlChecked
                          ? <span className="font-semibold">€{trPrice.toLocaleString()}</span>
                          : <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">הצעת מחיר בנפרד</span>
                        }
                      </div>
                    )}
                    {cancel === "flexible" && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">ביטול גמיש × {guests}</span>
                        <span className="font-semibold">€{flexPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {service === "ai" && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">הנחת AI × {guests}</span>
                        <span className="font-semibold text-indigo-600">−€{Math.abs(aiDisc).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-5 py-4 flex justify-between items-center">
                  <span className="font-black text-gray-900">סה״כ לתשלום</span>
                  <span className="text-2xl font-black text-gray-900">€{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment form */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">פרטי תשלום (הדגמה)</div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">מספר כרטיס</label>
                  <input value={cardNum}
                    onChange={e => setCardNum(fmtCard(e.target.value))}
                    placeholder="1234 5678 9012 3456" maxLength={19}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest focus:ring-2 focus:ring-[var(--gold)] focus:outline-none" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">שם בעל הכרטיס</label>
                  <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="ISRAEL ISRAELI"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--gold)] focus:outline-none" dir="ltr" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">תוקף</label>
                    <input value={cardExpiry}
                      onChange={e => setCardExpiry(fmtExpiry(e.target.value))}
                      placeholder="MM/YY" maxLength={5}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-center focus:ring-2 focus:ring-[var(--gold)] focus:outline-none" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">CVV</label>
                    <input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,"").slice(0,4))}
                      placeholder="123" maxLength={4}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-center focus:ring-2 focus:ring-[var(--gold)] focus:outline-none" dir="ltr" />
                  </div>
                </div>

                {/* Signature */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">חתימה וירטואלית</label>
                  <SignaturePad onChange={setSignature} />
                  <div className="text-xs text-gray-400 mt-1 text-center">חתום בעזרת העכבר / האצבע</div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${terms ? "bg-[var(--gold)] border-[var(--gold)]" : "border-gray-300 hover:border-[var(--gold)]"}`}
                    onClick={() => setTerms(!terms)}>
                    {terms && <IconCheck size={12} className="text-white" />}
                  </div>
                  <span className="text-xs text-gray-600 leading-relaxed">
                    קראתי ואני מאשר את{" "}
                    <a href="/cancellation-policy" target="_blank" className="text-[var(--gold-deep)] hover:underline">תנאי השירות ומדיניות הביטול</a>
                    {" "}של SkiShare
                  </span>
                </label>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3 text-center">{error}</div>
                )}

                <button onClick={submit} disabled={submitting || !terms}
                  className="w-full py-4 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-deep)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--ink)] font-black text-base transition-colors shadow-sm">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      מעבד...
                    </span>
                  ) : `← אשר הזמנה · €${total.toLocaleString()}`}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  הצעת מחיר תקפה ל-24 שעות · תשלום מאובטח
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SkiLoader />
      </div>
    }>
      <BookPage />
    </Suspense>
  );
}
