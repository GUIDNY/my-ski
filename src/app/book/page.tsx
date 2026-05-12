"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Apartment, SkiPass } from "@/types";
import { IconMountain, IconSkis, IconBus, IconPlane, IconShield, IconUser, IconBot, IconCalendar, IconCheck } from "@/components/Icons";

/* ── Constants ──────────────────────────────────────────────── */
const TRANSFER_PP  = 90; // per person per direction
const FLEXIBLE_PP  = 100;
const AI_DISC_PP   = 50;
const INSURANCE_R  = 0.08;

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
    ctx.strokeStyle = "#1e3a5f";
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
      <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50 relative"
        style={{ touchAction: "none" }}>
        <canvas ref={ref} width={400} height={100} className="w-full h-24 cursor-crosshair"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
        <div className="absolute top-2 left-2">
          <button onClick={clear} className="text-xs text-gray-400 hover:text-red-500 transition-colors bg-white px-2 py-0.5 rounded border border-gray-200">
            נקה
          </button>
        </div>
        <div className="absolute bottom-1 right-2 text-xs text-gray-300 select-none">חתימה</div>
      </div>
    </div>
  );
}

/* ── Section wrapper ───────────────────────────────────────── */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
        <span className="text-blue-600">{icon}</span>
        <h3 className="font-black text-gray-900">{title}</h3>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-start justify-center pt-12 px-4 pb-12" dir="rtl">
      <div className="w-full max-w-2xl">
        {/* Success badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-1">התשלום אושר!</h1>
          <p className="text-gray-500">הזמנה מספר <span className="font-bold text-blue-600">{orderRef(bookingId)}</span></p>
        </div>

        {/* Booking card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4 text-white">
            <div className="text-sm opacity-80 mb-0.5">MySki · Val Thorens</div>
            <div className="text-xl font-black">{apt?.name ?? "דירה"}</div>
            <div className="text-sm opacity-90 mt-1">{fmtShort(checkin)} — {fmtShort(checkout)} · {nights} לילות · {guests} אנשים</div>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">לקוח</span>
              <span className="font-semibold">{details.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">אימייל</span>
              <span className="font-semibold">{details.email}</span>
            </div>
            {details.phone && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">טלפון</span>
                <span className="font-semibold">{details.phone}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">הגעה</span>
              <span className="font-semibold">{fmtDate(checkin)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">יציאה</span>
              <span className="font-semibold">{fmtDate(checkout)}</span>
            </div>
            {skiPass && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">סקי פס</span>
                <span className="font-semibold">{skiPass.name} × {guests}</span>
              </div>
            )}
            {transfer && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">הסעה</span>
                <span className="font-semibold">כלול</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">מדיניות ביטול</span>
              <span className="font-semibold">{cancel === "flexible" ? "גמישה (80% החזר)" : "לא ניתן לביטול"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">שירות</span>
              <span className="font-semibold">{service === "ai" ? "AI בלבד" : "שירות אנושי"}</span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="font-black text-gray-900 text-base">סה״כ שולם</span>
              <span className="font-black text-blue-600 text-xl">€{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 mb-4">
          <div className="font-bold mb-1">⏰ הצעת מחיר תקפה ל-24 שעות</div>
          <div>תוך 24 שעות תקבל אישור מסודר ואישור הזמנה סופי מנציג MySki.</div>
        </div>

        {/* Flight suggestion */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
          <div className="text-sm font-bold text-gray-700 mb-2">עדיין לא הזמנת טיסה?</div>
          <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors">
            <div className="flex items-center gap-2">
              <IconPlane size={16} />
              <span>חפש טיסה TLV → Geneva (GVA)</span>
            </div>
            <span>Skyscanner ←</span>
          </a>
        </div>

        <a href="/" className="block text-center text-blue-600 font-semibold text-sm hover:underline">
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
  const [insurance,    setInsurance]      = useState(false);
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
  const insPrice   = insurance ? Math.round(subtotal * INSURANCE_R) : 0;
  const total      = subtotal + insPrice;

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
            insurance,
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-black text-gray-900">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <IconMountain size={16} className="text-white" />
            </div>
            MySki
          </a>
          <div className="text-sm text-gray-500 flex items-center gap-1.5">
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
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex gap-0 mb-6 shadow-sm">
            <div className="w-40 sm:w-52 flex-shrink-0">
              <img src={apt.images?.[0] ?? "/apt1.jpg"} alt={apt.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 p-5 text-right">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">{apt.type}</div>
              <h2 className="text-xl font-black text-gray-900 mb-1">{apt.name}</h2>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                <IconMountain size={13} className="text-blue-400" />
                Val Thorens, Trois Vallées
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                  <IconCalendar size={14} className="text-blue-500" />
                  {fmtShort(checkin)} — {fmtShort(checkout)}
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">{nights} לילות</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-600">{guests} אנשים</span>
              </div>
              <a href="/search" className="mt-3 inline-block text-xs text-blue-600 hover:underline">→ שנה בחירה</a>
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
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-all
                    ${selectedPass === null ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <span className="font-medium text-gray-600">ללא סקי פס</span>
                  {selectedPass === null && <IconCheck size={15} className="text-blue-600" />}
                </button>
                {skiPasses.map(pass => (
                  <div key={pass.id}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-gray-100 text-sm opacity-50 cursor-not-allowed select-none">
                    <div className="text-right">
                      <div className="font-semibold text-gray-500">{pass.name}</div>
                      <div className="text-xs text-gray-400">{pass.duration_days} ימי סקי</div>
                    </div>
                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">הצעת מחיר בנפרד</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Transfer */}
            <Section title="הסעה משדה התעופה" icon={<IconBus size={18} />}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-gray-700">שאטל ישיר Geneva/Lyon → Val Thorens</div>
                  <div className="text-xs text-gray-400 mt-0.5">€{TRANSFER_PP} לאדם לכיוון</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setTransfer(!transfer)}
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${transfer ? "bg-blue-600" : "bg-gray-200"}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${transfer ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              </div>

              {transfer && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 space-y-4 border border-blue-100">

                  {/* El Al checkbox */}
                  <button onClick={() => setIsElAlChecked(v => !v)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-right
                      ${isElAlChecked ? "border-green-400 bg-green-50 shadow-sm" : "border-gray-200 bg-white hover:border-blue-300"}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${isElAlChecked ? "bg-green-500 border-green-500" : "border-gray-300"}`}>
                      {isElAlChecked && <IconCheck size={13} className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-800">✈️ זוהי טיסת אל על ישירה</div>
                      <div className="text-xs text-gray-500 mt-0.5">מחיר מאושר: €{TRANSFER_PP} לאדם לכיוון</div>
                    </div>
                    {isElAlChecked
                      ? <span className="text-xs font-black text-green-700 bg-green-100 px-2.5 py-1 rounded-full">✓ אל על</span>
                      : <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">לא מסומן</span>
                    }
                  </button>

                  {/* Direction */}
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">כיוון נסיעה</div>
                    <div className="flex gap-2">
                      {([["both","הלוך וחזור"],["outbound","הלוך בלבד"],["return","חזור בלבד"]] as const).map(([k,label]) => (
                        <button key={k} onClick={() => setTDirection(k)}
                          className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all
                            ${tDirection === k ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-500 hover:border-blue-200"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Passengers */}
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">נוסעים</div>
                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2 w-fit">
                      <button onClick={() => setTPassengers(v => Math.max(1, v - 1))}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">−</button>
                      <span className="font-black text-gray-900 text-lg w-6 text-center">{tPassengers}</span>
                      <button onClick={() => setTPassengers(v => Math.min(20, v + 1))}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">+</button>
                      <span className="text-sm text-gray-400">{tPassengers === 1 ? "אדם" : "אנשים"}</span>
                    </div>
                  </div>

                  {/* Inbound fields */}
                  {(tDirection === "both" || tDirection === "outbound") && (
                    <div className="bg-white rounded-xl p-3 border border-blue-100 space-y-2">
                      <div className="text-xs font-bold text-gray-500 mb-1">✈️ טיסת הלוך — נחיתה בשדה התעופה</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">שדה תעופה</label>
                          <select value={tAirportIn} onChange={e => setTAirportIn(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option value="GVA">Geneva (GVA)</option>
                            <option value="LYS">Lyon (LYS)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">שעת נחיתה</label>
                          <input type="time" value={tArrival} onChange={e => setTArrival(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-400 block mb-1">מספר טיסה</label>
                          <input type="text" value={tFlightIn} onChange={e => setTFlightIn(e.target.value.toUpperCase())}
                            placeholder="LY323 / FR1234"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono" dir="ltr" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Outbound fields */}
                  {(tDirection === "both" || tDirection === "return") && (
                    <div className="bg-white rounded-xl p-3 border border-blue-100 space-y-2">
                      <div className="text-xs font-bold text-gray-500 mb-1">✈️ טיסת חזור — המראה משדה התעופה</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">שדה תעופה</label>
                          <select value={tAirportOut} onChange={e => setTAirportOut(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option value="GVA">Geneva (GVA)</option>
                            <option value="LYS">Lyon (LYS)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">שעת המראה</label>
                          <input type="time" value={tDeparture} onChange={e => setTDeparture(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-400 block mb-1">מספר טיסה</label>
                          <input type="text" value={tFlightOut} onChange={e => setTFlightOut(e.target.value.toUpperCase())}
                            placeholder="LY324 / FR1235"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono" dir="ltr" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price note */}
                  {isElAlChecked ? (
                    <div className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3 border border-green-200 font-semibold flex justify-between items-center">
                      <span>✓ מחיר מאושר — אל על ישיר</span>
                      <span className="font-black">€{TRANSFER_PP} × {tDirs} × {tPassengers} = €{trPrice}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-200">
                      ⚠ הצעת מחיר להסעה תשלח בהקדם (מחיר ממוצע ~€{TRANSFER_PP} לאדם לכיוון)
                    </div>
                  )}
                </div>
              )}

              {/* Skyscanner suggestion */}
              <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <IconPlane size={15} className="text-gray-400" />
                  טרם הזמנת טיסה? חפש TLV → Geneva
                </div>
                <span className="text-xs font-bold text-blue-600">Skyscanner ←</span>
              </a>
            </Section>

            {/* Cancellation Policy */}
            <Section title="מדיניות ביטול" icon={<IconShield size={18} />}>
              <div className="space-y-2">
                <button onClick={() => setCancelSafe("none")}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-right
                    ${cancel === "none" ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                    ${cancel === "none" ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
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
                className="mt-3 text-xs text-blue-600 hover:underline block text-center">
                ← קרא את מדיניות הביטול המלאה
              </a>
            </Section>

            {/* Service Level */}
            <Section title="רמת שירות" icon={<IconUser size={18} />}>
              <div className="space-y-2">
                <button onClick={() => setServiceSafe("human")}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-right
                    ${service === "human" ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                    ${service === "human" ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
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

            {/* Insurance */}
            <Section title="ביטוח" icon={<IconShield size={18} />}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-700">ביטוח סקי + נסיעות</div>
                  <div className="text-xs text-gray-400 mt-0.5">ביטול, רפואי, ציוד, חילוץ הר</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">8% מהחבילה</span>
                  <button onClick={() => setInsurance(!insurance)}
                    className={`w-12 h-6 rounded-full transition-all relative ${insurance ? "bg-blue-600" : "bg-gray-200"}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${insurance ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            </Section>

            {/* Personal Details */}
            <Section title="פרטים אישיים" icon={<IconUser size={18} />}>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">שם מלא *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">טלפון</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+972-50-000-0000" type="tel"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">אימייל *</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="israel@example.com" type="email"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">הערות</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="בקשות מיוחדות..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
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
                    {insurance && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">ביטוח (8%)</span>
                        <span className="font-semibold">€{insPrice.toLocaleString()}</span>
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-none" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">שם בעל הכרטיס</label>
                  <input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="ISRAEL ISRAELI"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" dir="ltr" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">תוקף</label>
                    <input value={cardExpiry}
                      onChange={e => setCardExpiry(fmtExpiry(e.target.value))}
                      placeholder="MM/YY" maxLength={5}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-center focus:ring-2 focus:ring-blue-500 focus:outline-none" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">CVV</label>
                    <input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,"").slice(0,4))}
                      placeholder="123" maxLength={4}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-center focus:ring-2 focus:ring-blue-500 focus:outline-none" dir="ltr" />
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
                    ${terms ? "bg-blue-600 border-blue-600" : "border-gray-300 hover:border-blue-400"}`}
                    onClick={() => setTerms(!terms)}>
                    {terms && <IconCheck size={12} className="text-white" />}
                  </div>
                  <span className="text-xs text-gray-600 leading-relaxed">
                    קראתי ואני מאשר את{" "}
                    <a href="/cancellation-policy" target="_blank" className="text-blue-600 hover:underline">תנאי השירות ומדיניות הביטול</a>
                    {" "}של MySki
                  </span>
                </label>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3 text-center">{error}</div>
                )}

                <button onClick={submit} disabled={submitting || !terms}
                  className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-base transition-colors shadow-sm">
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
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookPage />
    </Suspense>
  );
}
