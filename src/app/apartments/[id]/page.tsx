"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import type { Apartment } from "@/types";
import { calcTotalForRange, getEffectivePrice } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import {
  IconMountain, IconSkis, IconBus, IconPlane, IconShield, IconUser, IconBot,
  IconCheck, IconStar, IconCalendar, IconChevronLeft, IconWifi, IconFire,
  IconParking, IconBed, IconSnowflake, IconWhatsApp,
} from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";
import CardPaymentButton from "@/components/CardPaymentButton";
import FlightDetailsModal, { EMPTY_FLIGHT, flightToString, flightFilled, type Flight } from "@/components/FlightDetailsModal";
import SaveTripButton from "@/components/SaveTripButton";
import Logo from "@/components/Logo";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`; };

const SKI_DAY_PRICE  = 70;
const TRANSFER_PRICE = 180;
const FLEXIBLE_EXTRA = 100; // per person (legacy)
const CANCEL_FLEX    = 100; // flexible cancellation surcharge (flat)
const CANCEL_NONE    = 100; // no-cancellation discount (flat)
const AI_DISCOUNT    = 50;  // per person

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi":       <IconWifi size={15} />,
  "אח":         <IconFire size={15} />,
  "חניה":       <IconParking size={15} />,
  "ג'קוזי":     <IconSnowflake size={15} />,
};
const amenityIcon = (a: string) => AMENITY_ICONS[a] ?? <IconCheck size={15} />;

/* ── Toggle row ───────────────────────────────────────────── */
function ToggleRow({ icon, label, sublabel, price, checked, onChange, disabled }: {
  icon: React.ReactNode; label: string; sublabel?: string;
  price?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-right transition-all
        ${disabled ? "border-gray-100 bg-gray-50 cursor-not-allowed" : checked ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}
    >
      <span className={`flex-shrink-0 ${disabled ? "text-gray-300" : checked ? "text-blue-600" : "text-gray-400"}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${disabled ? "text-gray-400" : "text-gray-800"}`}>{label}</div>
        {sublabel && <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>}
      </div>
      {price && <span className={`text-xs font-bold flex-shrink-0 ${disabled ? "text-blue-500" : "text-gray-600"}`}>{price}</span>}
      {disabled ? (
        <span className="text-[11px] font-bold text-blue-500 flex-shrink-0">בקרוב</span>
      ) : (
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
          ${checked ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
          {checked && <IconCheck size={11} className="text-white" />}
        </div>
      )}
    </button>
  );
}

/* ── Radio option ─────────────────────────────────────────── */
function RadioOption({ icon, label, sublabel, badge, badgeColor, selected, onClick }: {
  icon: React.ReactNode; label: string; sublabel: string;
  badge?: string; badgeColor?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-right transition-all
        ${selected ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}
    >
      <span className={`mt-0.5 flex-shrink-0 ${selected ? "text-blue-600" : "text-gray-400"}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          {badge && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: badgeColor }}>
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>
      </div>
      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0
        ${selected ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
        {selected && <div className="w-2.5 h-2.5 bg-white rounded-full mx-auto mt-0.5" />}
      </div>
    </button>
  );
}

/* ── Image gallery ───────────────────────────────────────── */
function Gallery({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  const imgs = images?.length ? images : ["/apt1.jpg", "/apt2.jpg", "/apt3.jpg"];

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-72 md:h-96 group">
      <img src={imgs[idx]} alt={name} className="w-full h-full object-cover transition-all duration-500" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 50%)" }} />

      {/* Thumbnails strip */}
      {imgs.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {imgs.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`} />
          ))}
        </div>
      )}

      {/* Arrows */}
      {imgs.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + imgs.length) % imgs.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
            <IconChevronLeft size={18} className="rotate-180" />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % imgs.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
            <IconChevronLeft size={18} />
          </button>
        </>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
function ApartmentPage() {
  const { id }     = useParams<{ id: string }>();
  const params     = useSearchParams();
  const router     = useRouter();
  const checkin    = params.get("checkin")  ?? "";
  const checkout   = params.get("checkout") ?? "";
  const guests     = parseInt(params.get("guests") ?? "2");

  const [apt,           setApt]           = useState<Apartment | null>(null);
  const [rules,         setRules]         = useState<PricingRule[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [copied, setCopied] = useState(false);

  // Add-ons
  const [skiPass,  setSkiPass]  = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  const [flight, setFlight] = useState<Flight>(EMPTY_FLIGHT);

  // Cancellation: "regular" (per terms) | "none" (-€100, signed) | "flexible" (+€100)
  const [cancel, setCancel] = useState<"regular" | "none" | "flexible">("regular");
  const [showNoCancel, setShowNoCancel] = useState(false);
  const [noCancelAgreed, setNoCancelAgreed] = useState(false);
  const [signature, setSignature] = useState("");

  // Service: "human" | "ai"
  const [service, setService] = useState<"human" | "ai">("human");
  const [showAiInfo, setShowAiInfo] = useState(false);

  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : 7;

  useEffect(() => {
    Promise.all([
      fetch(`/api/apartments/${id}`).then(r => r.json()),
      fetch(`/api/pricing-rules?apartment_id=${id}`).then(r => r.json()),
    ]).then(([d, r]) => {
      setApt(d);
      setRules(Array.isArray(r) ? r : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  /* ── Flight URLs with actual dates ─────────────────────── */
  const fmtSky = (s: string) => {
    if (!s) return "";
    const d = new Date(s);
    return `${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  };
  const skyscannerUrl = checkin && checkout
    ? `https://www.skyscanner.co.il/transport/flights/tlv/gva/${fmtSky(checkin)}/${fmtSky(checkout)}/?adultsv2=${guests}&cabinclass=economy&childrenv2=&rtn=1`
    : `https://www.skyscanner.co.il/transport/flights/tlv/gva/`;

  /* ── Price calculation ──────────────────────────────────── */
  const basePrice = apt?.price_per_night ?? 0;
  const aptTotal  = apt
    ? (checkin && checkout ? calcTotalForRange(checkin, checkout, basePrice, rules) : basePrice * nights)
    : 0;

  /* Per-night breakdown for the collapsible panel */
  const breakdown = (() => {
    if (!apt || !checkin || !checkout) return [] as { date: Date; price: number }[];
    const out: { date: Date; price: number }[] = [];
    const end = new Date(checkout + "T12:00:00");
    for (let d = new Date(checkin + "T12:00:00"); d < end; d.setDate(d.getDate() + 1))
      out.push({ date: new Date(d), price: getEffectivePrice(new Date(d), basePrice, rules) });
    return out;
  })();

  const avgNightlyPrice = breakdown.length > 0 ? Math.round(aptTotal / nights) : basePrice;
  const skiTotal        = 0; // Coming soon — price not yet available
  const trTotal         = transfer ? TRANSFER_PRICE : 0;
  const flexExtra       = cancel  === "flexible" ? CANCEL_FLEX : 0;
  const noCancelDiscount = cancel === "none"     ? -CANCEL_NONE : 0;
  const aiDiscount      = service === "ai"       ? -(AI_DISCOUNT * guests) : 0;
  const grandTotal      = aptTotal + skiTotal + trTotal + flexExtra + noCancelDiscount + aiDiscount;
  const transferDetails = transfer ? flightToString(flight) : "";
  const shareAccommodation = Math.round(aptTotal / splitCount);
  const payNow = splitCount > 1 ? shareAccommodation + trTotal + flexExtra + noCancelDiscount + aiDiscount : grandTotal;

  /* ── Long fallback quote URL (works without DB) ─────────── */
  const buildQuoteUrl = () => {
    const p = new URLSearchParams({
      apartment_id: id,
      apartment: apt?.name ?? id,
      checkin, checkout,
      guests: String(guests),
      ski_pass: String(skiPass),
      transfer: String(transfer),
      cancel,
      service,
      nights: String(nights),
      apt_total: String(aptTotal),
      grand_total: String(grandTotal),
    });
    return `/quote?${p}`;
  };

  /* ── Pretty slug: apartment name → URL-friendly segment ── */
  const nameSlug = (apt?.name ?? "quote").trim().replace(/\s+/g, "-").replace(/[/?#&]/g, "");

  /* ── WhatsApp booking link with full configuration ──────── */
  const waBookHref = buildWaHref({
    intro: "היי! 👋 אני רוצה להזמין את החבילה הבאה:",
    lines: [
      `🏔️ דירה: ${apt?.name ?? ""}`,
      checkin && checkout ? `📅 תאריכים: ${fmtDate(checkin)} — ${fmtDate(checkout)} (${nights} לילות)` : `🗓️ ${nights} לילות`,
      `👥 אורחים: ${guests}`,
      transfer ? `🚐 כולל הסעה הלוך-חזור${transferDetails ? ` (${transferDetails})` : ""}` : null,
      cancel === "flexible" ? "✅ מדיניות ביטול גמישה" : cancel === "none" ? "🔒 ללא אפשרות ביטול" : null,
      skiPass ? "🎿 מעוניין/ת גם בסקי פס" : null,
      service === "ai" ? "🤖 ניהול עצמאי (AI)" : null,
    ],
    total: grandTotal,
  });

  /* ── Create a short shareable quote link, fall back to long URL ── */
  const handleSendQuote = async () => {
    setCreatingQuote(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartment_id: id,
          apartment: apt?.name ?? id,
          checkin, checkout, guests, nights,
          ski_pass: skiPass, transfer, cancel, service,
          apt_total: aptTotal, grand_total: grandTotal,
        }),
      });
      if (!res.ok) throw new Error("no table");
      const { id: shortId } = await res.json();
      router.push(`/q/${encodeURIComponent(nameSlug)}/${shortId}`);
    } catch {
      // DB/table not ready → use the long URL so nothing breaks
      router.push(buildQuoteUrl());
    } finally {
      setCreatingQuote(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!apt) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 text-lg" dir="rtl">
      דירה לא נמצאה
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── Top nav ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="flex items-center"><Logo className="h-9" /></a>
          <span className="text-gray-200 text-lg font-light">/</span>
          <a href={`/search?checkin=${checkin}&checkout=${checkout}&guests=${guests}`}
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors">תוצאות חיפוש</a>
          <span className="text-gray-200 text-lg font-light">/</span>
          <span className="text-sm text-gray-700 font-semibold truncate">{apt.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT: apartment details ────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Gallery */}
            <Gallery images={apt.images} name={apt.name} />

            {/* Header */}
            <div className="mt-6 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs font-bold tracking-widest uppercase text-blue-600 mb-1">{apt.type}</div>
                  <h1 className="text-3xl font-black text-gray-900">{apt.name}</h1>
                  <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-sm">
                    <IconMountain size={14} className="text-blue-500" />
                    Val Thorens, Trois Vallées, France
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-4 py-2.5 rounded-xl">
                  <IconStar size={16} className="text-amber-400" />
                  <span className="font-black text-gray-900">4.9</span>
                  <span className="text-gray-400 text-sm">· 47 ביקורות</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex gap-5 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><IconBed size={15} className="text-gray-400" />{apt.beds} חדרי שינה</span>
                <span>·</span>
                <span>{apt.baths} חדרי רחצה</span>
                <span>·</span>
                <span>{apt.sqm} מ״ר</span>
              </div>
            </div>

            {/* Description */}
            {apt.description && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h2 className="text-lg font-black text-gray-900 mb-3">על הדירה</h2>
                <p className="text-gray-600 leading-relaxed text-sm">{apt.description}</p>
              </div>
            )}

            {/* Amenities */}
            {apt.amenities?.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h2 className="text-lg font-black text-gray-900 mb-4">מה כלול</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {apt.amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <span className="text-blue-500">{amenityIcon(a)}</span>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-3">מיקום</h2>
              <div className="bg-blue-50 rounded-2xl p-5 text-sm text-gray-600 border border-blue-100">
                <div className="flex items-center gap-2 font-bold text-gray-800 mb-1">
                  <IconMountain size={16} className="text-blue-600" />
                  Val Thorens
                </div>
                <p>הכפר הגבוה ביותר באירופה · 2,300 מ׳ · שלג מובטח נובמבר–מאי · גישה ישירה ל-600 ק״מ מסלולים</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: booking sidebar ─────────────────────────── */}
          <div className="lg:w-[400px] flex-shrink-0">
            <div className="sticky top-20">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">

                {/* Price header */}
                <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-gray-50 to-blue-50 border-b border-gray-100">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="text-3xl font-black text-gray-900">
                        €{avgNightlyPrice.toLocaleString()}
                        <span className="text-base font-medium text-gray-400">
                          {breakdown.length > 1 ? " / לילה ממוצע" : " / לילה"}
                        </span>
                      </div>
                    </div>
                    {breakdown.length > 0 && (
                      <button
                        onClick={() => setShowBreakdown(v => !v)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                      >
                        פירוט מחיר {showBreakdown ? "▲" : "▼"}
                      </button>
                    )}
                  </div>

                  {/* Per-night breakdown panel */}
                  {showBreakdown && breakdown.length > 0 && (
                    <div className="mt-3 bg-white rounded-xl border border-blue-100 overflow-hidden">
                      <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
                        {breakdown.map(({ date, price }, i) => (
                          <div key={i} className="flex justify-between items-center px-4 py-2 text-sm">
                            <span className="text-gray-500">{fmtDate(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`)}</span>
                            <span className={`font-semibold ${price !== basePrice ? "text-blue-600" : "text-gray-800"}`}>
                              €{price.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      {breakdown.length > 1 && (
                        <div className="flex justify-between items-center px-4 py-2.5 bg-blue-50 border-t border-blue-100 text-sm font-bold">
                          <span className="text-gray-600">ממוצע ללילה</span>
                          <span className="text-blue-700">€{avgNightlyPrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {checkin && checkout && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                      <IconCalendar size={14} />
                      {fmtDate(checkin)} — {fmtDate(checkout)} · {nights} לילות · {guests} אנשים
                    </div>
                  )}
                </div>

                <div className="px-6 py-5 flex flex-col gap-5">

                  {/* ── Ski Pass ──────────────────────────────────── */}
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">תוספות</div>
                    <div className="flex flex-col gap-2">
                      <ToggleRow
                        icon={<IconSkis size={18} />}
                        label="סקי פס · Trois Vallées"
                        sublabel="600 ק״מ מסלולים · כל הרמות · איסוף עצמאי מהמכונה"
                        checked={skiPass} onChange={setSkiPass}
                        disabled
                      />
                      <ToggleRow
                        icon={<IconBus size={18} />}
                        label="הסעה הלוך-חזור"
                        sublabel="שאטל ישיר משדה התעופה"
                        price={`+€${TRANSFER_PRICE}`}
                        checked={transfer} onChange={setTransfer}
                      />
                      {transfer && (
                        <button onClick={() => setShowTransfer(true)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors text-sm w-full text-right">
                          <span className="text-blue-700 font-semibold">{flightFilled(flight) ? "✓ פרטי טיסה נשמרו · עריכה" : "מלא פרטי טיסה להסעה ←"}</span>
                          <span className="text-xs text-blue-400">מספר טיסה · שעה · תאריך</span>
                        </button>
                      )}
                    </div>
                    <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-2.5 p-3.5 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50 transition-all">
                      <span className="text-gray-400 flex-shrink-0"><IconPlane size={17} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800">טיסה ל-Geneva (GVA)</div>
                        <div className="text-xs text-gray-400">TLV → Geneva · {checkin ? fmtDate(checkin) : "בחר תאריך"} · 2.5h מ-Val Thorens</div>
                      </div>
                      <span className="text-xs font-bold text-blue-600 flex-shrink-0">Skyscanner ←</span>
                    </a>
                  </div>

                  {/* ── Cancellation policy ───────────────────────── */}
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">מדיניות ביטול</div>
                    <div className="flex flex-col gap-2">
                      <RadioOption
                        icon={<IconShield size={18} />}
                        label="ביטול רגיל"
                        sublabel="בהתאם לתנאי התקנון · מחיר רגיל"
                        selected={cancel === "regular"}
                        onClick={() => setCancel("regular")}
                      />
                      <RadioOption
                        icon={<IconShield size={18} />}
                        label="ללא אפשרות ביטול"
                        sublabel="מחיר מוזל · לא ניתן לבטל ואין החזר כספי"
                        badge={`−€${CANCEL_NONE}`}
                        badgeColor="#ef4444"
                        selected={cancel === "none"}
                        onClick={() => { setShowNoCancel(true); }}
                      />
                      <RadioOption
                        icon={<IconShield size={18} />}
                        label="ביטול גמיש"
                        sublabel="80% החזר עד שבוע לפני · 50% עד 24ש׳ לפני ההמראה · אח״כ אין החזר"
                        badge={`+€${CANCEL_FLEX}`}
                        badgeColor="#10b981"
                        selected={cancel === "flexible"}
                        onClick={() => setCancel("flexible")}
                      />
                    </div>
                    <a href="/terms" target="_blank" className="inline-block mt-2 text-xs text-blue-600 hover:underline font-semibold">קרא/י את מדיניות הביטולים בתקנון ←</a>
                  </div>

                  {/* ── Service level ─────────────────────────────── */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">רמת שירות</div>
                      <button onClick={() => setShowAiInfo(true)} className="text-xs font-semibold text-blue-600 hover:underline">ⓘ מידע נוסף</button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <RadioOption
                        icon={<IconUser size={18} />}
                        label="שירות אנושי מלא"
                        sublabel="נציג ישראלי זמין לפני, במהלך ואחרי"
                        selected={service === "human"}
                        onClick={() => setService("human")}
                      />
                      <RadioOption
                        icon={<IconBot size={18} />}
                        label="AI בלבד"
                        sublabel="ניהול עצמאי עם תמיכת צ'אטבוט · איסוף עצמאי של הסקי פס"
                        badge={`-€${AI_DISCOUNT}/אדם`}
                        badgeColor="#6366f1"
                        selected={service === "ai"}
                        onClick={() => setService("ai")}
                      />
                    </div>
                  </div>

                  {/* ── Price breakdown ───────────────────────────── */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">סיכום מחיר</div>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">לינה × {nights} לילות</span>
                        <span className="font-semibold text-gray-800">€{aptTotal.toLocaleString()}</span>
                      </div>
                      {skiPass && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">סקי פס × {guests} × {nights} ימים</span>
                          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">בקרוב</span>
                        </div>
                      )}
                      {transfer && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">הסעה הלוך-חזור</span>
                          <span className="font-semibold text-gray-800">€{TRANSFER_PRICE}</span>
                        </div>
                      )}
                      {cancel === "flexible" && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">ביטול גמיש</span>
                          <span className="font-semibold text-gray-800">€{flexExtra.toLocaleString()}</span>
                        </div>
                      )}
                      {cancel === "none" && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">ללא אפשרות ביטול</span>
                          <span className="font-semibold text-emerald-600">−€{CANCEL_NONE.toLocaleString()}</span>
                        </div>
                      )}
                      {service === "ai" && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">הנחת AI × {guests}</span>
                          <span className="font-semibold text-indigo-600">−€{(AI_DISCOUNT * guests).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-3">
                      <span className="font-black text-gray-900">סה״כ</span>
                      <span className="text-2xl font-black text-gray-900">€{grandTotal.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">* ייתכנו עמלות נוספות (כגון עמלת סליקת אשראי 1.9%). המחירים ב-€ והחיוב בש״ח לפי שער ההמרה.</p>
                  </div>

                  {/* ── Split payment ─────────────────────────────── */}
                  <div className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-800">כמה אנשים משלמים?</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSplitCount(n => Math.max(1, n - 1))}
                          className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-600 font-bold">−</button>
                        <span className="font-black text-gray-900 w-5 text-center">{splitCount}</span>
                        <button onClick={() => setSplitCount(n => Math.min(8, n + 1))}
                          className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-600 font-bold">+</button>
                      </div>
                    </div>
                    {splitCount > 1 ? (
                      <div className="bg-blue-50 rounded-lg px-3 py-2.5 text-sm">
                        <div className="flex justify-between text-blue-900 font-bold">
                          <span>החלק שלך לתשלום עכשיו</span>
                          <span>€{payNow.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1 leading-relaxed">מחיר הדירה (€{aptTotal.toLocaleString()}) מתחלק ל-{splitCount} · אחרי התשלום תקבל/י קישור לשלוח לחברים שישלמו את חלקם.</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">בחר/י יותר מאדם אחד כדי לפצל את התשלום בין כמה משלמים.</p>
                    )}
                  </div>

                  {/* ── CTA ───────────────────────────────────────── */}
                  <CardPaymentButton apartmentId={id} apartment={apt?.name ?? ""} checkin={checkin} checkout={checkout}
                    guests={guests} nights={nights} skiPass={skiPass} transfer={transfer} cancel={cancel} service={service}
                    transferDetails={transferDetails}
                    grandTotal={payNow}
                    split={splitCount > 1 ? { sharesTotal: splitCount, accommodationTotal: aptTotal, shareAmount: shareAccommodation, area: "Val Thorens, Trois Vallées" } : undefined}
                    label={splitCount > 1 ? "שלם/י את חלקך בכרטיס" : undefined}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-center text-base transition-colors shadow-sm" />

                  {/* save + quote side by side */}
                  <div className="flex gap-2">
                    <SaveTripButton apartmentId={id} checkin={checkin} checkout={checkout} guests={guests}
                      label="מועדפים"
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 text-gray-700 font-bold text-center text-sm transition-colors" />
                    <button onClick={handleSendQuote} disabled={creatingQuote}
                      className="flex-1 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-center text-sm transition-colors disabled:opacity-60">
                      {creatingQuote ? "יוצר…" : "📋 הצעת מחיר"}
                    </button>
                  </div>

                  {/* copy link */}
                  <button onClick={() => { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="block w-full py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-center text-sm transition-colors">
                    {copied ? "✓ הקישור הועתק — שלח/י לחברים" : "🔗 העתק קישור לשיתוף"}
                  </button>

                  {/* small contact rep */}
                  <a href={waBookHref} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-sm text-[#1ebe5a] font-bold hover:underline pt-1">
                    <IconWhatsApp size={16} /> צור קשר עם נציג
                  </a>

                  <p className="text-center text-xs text-gray-400">
                    {cancel === "flexible" ? "80% החזר עד שבוע לפני · 50% עד 24ש׳" : cancel === "none" ? "לא ניתן לביטול — אישרת בחתימה" : "ביטול בהתאם לתנאי התקנון"}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── No-cancellation confirmation + signature ───────────── */}
      {showNoCancel && (
        <div dir="rtl" className="fixed inset-0 z-[95] bg-black/55 flex items-center justify-center p-4" onClick={() => setShowNoCancel(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl font-black text-slate-900 mb-1">ללא אפשרות ביטול</h2>
            <p className="text-sm text-slate-500 mb-4">בחירה באפשרות זו מוזילה את המחיר ב-€{CANCEL_NONE}, אך ההזמנה <b>אינה ניתנת לביטול</b> ולא יינתן כל החזר כספי, בהתאם לתקנון.</p>
            <label className="flex items-start gap-2 cursor-pointer mb-4">
              <input type="checkbox" checked={noCancelAgreed} onChange={e => setNoCancelAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-600" />
              <span className="text-sm text-slate-600 leading-relaxed">אני מאשר/ת שקראתי והבנתי כי <b>לא אוכל לבטל את ההזמנה</b> ולא אקבל החזר כספי בשום מקרה, ומסכים/ה ל<a href="/terms" target="_blank" className="text-blue-600 underline">תקנון</a>.</span>
            </label>
            <label className="block text-xs font-bold text-gray-400 mb-1">חתימה (שם מלא)</label>
            <input value={signature} onChange={e => setSignature(e.target.value)} placeholder="הקלד/י את שמך המלא כחתימה"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2">
              <button disabled={!noCancelAgreed || signature.trim().length < 2}
                onClick={() => { setCancel("none"); setShowNoCancel(false); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">אישור וחתימה</button>
              <button onClick={() => setShowNoCancel(false)} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer flight details ────────────────────────────── */}
      <FlightDetailsModal open={showTransfer} onClose={() => setShowTransfer(false)} value={flight} onChange={setFlight} />

      {/* ── AI service info ────────────────────────────────────── */}
      {showAiInfo && (
        <div dir="rtl" className="fixed inset-0 z-[95] bg-black/55 flex items-center justify-center p-4" onClick={() => setShowAiInfo(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-black text-slate-900">שירות AI — איך זה עובד?</h2>
              <button onClick={() => setShowAiInfo(false)} className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 text-xl">✕</button>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <li className="flex gap-2"><span>📍</span><span>תקבל/י את הכתובת המלאה וחוקי הצ׳ק-אין / צ׳ק-אאוט.</span></li>
              <li className="flex gap-2"><span>🔑</span><span>המפתחות יחכו לך בדלת כ-48 שעות לפני ההגעה. את הדירה יש לפנות לפי שעות הצ׳ק-אאוט הרגילות.</span></li>
              <li className="flex gap-2"><span>🎿</span><span>אם הזמנת סקי פס — תאסוף/י אותו עצמאית מהמכונה במהלך השהות.</span></li>
              <li className="flex gap-2"><span>🤖</span><span>לאורך החופשה תיעזר/י בצ׳אטבוט AI לכל שאלה.</span></li>
              <li className="flex gap-2"><span>🆘</span><span>במקרים חריגים (קבלת דירה עם נזק, מקרה קיצון) תוכל/י כמובן לפנות לנציגים שלנו דרך האתר.</span></li>
            </ul>
            <button onClick={() => setShowAiInfo(false)} className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition">הבנתי</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApartmentPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ApartmentPage />
    </Suspense>
  );
}
