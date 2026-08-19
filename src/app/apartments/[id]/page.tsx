"use client";
import SkiLoader from "@/components/SkiLoader";
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

const SITE_URL = "https://skisharebook.com";
const SKI_DAY_PRICE  = 70;
const TRANSFER_PRICE = 180;
// ski equipment rental: €30/night under a week · €120 for a week · +€20 each extra night
const equipCost = (n: number) => (n <= 0 ? 0 : n < 6 ? 30 * n : 120 + 20 * (n - 6));
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
      className="w-full flex items-center gap-3 p-3.5 border text-right transition-all"
      style={{
        borderRadius: 4,
        borderColor: disabled ? "rgba(28,27,23,0.08)" : checked ? "var(--gold)" : "rgba(28,27,23,0.1)",
        background: disabled ? "var(--ivory-deep)" : checked ? "var(--gold-wash)" : "var(--paper)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span className="flex-shrink-0" style={{ color: disabled ? "var(--stone-soft)" : checked ? "var(--gold-deep)" : "var(--stone-soft)" }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: disabled ? "var(--stone-soft)" : "var(--charcoal)" }}>{label}</div>
        {sublabel && <div className="text-xs mt-0.5 text-[var(--stone-soft)]">{sublabel}</div>}
      </div>
      {price && <span className="text-xs font-bold flex-shrink-0" style={{ color: disabled ? "var(--gold-deep)" : "var(--stone)" }}>{price}</span>}
      {disabled ? (
        <span className="text-[11px] font-bold flex-shrink-0 text-[var(--gold-deep)]">בקרוב</span>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
          style={{ borderColor: checked ? "var(--gold)" : "rgba(28,27,23,0.2)", background: checked ? "var(--gold)" : "transparent" }}>
          {checked && <IconCheck size={11} className="text-[var(--ink)]" />}
        </div>
      )}
    </button>
  );
}

/* ── Quantity stepper (how many people need this add-on) ──── */
function QtyStepper({ show, label, qty, setQty, max, total }: {
  show: boolean; label: string; qty: number; setQty: (n: number) => void; max: number; total: number;
}) {
  if (!show) return null;
  return (
    <div className="flex items-center justify-between px-3.5 py-2 -mt-1.5 mb-1 border border-t-0"
      style={{ borderRadius: "0 0 4px 4px", background: "var(--gold-wash)", borderColor: "var(--gold-line)" }}>
      <span className="text-xs font-bold text-[var(--gold-deep)]">{label}</span>
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}
          className="w-7 h-7 rounded-full border font-black disabled:opacity-40 leading-none"
          style={{ background: "var(--paper)", borderColor: "var(--gold-line)", color: "var(--gold-deep)" }}>−</button>
        <span className="font-black w-5 text-center text-[var(--charcoal)]">{qty}</span>
        <button type="button" onClick={() => setQty(Math.min(max, qty + 1))} disabled={qty >= max}
          className="w-7 h-7 rounded-full border font-black disabled:opacity-40 leading-none"
          style={{ background: "var(--paper)", borderColor: "var(--gold-line)", color: "var(--gold-deep)" }}>+</button>
        <span className="text-xs font-bold w-16 text-left text-[var(--charcoal)]">= €{total.toLocaleString()}</span>
      </div>
    </div>
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
      className="w-full flex items-start gap-3 p-3.5 border text-right transition-all"
      style={{
        borderRadius: 4,
        borderColor: selected ? "var(--gold)" : "rgba(28,27,23,0.1)",
        background: selected ? "var(--gold-wash)" : "var(--paper)",
      }}
    >
      <span className="mt-0.5 flex-shrink-0" style={{ color: selected ? "var(--gold-deep)" : "var(--stone-soft)" }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[var(--charcoal)]">{label}</span>
          {badge && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: badgeColor }}>
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs mt-0.5 text-[var(--stone-soft)]">{sublabel}</div>
      </div>
      <div className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0"
        style={{ borderColor: selected ? "var(--gold)" : "rgba(28,27,23,0.2)", background: selected ? "var(--gold)" : "transparent" }}>
        {selected && <div className="w-2.5 h-2.5 rounded-full mx-auto mt-0.5" style={{ background: "var(--ink)" }} />}
      </div>
    </button>
  );
}

/* ── Image gallery ───────────────────────────────────────── */
function Gallery({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  const imgs = images?.length ? images : ["/apt1.jpg", "/apt2.jpg", "/apt3.jpg"];

  return (
    <div className="relative overflow-hidden h-80 md:h-[30rem] group" style={{ borderRadius: 4, background: "var(--ivory-deep)" }}>
      <img src={imgs[idx]} alt={name} className="w-full h-full object-cover transition-all duration-500" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,15,20,0.55) 0%, transparent 45%)" }} />

      {/* Thumbnails strip */}
      {imgs.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {imgs.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{ background: i === idx ? "var(--gold-light)" : "rgba(255,255,255,0.45)", transform: i === idx ? "scale(1.25)" : "scale(1)" }} />
          ))}
        </div>
      )}

      {/* Arrows */}
      {imgs.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + imgs.length) % imgs.length)} aria-label="הקודם"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            style={{ background: "rgba(11,15,20,0.5)", color: "var(--ivory)" }}>
            <IconChevronLeft size={18} className="rotate-180" />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % imgs.length)} aria-label="הבא"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
            style={{ background: "rgba(11,15,20,0.5)", color: "var(--ivory)" }}>
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [quoteUrl, setQuoteUrl] = useState<string | null>(null);
  const [qCopied, setQCopied] = useState("");

  // Add-ons
  const [skiPass,  setSkiPass]  = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [equipment, setEquipment] = useState(false);
  const [transferQty, setTransferQty] = useState(1); // how many people need transfer
  const [equipQty, setEquipQty] = useState(1);       // how many people need equipment
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
  // add-ons are per-person: price × number of people who need each add-on
  const trTotal         = transfer ? TRANSFER_PRICE * transferQty : 0;
  const equipTotal      = equipment ? equipCost(nights) * equipQty : 0;
  const flexExtra       = cancel  === "flexible" ? CANCEL_FLEX : 0;
  const noCancelDiscount = cancel === "none"     ? -CANCEL_NONE : 0;
  const aiDiscount      = service === "ai"       ? -AI_DISCOUNT : 0;
  const grandTotal      = aptTotal + skiTotal + trTotal + equipTotal + flexExtra + noCancelDiscount + aiDiscount;
  const transferDetails = transfer ? flightToString(flight) : "";
  // split: divide the FULL total (lodging + all add-ons) equally between payers
  const shareAccommodation = Math.round(grandTotal / splitCount);
  const payNow = splitCount > 1 ? shareAccommodation : grandTotal;

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
      transfer ? `🚐 הסעה הלוך-חזור ל-${transferQty} אנשים (€${trTotal})${transferDetails ? ` · ${transferDetails}` : ""}` : null,
      equipment ? `🎿 השכרת ציוד ל-${equipQty} אנשים (€${equipTotal})` : null,
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
      setQuoteUrl(`${SITE_URL}/q/${encodeURIComponent(nameSlug)}/${shortId}`);
    } catch {
      // DB/table not ready → use the long URL so nothing breaks
      setQuoteUrl(SITE_URL + buildQuoteUrl());
    } finally {
      setCreatingQuote(false);
    }
  };

  const copyTo = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setQCopied(key); setTimeout(() => setQCopied(""), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ink)" }}>
      <SkiLoader />
    </div>
  );

  if (!apt) return (
    <div className="min-h-screen flex items-center justify-center text-lg" style={{ background: "var(--ivory)", color: "var(--stone-soft)" }} dir="rtl">
      דירה לא נמצאה
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--ivory)" }} dir="rtl">

      {/* ── Top nav ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-40" style={{ background: "rgba(250,247,241,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(28,27,23,0.08)" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="flex items-center"><Logo className="h-9" /></a>
          <span className="text-lg font-light text-[var(--stone-soft)]">/</span>
          <a href={`/search?checkin=${checkin}&checkout=${checkout}&guests=${guests}`}
            className="text-sm transition-colors text-[var(--stone)]">תוצאות חיפוש</a>
          <span className="text-lg font-light text-[var(--stone-soft)]">/</span>
          <span className="text-sm font-semibold truncate text-[var(--charcoal)]">{apt.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT: apartment details ────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Gallery */}
            <Gallery images={apt.images} name={apt.name} />

            {/* Header */}
            <div className="mt-7 mb-7 pb-7" style={{ borderBottom: "1px solid rgba(28,27,23,0.08)" }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="eyebrow">{apt.type}</span>
                  <h1 className="font-display text-3xl md:text-4xl font-medium mt-2 text-[var(--charcoal)]">{apt.name}</h1>
                  <div className="flex items-center gap-1.5 mt-3 text-sm text-[var(--stone)]">
                    <IconMountain size={14} className="text-[var(--gold-deep)]" />
                    Val Thorens, Trois Vallées, France
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background: "var(--ivory-deep)", borderRadius: 4 }}>
                  <IconStar size={16} className="text-[var(--gold)]" />
                  <span className="font-bold text-[var(--charcoal)]">4.9</span>
                  <span className="text-sm text-[var(--stone-soft)]">· 47 ביקורות</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex gap-5 mt-5 text-sm text-[var(--stone)]">
                <span className="flex items-center gap-1.5"><IconBed size={15} className="text-[var(--stone-soft)]" />{apt.beds} חדרי שינה</span>
                <span>·</span>
                <span>{apt.baths} חדרי רחצה</span>
                <span>·</span>
                <span>{apt.sqm} מ״ר</span>
              </div>
            </div>

            {/* Description */}
            {apt.description && (
              <div className="mb-7 pb-7" style={{ borderBottom: "1px solid rgba(28,27,23,0.08)" }}>
                <h2 className="font-display text-lg font-medium mb-3 text-[var(--charcoal)]">על הדירה</h2>
                <p className={`leading-relaxed text-sm whitespace-pre-line text-[var(--stone)] ${showFullDesc ? "" : "line-clamp-3"}`}>{apt.description}</p>
                {apt.description.length > 180 && (
                  <button onClick={() => setShowFullDesc(v => !v)} className="mt-2 text-sm font-bold hover:underline text-[var(--gold-deep)]">
                    {showFullDesc ? "הצג פחות ↑" : "קרא עוד ←"}
                  </button>
                )}
              </div>
            )}

            {/* Amenities */}
            {apt.amenities?.length > 0 && (
              <div className="mb-7 pb-7" style={{ borderBottom: "1px solid rgba(28,27,23,0.08)" }}>
                <h2 className="font-display text-lg font-medium mb-4 text-[var(--charcoal)]">מה כלול</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {apt.amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-[var(--charcoal)]">
                      <span className="text-[var(--gold-deep)]">{amenityIcon(a)}</span>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* booking choices — inline (mobile + desktop main column) */}
            <div className="lg:hidden p-5 flex flex-col gap-5" style={{ background: "var(--paper)", border: "1px solid rgba(28,27,23,0.08)", borderRadius: 4 }}>
                  {/* ── Ski Pass ──────────────────────────────────── */}
                  <div>
                    <div className="eyebrow mb-2">תוספות</div>
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
                        sublabel="שאטל ישיר משדה התעופה · €180 לאדם"
                        price={`€${TRANSFER_PRICE} לאדם`}
                        checked={transfer} onChange={v => { setTransfer(v); if (v) setTransferQty(Math.min(transferQty || 1, guests) || 1); }}
                      />
                      <QtyStepper show={transfer} label="כמה אנשים צריכים הסעה?" qty={transferQty} setQty={setTransferQty} max={Math.max(guests, 1)} total={trTotal} />
                      <ToggleRow
                        icon={<IconSkis size={18} />}
                        label="השכרת ציוד סקי/סנובורד"
                        sublabel="€30 ליום · €120 לשבוע · +€20 לכל יום נוסף · לאדם"
                        price={nights > 0 ? `€${equipCost(nights)} לאדם` : "החל מ-€30"}
                        checked={equipment} onChange={v => { setEquipment(v); if (v) setEquipQty(Math.min(equipQty || 1, guests) || 1); }}
                      />
                      <QtyStepper show={equipment} label="כמה אנשים צריכים ציוד?" qty={equipQty} setQty={setEquipQty} max={Math.max(guests, 1)} total={equipTotal} />
                      {transfer && (
                        <button onClick={() => setShowTransfer(true)}
                          className="flex items-center justify-between px-3.5 py-2.5 border transition-colors text-sm w-full text-right"
                          style={{ borderRadius: 4, background: "var(--gold-wash)", borderColor: "var(--gold-line)" }}>
                          <span className="font-semibold text-[var(--gold-deep)]">{flightFilled(flight) ? "✓ פרטי טיסה נשמרו · עריכה" : "מלא פרטי טיסה להסעה ←"}</span>
                          <span className="text-xs text-[var(--stone-soft)]">מספר טיסה · שעה · תאריך</span>
                        </button>
                      )}
                    </div>
                    <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-2.5 p-3.5 border transition-all"
                      style={{ borderRadius: 4, borderColor: "rgba(28,27,23,0.1)", background: "var(--paper)" }}>
                      <span className="flex-shrink-0 text-[var(--stone-soft)]"><IconPlane size={17} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--charcoal)]">טיסה ל-Geneva (GVA)</div>
                        <div className="text-xs text-[var(--stone-soft)]">TLV → Geneva · {checkin ? fmtDate(checkin) : "בחר תאריך"} · 2.5h מ-Val Thorens</div>
                      </div>
                      <span className="text-xs font-bold flex-shrink-0 text-[var(--gold-deep)]">Skyscanner ←</span>
                    </a>
                  </div>

                  {/* ── Cancellation policy ───────────────────────── */}
                  <div>
                    <div className="eyebrow mb-2">מדיניות ביטול</div>
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
                        badgeColor="var(--gold-deep)"
                        selected={cancel === "none"}
                        onClick={() => { setShowNoCancel(true); }}
                      />
                      <RadioOption
                        icon={<IconShield size={18} />}
                        label="ביטול גמיש"
                        sublabel="80% החזר עד שבוע לפני · 50% עד 24ש׳ לפני ההמראה · אח״כ אין החזר"
                        badge={`+€${CANCEL_FLEX}`}
                        badgeColor="var(--ink)"
                        selected={cancel === "flexible"}
                        onClick={() => setCancel("flexible")}
                      />
                    </div>
                    <a href="/terms" target="_blank" className="inline-block mt-2 text-xs hover:underline font-semibold text-[var(--gold-deep)]">קרא/י את מדיניות הביטולים בתקנון ←</a>
                  </div>

                  {/* ── Service level ─────────────────────────────── */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="eyebrow">רמת שירות</div>
                      <button onClick={() => setShowAiInfo(true)} className="text-xs font-semibold hover:underline text-[var(--gold-deep)]">ⓘ מידע נוסף</button>
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
                        badge={`-€${AI_DISCOUNT}`}
                        badgeColor="var(--gold-deep)"
                        selected={service === "ai"}
                        onClick={() => setService("ai")}
                      />
                    </div>
                  </div>

            </div>

            {/* Location */}
            <div>
              <h2 className="font-display text-lg font-medium mb-3 text-[var(--charcoal)]">מיקום</h2>
              {apt.map_url ? (
                <a href={apt.map_url} target="_blank" rel="noopener noreferrer"
                  className="block p-5 text-sm transition-all group"
                  style={{ borderRadius: 4, background: "var(--ivory-deep)", border: "1px solid var(--gold-line)", color: "var(--stone)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 font-bold text-[var(--charcoal)]">
                      <IconMountain size={16} className="text-[var(--gold-deep)]" /> Val Thorens
                    </div>
                    <span className="text-xs font-bold group-hover:-translate-x-0.5 transition-transform text-[var(--gold-deep)]">פתח ב-Google Maps ←</span>
                  </div>
                  <p>הכפר הגבוה ביותר באירופה · 2,300 מ׳ · שלג מובטח נובמבר–מאי · גישה ישירה ל-600 ק״מ מסלולים</p>
                </a>
              ) : (
                <div className="p-5 text-sm" style={{ borderRadius: 4, background: "var(--ivory-deep)", border: "1px solid var(--gold-line)", color: "var(--stone)" }}>
                  <div className="flex items-center gap-2 font-bold mb-1 text-[var(--charcoal)]">
                    <IconMountain size={16} className="text-[var(--gold-deep)]" /> Val Thorens
                  </div>
                  <p>הכפר הגבוה ביותר באירופה · 2,300 מ׳ · שלג מובטח נובמבר–מאי · גישה ישירה ל-600 ק״מ מסלולים</p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: booking sidebar (desktop) / bottom sheet (mobile) ── */}
          {sheetOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSheetOpen(false)} />}
          <div className={`lg:w-[400px] lg:flex-shrink-0 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:transition-transform max-lg:duration-300 ${sheetOpen ? "max-lg:translate-y-0" : "max-lg:translate-y-full"}`}>
            <div className="sticky top-20 max-lg:static">
              <button onClick={() => setSheetOpen(false)} className="lg:hidden w-full flex justify-center pt-2 pb-1" aria-label="סגור">
                <span className="block w-10 h-1.5 rounded-full" style={{ background: "rgba(28,27,23,0.15)" }} />
              </button>
              <div className="overflow-hidden max-lg:rounded-b-none max-lg:max-h-[82vh] max-lg:overflow-y-auto"
                style={{ background: "var(--paper)", border: "1px solid rgba(28,27,23,0.08)", borderRadius: 4, boxShadow: "0 24px 48px -24px rgba(11,15,20,0.25)" }}>

                {/* Price header */}
                <div className="px-6 pt-6 pb-5" style={{ background: "var(--ivory-deep)", borderBottom: "1px solid rgba(28,27,23,0.08)" }}>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="font-display text-3xl font-medium text-[var(--charcoal)]">
                        <span className="text-[var(--gold-deep)]">€{avgNightlyPrice.toLocaleString()}</span>
                        <span className="text-base font-medium text-[var(--stone-soft)]">
                          {breakdown.length > 1 ? " / לילה ממוצע" : " / לילה"}
                        </span>
                      </div>
                    </div>
                    {breakdown.length > 0 && (
                      <button
                        onClick={() => setShowBreakdown(v => !v)}
                        className="text-xs font-bold px-3 py-1.5 transition-colors whitespace-nowrap flex-shrink-0"
                        style={{ color: "var(--gold-deep)", background: "var(--gold-wash)", borderRadius: 4 }}
                      >
                        פירוט מחיר {showBreakdown ? "▲" : "▼"}
                      </button>
                    )}
                  </div>

                  {/* Per-night breakdown panel */}
                  {showBreakdown && breakdown.length > 0 && (
                    <div className="mt-3 overflow-hidden" style={{ background: "var(--paper)", border: "1px solid var(--gold-line)", borderRadius: 4 }}>
                      <div className="max-h-52 overflow-y-auto divide-y" style={{ borderColor: "rgba(28,27,23,0.06)" }}>
                        {breakdown.map(({ date, price }, i) => (
                          <div key={i} className="flex justify-between items-center px-4 py-2 text-sm">
                            <span className="text-[var(--stone)]">{fmtDate(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`)}</span>
                            <span className="font-semibold" style={{ color: price !== basePrice ? "var(--gold-deep)" : "var(--charcoal)" }}>
                              €{price.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      {breakdown.length > 1 && (
                        <div className="flex justify-between items-center px-4 py-2.5 text-sm font-bold" style={{ background: "var(--gold-wash)", borderTop: "1px solid var(--gold-line)" }}>
                          <span className="text-[var(--stone)]">ממוצע ללילה</span>
                          <span className="text-[var(--gold-deep)]">€{avgNightlyPrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {checkin && checkout && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-[var(--stone)]">
                      <IconCalendar size={14} />
                      {fmtDate(checkin)} — {fmtDate(checkout)} · {nights} לילות · {guests} אנשים
                    </div>
                  )}
                </div>

                <div className="px-6 py-6 flex flex-col gap-5">

                  <div className="hidden lg:flex flex-col gap-5">
                  {/* ── Ski Pass ──────────────────────────────────── */}
                  <div>
                    <div className="eyebrow mb-2">תוספות</div>
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
                        sublabel="שאטל ישיר משדה התעופה · €180 לאדם"
                        price={`€${TRANSFER_PRICE} לאדם`}
                        checked={transfer} onChange={v => { setTransfer(v); if (v) setTransferQty(Math.min(transferQty || 1, guests) || 1); }}
                      />
                      <QtyStepper show={transfer} label="כמה אנשים צריכים הסעה?" qty={transferQty} setQty={setTransferQty} max={Math.max(guests, 1)} total={trTotal} />
                      <ToggleRow
                        icon={<IconSkis size={18} />}
                        label="השכרת ציוד סקי/סנובורד"
                        sublabel="€30 ליום · €120 לשבוע · +€20 לכל יום נוסף · לאדם"
                        price={nights > 0 ? `€${equipCost(nights)} לאדם` : "החל מ-€30"}
                        checked={equipment} onChange={v => { setEquipment(v); if (v) setEquipQty(Math.min(equipQty || 1, guests) || 1); }}
                      />
                      <QtyStepper show={equipment} label="כמה אנשים צריכים ציוד?" qty={equipQty} setQty={setEquipQty} max={Math.max(guests, 1)} total={equipTotal} />
                      {transfer && (
                        <button onClick={() => setShowTransfer(true)}
                          className="flex items-center justify-between px-3.5 py-2.5 border transition-colors text-sm w-full text-right"
                          style={{ borderRadius: 4, background: "var(--gold-wash)", borderColor: "var(--gold-line)" }}>
                          <span className="font-semibold text-[var(--gold-deep)]">{flightFilled(flight) ? "✓ פרטי טיסה נשמרו · עריכה" : "מלא פרטי טיסה להסעה ←"}</span>
                          <span className="text-xs text-[var(--stone-soft)]">מספר טיסה · שעה · תאריך</span>
                        </button>
                      )}
                    </div>
                    <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-2.5 p-3.5 border transition-all"
                      style={{ borderRadius: 4, borderColor: "rgba(28,27,23,0.1)", background: "var(--paper)" }}>
                      <span className="flex-shrink-0 text-[var(--stone-soft)]"><IconPlane size={17} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--charcoal)]">טיסה ל-Geneva (GVA)</div>
                        <div className="text-xs text-[var(--stone-soft)]">TLV → Geneva · {checkin ? fmtDate(checkin) : "בחר תאריך"} · 2.5h מ-Val Thorens</div>
                      </div>
                      <span className="text-xs font-bold flex-shrink-0 text-[var(--gold-deep)]">Skyscanner ←</span>
                    </a>
                  </div>

                  {/* ── Cancellation policy ───────────────────────── */}
                  <div>
                    <div className="eyebrow mb-2">מדיניות ביטול</div>
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
                        badgeColor="var(--gold-deep)"
                        selected={cancel === "none"}
                        onClick={() => { setShowNoCancel(true); }}
                      />
                      <RadioOption
                        icon={<IconShield size={18} />}
                        label="ביטול גמיש"
                        sublabel="80% החזר עד שבוע לפני · 50% עד 24ש׳ לפני ההמראה · אח״כ אין החזר"
                        badge={`+€${CANCEL_FLEX}`}
                        badgeColor="var(--ink)"
                        selected={cancel === "flexible"}
                        onClick={() => setCancel("flexible")}
                      />
                    </div>
                    <a href="/terms" target="_blank" className="inline-block mt-2 text-xs hover:underline font-semibold text-[var(--gold-deep)]">קרא/י את מדיניות הביטולים בתקנון ←</a>
                  </div>

                  {/* ── Service level ─────────────────────────────── */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="eyebrow">רמת שירות</div>
                      <button onClick={() => setShowAiInfo(true)} className="text-xs font-semibold hover:underline text-[var(--gold-deep)]">ⓘ מידע נוסף</button>
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
                        badge={`-€${AI_DISCOUNT}`}
                        badgeColor="var(--gold-deep)"
                        selected={service === "ai"}
                        onClick={() => setService("ai")}
                      />
                    </div>
                  </div>

                  </div>

                  {/* ── Price breakdown ───────────────────────────── */}
                  <div className="p-4" style={{ background: "var(--ivory-deep)", border: "1px solid rgba(28,27,23,0.08)", borderRadius: 4 }}>
                    <div className="eyebrow mb-3">סיכום מחיר</div>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--stone)]">לינה × {nights} לילות</span>
                        <span className="font-semibold text-[var(--charcoal)]">€{aptTotal.toLocaleString()}</span>
                      </div>
                      {skiPass && (
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--stone)]">סקי פס × {guests} × {nights} ימים</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--gold-wash)", color: "var(--gold-deep)" }}>בקרוב</span>
                        </div>
                      )}
                      {transfer && (
                        <div className="flex justify-between">
                          <span className="text-[var(--stone)]">הסעה הלוך-חזור{transferQty > 1 ? ` · ${transferQty} אנשים` : ""}</span>
                          <span className="font-semibold text-[var(--charcoal)]">€{trTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {equipment && (
                        <div className="flex justify-between">
                          <span className="text-[var(--stone)]">השכרת ציוד · {nights} ימים{equipQty > 1 ? ` · ${equipQty} אנשים` : ""}</span>
                          <span className="font-semibold text-[var(--charcoal)]">€{equipTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {cancel === "flexible" && (
                        <div className="flex justify-between">
                          <span className="text-[var(--stone)]">ביטול גמיש</span>
                          <span className="font-semibold text-[var(--charcoal)]">€{flexExtra.toLocaleString()}</span>
                        </div>
                      )}
                      {cancel === "none" && (
                        <div className="flex justify-between">
                          <span className="text-[var(--stone)]">ללא אפשרות ביטול</span>
                          <span className="font-semibold text-[var(--gold-deep)]">−€{CANCEL_NONE.toLocaleString()}</span>
                        </div>
                      )}
                      {service === "ai" && (
                        <div className="flex justify-between">
                          <span className="text-[var(--stone)]">הנחת AI</span>
                          <span className="font-semibold text-[var(--gold-deep)]">−€{AI_DISCOUNT.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-3" style={{ borderTop: "1px solid rgba(28,27,23,0.12)" }}>
                      <span className="font-display font-medium text-[var(--charcoal)]">סה״כ</span>
                      <span className="font-display text-2xl font-medium text-[var(--gold-deep)]">€{grandTotal.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] mt-2 leading-relaxed text-[var(--stone-soft)]">* ייתכנו עמלות נוספות (כגון עמלת סליקת אשראי 1.9%). המחירים ב-€ והחיוב בש״ח לפי שער ההמרה.</p>
                  </div>

                  {/* ── Split payment ─────────────────────────────── */}
                  <div className="p-4" style={{ border: "1px solid rgba(28,27,23,0.08)", borderRadius: 4 }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-bold text-[var(--charcoal)]">כמה אנשים משלמים?</span>
                        <span className="block text-[11px] text-[var(--stone-soft)]">עד {guests} משלמים (לפי מספר האורחים)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSplitCount(n => Math.max(1, n - 1))} disabled={splitCount <= 1}
                          className="w-7 h-7 rounded-full border font-bold disabled:opacity-40"
                          style={{ borderColor: "rgba(28,27,23,0.15)", color: "var(--stone)" }}>−</button>
                        <span className="font-bold w-5 text-center text-[var(--charcoal)]">{splitCount}</span>
                        <button onClick={() => setSplitCount(n => Math.min(guests, n + 1))} disabled={splitCount >= guests}
                          className="w-7 h-7 rounded-full border font-bold disabled:opacity-40"
                          style={{ borderColor: "rgba(28,27,23,0.15)", color: "var(--stone)" }}>+</button>
                      </div>
                    </div>
                    {splitCount > 1 ? (
                      <div className="px-3 py-2.5 text-sm" style={{ background: "var(--gold-wash)", borderRadius: 4 }}>
                        <div className="flex justify-between font-bold text-[var(--charcoal)]">
                          <span>החלק שלך לתשלום עכשיו</span>
                          <span>€{payNow.toLocaleString()}</span>
                        </div>
                        <p className="text-xs mt-1 leading-relaxed text-[var(--gold-deep)]">הסה״כ (€{grandTotal.toLocaleString()}, כולל כל התוספות) מתחלק שווה ל-{splitCount} · אחרי התשלום תקבל/י קישור לשלוח לחברים שישלמו את חלקם.</p>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--stone-soft)]">בחר/י יותר מאדם אחד כדי לפצל את התשלום בין כמה משלמים.</p>
                    )}
                  </div>

                  {/* ── CTA ───────────────────────────────────────── */}
                  <CardPaymentButton apartmentId={id} apartment={apt?.name ?? ""} checkin={checkin} checkout={checkout}
                    guests={guests} nights={nights} skiPass={skiPass} transfer={transfer} equipment={equipment} cancel={cancel} service={service}
                    transferDetails={transferDetails}
                    grandTotal={payNow}
                    split={splitCount > 1 ? { sharesTotal: splitCount, accommodationTotal: grandTotal, shareAmount: shareAccommodation, area: "Val Thorens, Trois Vallées" } : undefined}
                    label={splitCount > 1 ? "שלם/י את חלקך בכרטיס" : undefined}
                    className="btn-gold flex w-full py-4 text-base" />

                  {/* save + quote side by side */}
                  <div className="flex gap-2">
                    <SaveTripButton apartmentId={id} checkin={checkin} checkout={checkout} guests={guests}
                      label="מועדפים"
                      className="btn-ghost flex-1 py-3 text-sm" />
                    <button onClick={handleSendQuote} disabled={creatingQuote}
                      className="btn-ghost flex-1 py-3 text-sm disabled:opacity-60">
                      {creatingQuote ? "יוצר…" : "📋 הצעת מחיר"}
                    </button>
                  </div>

                  {/* copy link */}
                  <button onClick={() => { navigator.clipboard?.writeText("https://skisharebook.com" + window.location.pathname + window.location.search); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="btn-ghost block w-full py-2.5 text-sm">
                    {copied ? "✓ הקישור הועתק — שלח/י לחברים" : "🔗 העתק קישור לשיתוף"}
                  </button>

                  {/* small contact rep */}
                  <a href={waBookHref} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-sm text-[#1ebe5a] font-bold hover:underline pt-1">
                    <IconWhatsApp size={16} /> צור קשר עם נציג
                  </a>

                  <p className="text-center text-xs text-[var(--stone-soft)]">
                    {cancel === "flexible" ? "80% החזר עד שבוע לפני · 50% עד 24ש׳" : cancel === "none" ? "לא ניתן לביטול — אישרת בחתימה" : "ביטול בהתאם לתנאי התקנון"}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* spacer so content clears the floating mobile bar */}
      <div className="h-24 lg:hidden" aria-hidden />

      {/* ── Mobile floating booking bar (Airbnb-style) ─────────── */}
      {!sheetOpen && (
        <div dir="rtl" className="lg:hidden fixed bottom-0 inset-x-0 z-30 px-4 py-3 flex items-center gap-3"
          style={{ background: "var(--paper)", borderTop: "1px solid rgba(28,27,23,0.1)", boxShadow: "0 -4px 24px rgba(11,15,20,0.10)", paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}>
          <div className="flex-shrink-0 text-right leading-none">
            <div className="text-[11px] mb-0.5 text-[var(--stone-soft)]">{splitCount > 1 ? "החלק שלך" : `סה״כ · ${nights} לילות`}</div>
            <div className="font-display text-xl font-medium text-[var(--charcoal)]">€{payNow.toLocaleString()}</div>
          </div>
          <button onClick={() => setSheetOpen(true)}
            className="btn-gold flex-1 py-3.5 text-base">
            בחר/י אפשרויות ותשלום ↑
          </button>
        </div>
      )}

      {/* ── No-cancellation confirmation + signature ───────────── */}
      {showNoCancel && (
        <div dir="rtl" className="fixed inset-0 z-[95] flex items-center justify-center p-4" style={{ background: "rgba(11,15,20,0.6)" }} onClick={() => setShowNoCancel(false)}>
          <div className="w-full max-w-md p-6" style={{ background: "var(--paper)", borderRadius: 4, boxShadow: "0 24px 48px -24px rgba(11,15,20,0.4)" }} onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl font-medium mb-1 text-[var(--charcoal)]">ללא אפשרות ביטול</h2>
            <p className="text-sm mb-4 text-[var(--stone)]">בחירה באפשרות זו מוזילה את המחיר ב-€{CANCEL_NONE}, אך ההזמנה <b>אינה ניתנת לביטול</b> ולא יינתן כל החזר כספי, בהתאם לתקנון.</p>
            <label className="flex items-start gap-2 cursor-pointer mb-4">
              <input type="checkbox" checked={noCancelAgreed} onChange={e => setNoCancelAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[var(--gold-deep)]" />
              <span className="text-sm leading-relaxed text-[var(--stone)]">אני מאשר/ת שקראתי והבנתי כי <b>לא אוכל לבטל את ההזמנה</b> ולא אקבל החזר כספי בשום מקרה, ומסכים/ה ל<a href="/terms" target="_blank" className="underline text-[var(--gold-deep)]">תקנון</a>.</span>
            </label>
            <label className="block text-xs font-bold mb-1 text-[var(--stone-soft)]">חתימה (שם מלא)</label>
            <input value={signature} onChange={e => setSignature(e.target.value)} placeholder="הקלד/י את שמך המלא כחתימה"
              className="w-full px-4 py-3 text-sm mb-4 focus:outline-none"
              style={{ border: "1px solid rgba(28,27,23,0.15)", borderRadius: 4 }} />
            <div className="flex gap-2">
              <button disabled={!noCancelAgreed || signature.trim().length < 2}
                onClick={() => { setCancel("none"); setShowNoCancel(false); }}
                className="btn-gold flex-1 py-3 disabled:opacity-50">אישור וחתימה</button>
              <button onClick={() => setShowNoCancel(false)} className="btn-ghost px-5 py-3 text-[var(--stone)]">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quote share popup ──────────────────────────────────── */}
      {quoteUrl && (
        <div dir="rtl" className="fixed inset-0 z-[95] flex items-center justify-center p-4" style={{ background: "rgba(11,15,20,0.6)" }} onClick={() => setQuoteUrl(null)}>
          <div className="w-full max-w-md p-6" style={{ background: "var(--paper)", borderRadius: 4, boxShadow: "0 24px 48px -24px rgba(11,15,20,0.4)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-xl font-medium text-[var(--charcoal)]">הצעת המחיר מוכנה! 🎿</h2>
              <button onClick={() => setQuoteUrl(null)} className="w-9 h-9 rounded-full text-xl text-[var(--stone-soft)]">✕</button>
            </div>
            <p className="text-sm mb-5 text-[var(--stone)]">שלח/י קישור אחד ללקוח — הוא נפתח אוטומטית <b>באפליקציה</b> אם היא מותקנת, אחרת בדפדפן.</p>

            {/* one smart link */}
            <div className="mb-4">
              <label className="text-xs font-bold block mb-1.5 text-[var(--stone-soft)]">קישור להצעה</label>
              <div className="flex gap-2">
                <input readOnly value={quoteUrl} dir="ltr" className="flex-1 min-w-0 px-3 py-2.5 text-xs text-right truncate"
                  style={{ border: "1px solid rgba(28,27,23,0.15)", borderRadius: 4, background: "var(--ivory-deep)" }} />
                <button onClick={() => copyTo(quoteUrl, "web")} className="btn-gold px-4 text-sm whitespace-nowrap">
                  {qCopied === "web" ? "✓ הועתק" : "העתק"}
                </button>
              </div>
              <p className="text-[11px] mt-1.5 text-[var(--stone-soft)]">אין צורך בקישור נפרד לחנות — אם האפליקציה לא מותקנת, מוצעת הורדה בעמוד עצמו.</p>
            </div>

            <div className="flex gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(`הצעת מחיר ל-${apt?.name ?? "דירה"} 🎿\n${quoteUrl}`)}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 transition"
                style={{ background: "#25D366", borderRadius: 4 }}>
                <IconWhatsApp size={18} /> שתף בוואטסאפ
              </a>
              <a href={quoteUrl} target="_blank" rel="noopener noreferrer"
                className="btn-ghost px-5 py-3 text-[var(--stone)]">פתח הצעה</a>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer flight details ────────────────────────────── */}
      <FlightDetailsModal open={showTransfer} onClose={() => setShowTransfer(false)} value={flight} onChange={setFlight} />

      {/* ── AI service info ────────────────────────────────────── */}
      {showAiInfo && (
        <div dir="rtl" className="fixed inset-0 z-[95] flex items-center justify-center p-4" style={{ background: "rgba(11,15,20,0.6)" }} onClick={() => setShowAiInfo(false)}>
          <div className="w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" style={{ background: "var(--paper)", borderRadius: 4, boxShadow: "0 24px 48px -24px rgba(11,15,20,0.4)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-medium text-[var(--charcoal)]">שירות AI — איך זה עובד?</h2>
              <button onClick={() => setShowAiInfo(false)} className="w-9 h-9 rounded-full text-xl text-[var(--stone-soft)]">✕</button>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-[var(--stone)]">
              <li className="flex gap-2"><span>📍</span><span>תקבל/י את הכתובת המלאה וחוקי הצ׳ק-אין / צ׳ק-אאוט.</span></li>
              <li className="flex gap-2"><span>🔑</span><span>המפתחות יחכו לך בדלת כ-48 שעות לפני ההגעה. את הדירה יש לפנות לפי שעות הצ׳ק-אאוט הרגילות.</span></li>
              <li className="flex gap-2"><span>🎿</span><span>אם הזמנת סקי פס — תאסוף/י אותו עצמאית מהמכונה במהלך השהות.</span></li>
              <li className="flex gap-2"><span>🤖</span><span>לאורך החופשה תיעזר/י בצ׳אטבוט AI לכל שאלה.</span></li>
              <li className="flex gap-2"><span>🆘</span><span>במקרים חריגים (קבלת דירה עם נזק, מקרה קיצון) תוכל/י כמובן לפנות לנציגים שלנו דרך האתר.</span></li>
            </ul>
            <button onClick={() => setShowAiInfo(false)} className="btn-gold mt-5 w-full py-3">הבנתי</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApartmentPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ink)" }}>
        <SkiLoader />
      </div>
    }>
      <ApartmentPage />
    </Suspense>
  );
}
