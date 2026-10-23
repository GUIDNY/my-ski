"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import type { Apartment, SkiPass } from "@/types";
import { stayBreakdown, matchingWeek, skiDaysFromNights, equipCost } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import {
  IconSkis, IconBus, IconShield, IconUser, IconBot, IconCheck, IconCalendar, IconChevronLeft,
  IconWifi, IconFire, IconParking, IconSnowflake, IconWhatsApp, IconUsers, IconX,
} from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";
import CardPaymentButton from "@/components/CardPaymentButton";
import FlightDetailsModal, { EMPTY_FLIGHT, flightToString, flightFilled, type Flight } from "@/components/FlightDetailsModal";
import FlightAddOn from "@/components/FlightAddOn";
import { useDirectFlight, useReturnLeg, time24 } from "@/lib/useFlightPrice";
import { TRANSFER_PRICE, BAGGAGE_PRICE, LIFT_DATES, PASS_AREA_LABEL, liftsOpenForStay, packagePassArea, passTier, shortDate, type PassArea } from "@/lib/deal-pricing";
import { encodeExtras } from "@/lib/quote-extras";
import SaveTripButton from "@/components/SaveTripButton";
import { wrap, card, h1, h2, btn, field, fieldLabel, chip, badgeDark, Check, CheckList, Crumbs, PerPerson, EmptyState } from "@/components/ui";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const HE_DAYS = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
const fmtDate = (s: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`; };
// "שבת 16.1"
const fmtDay = (s: string) => { const d = new Date(s + "T12:00:00"); return `${HE_DAYS[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}`; };
// "16–23 בינואר" / "28 בפברואר – 7 במרץ"
const fmtRange = (ci: string, co: string) => {
  const a = new Date(ci + "T12:00:00"), b = new Date(co + "T12:00:00");
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ב${HE_MONTHS[b.getMonth()]}`
    : `${a.getDate()} ב${HE_MONTHS[a.getMonth()]} – ${b.getDate()} ב${HE_MONTHS[b.getMonth()]}`;
};
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (s: string, n: number) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return isoDay(d); };
const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;

const SITE_URL = "https://skisharebook.com";
// transfer and checked bag prices: see deal-pricing.ts
// ski equipment rental: €30/night under a week · €120 for a week · +€20 each extra night
const CANCEL_FLEX    = 100; // flexible cancellation surcharge (flat)
const CANCEL_NONE    = 100; // no-cancellation discount (flat)
const AI_DISCOUNT    = 50;  // per person
const FALLBACK_IMAGES = ["/apt1.jpg", "/apt2.jpg", "/apt3.jpg"];

// the parts of the page, in order (section tabs)
const TABS = [
  { id: "stay", label: "הדירה" },
  { id: "pass", label: "סקי פס" },
  { id: "transfer", label: "הסעה" },
  { id: "gear", label: "ציוד" },
  { id: "flight", label: "טיסה" },
  { id: "policy", label: "ביטול ושירות" },
];
// lands below the sticky site header and the section tabs
const SECTION_OFFSET = "scroll-mt-[132px] md:scroll-mt-[150px]";

const AMENITY_ICONS: Record<string, ReactNode> = {
  "WiFi":       <IconWifi size={16} />,
  "אח":         <IconFire size={16} />,
  "חניה":       <IconParking size={16} />,
  "ג'קוזי":     <IconSnowflake size={16} />,
};
const amenityIcon = (a: string) => AMENITY_ICONS[a] ?? <IconCheck size={16} />;

/* ── + / − buttons ─────────────────────────────────────────── */
function Stepper({ value, onChange, min = 1, max, label }: {
  value: number; onChange: (n: number) => void; min?: number; max: number; label: string;
}) {
  const b = "w-10 h-10 rounded-full border border-line-strong bg-white text-ink text-[20px] leading-none flex items-center justify-center transition-colors hover:border-ink disabled:opacity-35 disabled:hover:border-line-strong";
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={label}>
      <button type="button" className={b} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="פחות">−</button>
      <span className="w-8 text-center font-display font-bold text-[18px] text-ink" aria-live="polite">{value}</span>
      <button type="button" className={b} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="עוד">+</button>
    </div>
  );
}

/* ── "how many people need this" row inside a selected option ─ */
function QtyRow({ label, qty, setQty, max, total }: {
  label: string; qty: number; setQty: (n: number) => void; max: number; total: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl bg-white border border-line px-4 py-2.5">
      <span className="text-[15px] font-medium text-ink">{label}</span>
      <div className="flex items-center gap-3">
        <Stepper value={qty} onChange={setQty} max={max} label={label} />
        <span className="min-w-[68px] text-left font-bold text-[15px] text-ink">{eur(total)}</span>
      </div>
    </div>
  );
}

/* ── A selectable card (radio or checkbox), like the design ─── */
function OptionCard({ kind, checked, onSelect, title, sub, price, icon, badge, children, disabled }: {
  kind: "radio" | "check"; checked: boolean; onSelect: () => void;
  title: ReactNode; sub?: ReactNode; price?: ReactNode; icon?: ReactNode; badge?: ReactNode; children?: ReactNode;
  /** can't be picked (e.g. a ski area whose lifts are closed on these dates) */
  disabled?: boolean;
}) {
  return (
    <div className={`rounded-[18px] border transition-colors ${disabled ? "border-dashed border-line-strong bg-[#FBFCFE] opacity-75" : checked ? "border-accent ring-1 ring-accent bg-accent-soft/50" : "border-line bg-white hover:border-line-strong"}`}>
      <button type="button" role={kind === "radio" ? "radio" : "checkbox"} aria-checked={checked} onClick={onSelect} disabled={disabled}
        className="w-full flex items-start gap-3.5 p-4 md:p-[18px] text-start rounded-[18px] disabled:cursor-not-allowed">
        {kind === "radio" ? (
          <span className={`mt-0.5 w-[22px] h-[22px] shrink-0 rounded-full border-2 flex items-center justify-center ${checked ? "border-accent" : "border-line-strong bg-white"}`} aria-hidden="true">
            {checked && <span className="w-[11px] h-[11px] rounded-full bg-accent" />}
          </span>
        ) : (
          <span className={`mt-0.5 w-[22px] h-[22px] shrink-0 rounded-md border-2 flex items-center justify-center ${checked ? "border-accent bg-accent text-white" : "border-line-strong bg-white"}`} aria-hidden="true">
            {checked && <IconCheck size={13} />}
          </span>
        )}
        {icon && <span className={`mt-px shrink-0 ${checked ? "text-accent" : "text-muted"}`} aria-hidden="true">{icon}</span>}
        <span className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[16px] md:text-[17px] text-ink">{title}</span>
            {badge}
          </span>
          {sub && <span className="text-[14px] md:text-[15px] leading-relaxed text-muted">{sub}</span>}
          {price && <span className="mt-0.5 font-bold text-[15px] md:text-[16px] text-ink">{price}</span>}
        </span>
      </button>
      {checked && children && <div className="px-4 md:px-[18px] pb-4 flex flex-col gap-2.5">{children}</div>}
    </div>
  );
}

/* ── One part of the page ──────────────────────────────────── */
function Section({ id, title, sub, children }: { id: string; title: ReactNode; sub?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className={`${SECTION_OFFSET} flex flex-col gap-4`} aria-labelledby={`${id}-title`}>
      <div className="flex flex-col gap-1.5">
        <h2 id={`${id}-title`} className={h2}>{title}</h2>
        {sub && <p className="text-[15px] md:text-[16px] text-muted leading-relaxed">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

/* ── Full-screen photos ────────────────────────────────────── */
function Lightbox({ images, start, name, onClose }: { images: string[]; start: number; name: string; onClose: () => void }) {
  const [i, setI] = useState(start);
  const touchX = useRef<number | null>(null);
  const n = images.length;
  const prev = () => setI(v => (v - 1 + n) % n);
  const next = () => setI(v => (v + 1) % n);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // right-to-left: the arrow to the left moves forward
      if (e.key === "ArrowLeft") setI(v => (v + 1) % n);
      if (e.key === "ArrowRight") setI(v => (v - 1 + n) % n);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener("keydown", onKey); };
  }, [n, onClose]);

  return (
    <div dir="rtl" role="dialog" aria-modal="true" aria-label={`התמונות של ${name}`} className="fixed inset-0 z-[96] bg-ink flex flex-col">
      <div className="flex items-center justify-between px-4 md:px-6 h-16 text-white shrink-0">
        <span className="text-[15px] font-bold">{name} · {i + 1} / {n}</span>
        <button type="button" onClick={onClose} aria-label="סגירה" className="w-11 h-11 rounded-full hover:bg-white/10 flex items-center justify-center"><IconX size={22} /></button>
      </div>
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 md:px-20"
        onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 45) { if (dx > 0) next(); else prev(); }
        }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={`${name}, תמונה ${i + 1}`} className="max-h-full max-w-full object-contain rounded-xl select-none" draggable={false} />
        {n > 1 && (
          <>
            <button type="button" onClick={prev} aria-label="התמונה הקודמת"
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center">
              <IconChevronLeft size={22} className="rotate-180" />
            </button>
            <button type="button" onClick={next} aria-label="התמונה הבאה"
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center">
              <IconChevronLeft size={22} />
            </button>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="shrink-0 px-4 py-3 flex gap-2 overflow-x-auto justify-start md:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          {images.map((src, j) => (
            <button key={j} type="button" onClick={() => setI(j)} aria-label={`תמונה ${j + 1}`} aria-current={j === i ? "true" : undefined}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-opacity ${j === i ? "border-white opacity-100" : "border-transparent opacity-55 hover:opacity-90"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Photos: swipe on the phone, one big + two small on desktop ─ */
function Photos({ images, name, onOpen }: { images: string[]; name: string; onOpen: (i: number) => void }) {
  const [idx, setIdx] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const n = images.length;
  const onScroll = () => {
    const el = strip.current;
    if (el) setIdx(Math.min(n - 1, Math.round(Math.abs(el.scrollLeft) / Math.max(1, el.clientWidth))));
  };
  const allBtn = "inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-white text-ink text-[15px] font-bold shadow-sm hover:bg-soft transition-colors";
  const img = (src: string, i: number, cls: string) => (
    <button key={i} type="button" onClick={() => onOpen(i)} className={`relative overflow-hidden bg-soft-2 group ${cls}`} aria-label={`להגדלת התמונה ${i + 1} מתוך ${n}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={i === 0 ? name : ""} loading={i === 0 ? "eager" : "lazy"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
    </button>
  );

  return (
    <>
      {/* phone */}
      <div className="md:hidden relative -mx-4">
        <div ref={strip} onScroll={onScroll} className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((src, i) => (
            <button key={i} type="button" onClick={() => onOpen(i)} className="snap-center shrink-0 w-full h-[290px] bg-soft-2" aria-label={`להגדלת התמונה ${i + 1} מתוך ${n}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={i === 0 ? name : ""} loading={i === 0 ? "eager" : "lazy"} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        {n > 1 && (
          <span className="absolute bottom-3 left-3 bg-ink/75 text-white text-[13px] font-bold rounded-full px-3 py-1 pointer-events-none" aria-hidden="true">
            {idx + 1} / {n}
          </span>
        )}
      </div>

      {/* desktop */}
      {n >= 3 ? (
        <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-2.5 h-[440px]">
          {img(images[0], 0, "col-span-2 row-span-2 rounded-s-card")}
          {img(images[1], 1, "rounded-se-card")}
          <div className="relative">
            {img(images[2], 2, "w-full h-full rounded-ee-card")}
            <button type="button" onClick={() => onOpen(0)} className={`absolute bottom-3 left-3 ${allBtn}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
              כל {n} התמונות
            </button>
          </div>
        </div>
      ) : (
        <div className={`hidden md:grid gap-2.5 h-[440px] ${n === 2 ? "grid-cols-3" : "grid-cols-1"}`}>
          {img(images[0], 0, n === 2 ? "col-span-2 rounded-s-card" : "rounded-card")}
          {n === 2 && img(images[1], 1, "rounded-e-card")}
        </div>
      )}
    </>
  );
}

/* ── Dates and guests: free dates for our apartments, the open weeks for agency ones ─ */
function DatesForm({ apt, checkin, checkout, guests, onApply, onCancel }: {
  apt: Apartment; checkin: string; checkout: string; guests: number;
  onApply: (ci: string, co: string, g: number) => void; onCancel?: () => void;
}) {
  const today = isoDay(new Date());
  const [ci, setCi] = useState(checkin);
  const [co, setCo] = useState(checkout);
  const [g, setG] = useState(Number.isFinite(guests) && guests > 0 ? guests : 2);
  const maxGuests = Math.max(apt.max_guests ?? 12, 1);
  const agency = apt.source === "la_cime";
  const weeks = (apt.available_weeks ?? [])
    .filter(w => w.week >= today)
    .sort((a, b) => a.week.localeCompare(b.week));
  const bad = !!ci && !!co && co <= ci;

  return (
    <div className="flex flex-col gap-3.5">
      {agency ? (
        <div className="flex flex-col gap-2">
          <span className={fieldLabel}>השבועות הפנויים (שבת עד שבת)</span>
          {weeks.length ? (
            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto">
              {weeks.map(w => {
                const on = w.week === checkin && addDays(w.week, 7) === checkout;
                return (
                  <button key={w.week} type="button" onClick={() => onApply(w.week, addDays(w.week, 7), g)}
                    className={`flex items-center justify-between gap-3 min-h-[48px] px-4 rounded-xl border text-[15px] transition-colors ${on ? "border-accent bg-accent-soft font-bold" : "border-line-strong hover:border-ink"}`}>
                    <span>{fmtRange(w.week, addDays(w.week, 7))}</span>
                    <span className="font-bold">{eur(w.price)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[15px] text-muted">כרגע אין שבועות פנויים בדירה הזו. <Link href="/weekly" className={btn.link}>לכל הדירות שבת עד שבת</Link></p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col">
            <span className={fieldLabel}>כניסה</span>
            <input type="date" value={ci} min={today} onChange={e => { setCi(e.target.value); if (co && e.target.value && co <= e.target.value) setCo(addDays(e.target.value, 7)); }} className={field} />
          </label>
          <label className="flex flex-col">
            <span className={fieldLabel}>יציאה</span>
            <input type="date" value={co} min={ci ? addDays(ci, 1) : today} onChange={e => setCo(e.target.value)} className={field} />
          </label>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] font-bold text-ink">כמה אתם?</span>
        <Stepper value={g} onChange={setG} max={maxGuests} label="כמה אתם" />
      </div>
      {bad && <p className="text-[14px] text-danger">היציאה צריכה להיות אחרי הכניסה.</p>}
      <div className="flex gap-2">
        {!agency && (
          <button type="button" onClick={() => ci && co && !bad && onApply(ci, co, g)} disabled={!ci || !co || bad} className={`${btn.primary} flex-1`}>
            לבדוק מחיר
          </button>
        )}
        {agency && checkin && checkout && g !== guests && (
          <button type="button" onClick={() => onApply(checkin, checkout, g)} className={`${btn.primary} flex-1`}>עדכון</button>
        )}
        {onCancel && <button type="button" onClick={onCancel} className={btn.outline}>ביטול</button>}
      </div>
    </div>
  );
}

/* ── A modal window ────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div dir="rtl" className="fixed inset-0 z-[95] bg-ink/55 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}
        className="bg-white w-full sm:max-w-md rounded-t-[24px] sm:rounded-card p-5 sm:p-6 max-h-[90dvh] overflow-y-auto"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="font-display font-bold text-[22px] leading-tight text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="סגירה" className="w-10 h-10 -mt-1 -ml-1 shrink-0 rounded-full hover:bg-soft text-muted flex items-center justify-center"><IconX size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
type Initial = { initialApt: Apartment; initialRules: PricingRule[]; initialPasses: SkiPass[] };

function ApartmentPage({ initialApt, initialRules, initialPasses }: Initial) {
  const { id }     = useParams<{ id: string }>();
  const params     = useSearchParams();
  const router     = useRouter();
  const checkin    = params.get("checkin")  ?? "";
  const checkout   = params.get("checkout") ?? "";
  const guests     = parseInt(params.get("guests") ?? "2");
  const fullDeal   = params.get("deal") === "full";
  // A package link can pick the add-ons up front (the homepage and search
  // cards): ?pass=trois_vallees|val_thorens · ?transfer=1 · ?equip=1
  const prePass     = params.get("pass");
  const preTransfer = params.get("transfer") === "1";
  const preEquip    = params.get("equip") === "1";
  const hasDates   = !!(checkin && checkout);

  // the server already loaded the apartment, its prices and the ski passes
  // (so the page arrives complete, also for search engines)
  const apt = initialApt;
  const rules = initialRules;
  const loading = false;
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [quoteUrl, setQuoteUrl] = useState<string | null>(null);
  const [qCopied, setQCopied] = useState("");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [editDates, setEditDates] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  // Add-ons
  // "?deal=full" pre-checks the whole package (transfer, Trois Vallées ski
  // pass, baggage — flight follows once its live price loads, below) instead
  // of the customer having to opt into each one individually.
  // A package takes the pass that fits its dates: all of 3 Vallées when the
  // whole area is open, else Val Thorens alone, else no pass at all.
  const dealArea = packagePassArea(checkin, checkout);
  const askedArea: PassArea | null = prePass === "val_thorens" || prePass === "trois_vallees" ? prePass : fullDeal ? dealArea : null;
  const [skiPass,  setSkiPass]  = useState(askedArea !== null);
  const skiPasses = initialPasses;
  const [skiArea,  setSkiArea]  = useState<PassArea>(askedArea ?? dealArea ?? "val_thorens");
  const [skiQty,   setSkiQty]   = useState(guests || 1);
  const [transfer, setTransfer] = useState(fullDeal || preTransfer);
  const [equipment, setEquipment] = useState(preEquip);
  const [transferQty, setTransferQty] = useState(guests || 1); // how many people need transfer
  const [equipQty, setEquipQty] = useState(preEquip ? (guests || 1) : 1);       // how many people need equipment
  const [showTransfer, setShowTransfer] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  const [flight, setFlight] = useState<Flight>(EMPTY_FLIGHT);
  const [bookFlight, setBookFlight] = useState(false);   // "add the flight itself to the package" toggle
  const [bookFlightQty, setBookFlightQty] = useState(guests || 1);
  const [baggage, setBaggage] = useState(fullDeal);
  const [baggageQty, setBaggageQty] = useState(guests || 1);

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
  // A stay of N nights only yields N-1 actual ski days (arrival/departure days aren't spent on the slopes)
  const skiDays = skiDaysFromNights(nights);


  // The dates arrive from the URL, so a direct link could point at nights
  // already booked on Airbnb or by another order — check before offering payment.
  const [takenFor, setTakenFor] = useState("");
  const rangeKey = checkin && checkout ? `${id}|${checkin}|${checkout}` : "";
  const datesTaken = rangeKey !== "" && takenFor === rangeKey;
  useEffect(() => {
    if (!rangeKey) return;
    fetch(`/api/availability/blocked?checkin=${checkin}&checkout=${checkout}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.blocked) && d.blocked.includes(id)) setTakenFor(rangeKey); })
      .catch(() => {});
  }, [id, checkin, checkout, rangeKey]);

  // which part of the page is on screen (the section tabs)
  useEffect(() => {
    if (!apt) return;
    const els = TABS.map(t => document.getElementById(t.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(entries => {
      const seen = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (seen[0]) setActiveTab(seen[0].target.id);
    }, { rootMargin: "-150px 0px -55% 0px" });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [apt]);

  /* Ski pass tier that covers the trip length, for an area (adult only) */
  const tierFor = (area: PassArea) => passTier(skiPasses, area, skiDays);
  const skiTier = tierFor(skiArea);
  // a pass only counts when its lifts are open on the ski days of the stay
  const passOpen = (area: PassArea) => liftsOpenForStay(area, checkin, checkout);
  const skiOn = skiPass && passOpen(skiArea) && !!skiTier;

  /* ── Flight: only a real direct round trip, at its live price ── */
  const direct = useDirectFlight(checkin, checkout);
  const directFlight = direct.status === "found" ? direct.flight : null;
  const flightOn = bookFlight && !!directFlight;
  const bagOn = baggage && flightOn;
  const returnLeg = useReturnLeg(directFlight, checkin, checkout, flightOn);
  // The price isn't known until the live check resolves, so a package turns
  // the flight on once, the moment a direct one is found, without fighting a
  // customer who un-checks it afterwards.
  const autoFlightApplied = useRef(false);
  const directFound = !!directFlight;
  useEffect(() => {
    if (fullDeal && directFound && !autoFlightApplied.current) {
      autoFlightApplied.current = true;
      setBookFlight(true);
    }
  }, [fullDeal, directFound]);

  /* ── Price calculation ──────────────────────────────────── */
  const basePrice = apt?.price_per_night ?? 0;
  // La Cime ("שבת עד שבת") apartments are only real inventory in fixed
  // Saturday-to-Saturday weeks — always charge the full week's price rather
  // than a made-up per-night estimate, for any stay that fits inside one.
  const weekMatch = apt ? matchingWeek(apt, checkin, checkout) : null;
  const laCimeNoMatch = apt?.source === "la_cime" && !weekMatch;
  // Our own apartments follow their Airbnb calendar (nights + cleaning, net of
  // commission), exactly like the WhatsApp/Telegram quotes; see stayBreakdown.
  const stay = apt && checkin && checkout && !weekMatch && !laCimeNoMatch
    ? stayBreakdown(checkin, checkout, basePrice, rules) : null;
  const aptTotal  = apt
    ? weekMatch ? weekMatch.price
      : laCimeNoMatch ? 0
      : (stay ? stay.total : basePrice * nights)
    : 0;

  /* Per-night breakdown for the collapsible panel (+ the stay's cleaning fee) */
  const breakdown = stay ? stay.nights : [];
  const cleaningFee = stay ? stay.fee : 0;

  const avgNightlyPrice = breakdown.length > 0 ? Math.round((aptTotal - cleaningFee) / nights) : basePrice;
  const skiTotal        = skiOn && skiTier ? skiTier.price * skiQty : 0;
  // add-ons are per-person: price × number of people who need each add-on
  const trTotal         = transfer ? TRANSFER_PRICE * transferQty : 0;
  const equipTotal      = equipment ? equipCost(skiDays) * equipQty : 0;
  const bookFlightTotal = flightOn && directFlight ? directFlight.price * bookFlightQty : 0;
  const baggageTotal    = bagOn ? BAGGAGE_PRICE * baggageQty : 0;
  const flexExtra       = cancel  === "flexible" ? CANCEL_FLEX : 0;
  const noCancelDiscount = cancel === "none"     ? -CANCEL_NONE : 0;
  const aiDiscount      = service === "ai"       ? -AI_DISCOUNT : 0;
  const grandTotal      = aptTotal + skiTotal + trTotal + equipTotal + bookFlightTotal + baggageTotal + flexExtra + noCancelDiscount + aiDiscount;
  const transferDetails = transfer ? flightToString(flight) : "";
  // what the order says about the flight: both legs, the airline, the price
  const legText = (label: string, date: string, d: string | null, a: string | null) =>
    `${label} ${fmtDay(date)}${d && a ? ` ${time24(d)}–${time24(a)}` : ""}`;
  const bookFlightDetails = flightOn && directFlight
    ? [
        `טיסה ישירה הלוך וחזור TLV⇄${directFlight.airport}${directFlight.airline ? ` (${directFlight.airline})` : ""}`,
        legText("הלוך", checkin, directFlight.departTime, directFlight.arriveTime),
        legText("חזור", checkout, returnLeg.leg?.departTime ?? null, returnLeg.leg?.arriveTime ?? null),
        `€${directFlight.price} לאדם × ${bookFlightQty}`,
        bagOn ? `מזוודה €${BAGGAGE_PRICE} × ${baggageQty}` : null,
      ].filter(Boolean).join(" · ")
    : "";
  const flightLabel = directFlight ? `טיסה ישירה הלוך וחזור ל${directFlight.city}` : "טיסה";
  const passLabel = `סקי פס ${PASS_AREA_LABEL[skiArea]}${skiTier ? `, ${skiTier.duration_days} ימים` : ""}`;
  // split: divide the FULL total (lodging + all add-ons) equally between payers
  const shareAccommodation = Math.round(grandTotal / splitCount);
  const payNow = splitCount > 1 ? shareAccommodation : grandTotal;
  const perPerson = Math.round(grandTotal / Math.max(guests || 1, 1));

  /* ── What the quote link carries: the add-ons picked here ─── */
  const quoteExtras = encodeExtras({
    pass: skiOn ? { area: skiArea, qty: skiQty } : undefined,
    transfer: transfer ? { qty: transferQty } : undefined,
    equipment: equipment ? { qty: equipQty } : undefined,
    flight: flightOn ? { qty: bookFlightQty } : undefined,
    bag: bagOn ? { qty: baggageQty } : undefined,
  });

  /* ── Long fallback quote URL (works without DB) ─────────── */
  const buildQuoteUrl = () => {
    const p = new URLSearchParams({
      apartment_id: id,
      apartment: apt?.name ?? id,
      checkin, checkout,
      guests: String(guests),
      ski_pass: String(skiOn),
      transfer: String(transfer),
      equipment: String(equipment),
      cancel,
      service,
      nights: String(nights),
      apt_total: String(aptTotal),
      grand_total: String(grandTotal),
    });
    if (quoteExtras) p.set("x", quoteExtras);
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
      flightOn ? `✈️ ${bookFlightDetails} (€${bookFlightTotal})` : null,
      bagOn ? `🧳 מזוודה לבטן ל-${baggageQty} אנשים (€${baggageTotal})` : null,
      cancel === "flexible" ? "✅ מדיניות ביטול גמישה" : cancel === "none" ? "🔒 ללא אפשרות ביטול" : null,
      skiOn ? `🎿 ${passLabel} ל-${skiQty} אנשים (€${skiTotal})` : null,
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
          ski_pass: skiOn, transfer, equipment, cancel, service,
          apt_total: aptTotal, grand_total: grandTotal,
        }),
      });
      if (!res.ok) throw new Error("no table");
      const { id: shortId } = await res.json();
      setQuoteUrl(`${SITE_URL}/q/${encodeURIComponent(nameSlug)}/${shortId}${quoteExtras ? `?x=${quoteExtras}` : ""}`);
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

  // new dates or guests: the same page with the new values in the URL
  const applyDates = (ci: string, co: string, g: number) => {
    const p = new URLSearchParams(params.toString());
    p.set("checkin", ci); p.set("checkout", co); p.set("guests", String(g));
    setEditDates(false);
    router.replace(`/apartments/${id}?${p.toString()}`, { scroll: false });
  };
  const toSummary = (openDates = false) => {
    if (openDates) setEditDates(true);
    document.getElementById("summary")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // the two passes work like one choice: tap one to pick it, tap it again for no pass
  const choosePass = (area: PassArea) => {
    if (!passOpen(area)) return;
    if (skiOn && skiArea === area) { setSkiPass(false); return; }
    setSkiArea(area);
    if (!skiOn) { setSkiPass(true); setSkiQty(Math.min(skiQty || 1, guests) || 1); }
  };

  if (loading) return <SkiLoader label="רגע, טוענים את הדירה…" />;

  if (!apt) return (
    <div className={`${wrap} py-16`} dir="rtl">
      <EmptyState title="לא מצאנו את הדירה הזו"
        text="אולי הקישור ישן, או שהדירה כבר לא מוצעת. אפשר לראות את כל הדירות שלנו, או לכתוב לנו."
        action={<Link href="/apartments" className={btn.primary}>לכל הדירות</Link>} />
    </div>
  );

  const images = apt.images?.length ? apt.images : FALLBACK_IMAGES;
  const agency = apt.source === "la_cime";
  const maxGuests = Math.max(guests, 1);
  const rooms = Number(apt.beds) || 0;
  const meta = [
    "ואל טורנס",
    apt.max_guests ? `עד ${apt.max_guests} אנשים` : "",
    rooms ? (rooms === 1 ? "חדר אחד" : `${rooms} חדרים`) : "",
    apt.sqm ? `${apt.sqm} מ"ר` : "",
    agency ? "דירת סוכנות, שבת עד שבת" : "דירה שלנו",
  ].filter(Boolean).join(" · ");
  const crumbs = [
    { label: "דף הבית", href: "/" },
    hasDates
      ? { label: `${fullDeal ? "חבילות" : "דירות"} ל-${fmtRange(checkin, checkout)}`, href: `/search?checkin=${checkin}&checkout=${checkout}&guests=${guests}${fullDeal ? "&deal=full" : ""}` }
      : { label: "דירות", href: "/apartments" },
    { label: apt.name },
  ];
  const mapEmbed = apt.map_url?.match(/src="(https:\/\/www\.google\.com\/maps\/embed\?[^"]+)"/)?.[1] ?? null;
  const mapLink = apt.map_url && !apt.map_url.includes("<") && /^https?:\/\//.test(apt.map_url) ? apt.map_url : null;
  const passPrice = (area: PassArea) => {
    if (!passOpen(area)) return `סגור בתאריכים האלה · פתוח ${shortDate(LIFT_DATES[area][0])}–${shortDate(LIFT_DATES[area][1])}`;
    const t = tierFor(area);
    return t ? `${eur(t.price)} לאדם · ${t.duration_days} ימים` : undefined;
  };
  const anyAddOn = skiOn || transfer || equipment || flightOn;
  const canBook = hasDates && !laCimeNoMatch && !datesTaken;
  const datesLine = hasDates ? `${fmtDay(checkin)} עד ${fmtDay(checkout)} · ${nights} ${nights === 1 ? "לילה" : "לילות"}` : "";
  const facts = [
    apt.max_guests ? { v: `עד ${apt.max_guests}`, l: "אנשים" } : null,
    rooms ? { v: String(rooms), l: rooms === 1 ? "חדר" : "חדרים" } : null,
    apt.baths ? { v: String(apt.baths), l: apt.baths === 1 ? "חדר רחצה" : "חדרי רחצה" } : null,
    apt.sqm ? { v: `${apt.sqm} מ"ר`, l: "גודל" } : null,
  ].filter((f): f is { v: string; l: string } => !!f);

  /* the lines of the price, as computed above */
  const lines: { label: string; value: string; good?: boolean }[] = [
    { label: weekMatch ? "לינה, שבת עד שבת" : `לינה, ${nights} לילות${cleaningFee > 0 ? ", כולל ניקיון" : ""}`, value: eur(aptTotal) },
    ...(skiOn ? [{ label: `${passLabel} × ${skiQty}`, value: eur(skiTotal) }] : []),
    ...(transfer ? [{ label: `הסעה הלוך וחזור × ${transferQty}`, value: eur(trTotal) }] : []),
    ...(equipment ? [{ label: `ציוד, ${skiDays} ימים × ${equipQty}`, value: eur(equipTotal) }] : []),
    ...(flightOn ? [{ label: `${flightLabel} × ${bookFlightQty}`, value: eur(bookFlightTotal) }] : []),
    ...(bagOn ? [{ label: `מזוודה לבטן × ${baggageQty}`, value: eur(baggageTotal) }] : []),
    ...(cancel === "flexible" ? [{ label: "ביטול גמיש", value: eur(flexExtra) }] : []),
    ...(cancel === "none" ? [{ label: "בלי אפשרות ביטול", value: `−${eur(CANCEL_NONE)}`, good: true }] : []),
    ...(service === "ai" ? [{ label: "הנחת שירות AI", value: `−${eur(AI_DISCOUNT)}`, good: true }] : []),
  ];

  return (
    <div dir="rtl" className="bg-white">
      {/* ── Title and photos ─────────────────────────────────── */}
      <div className={`${wrap} pt-5 md:pt-7`}>
        <Crumbs items={crumbs} className="mb-3 md:mb-4" />
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5 md:mb-6">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={h1}>{apt.name}</h1>
              {fullDeal && <span className={badgeDark}>דיל שלם</span>}
            </div>
            <p className="text-[15px] md:text-[17px] text-muted">{meta}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasDates ? (
              <button type="button" onClick={() => toSummary(true)} className={`${chip} hover:border-line-strong transition-colors`}>
                <IconCalendar size={16} className="text-accent" /> {datesLine}
              </button>
            ) : (
              <button type="button" onClick={() => toSummary(true)} className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[14px] md:text-[15px] font-bold bg-accent text-white hover:bg-accent-hover transition-colors">
                <IconCalendar size={16} /> בחרו תאריכים
              </button>
            )}
            <button type="button" onClick={() => toSummary(true)} className={`${chip} hover:border-line-strong transition-colors`}>
              <IconUsers size={16} className="text-accent" /> {guests} {guests === 1 ? "אדם" : "אנשים"}
            </button>
          </div>
        </div>
        <Photos images={images} name={apt.name} onOpen={setLightbox} />
      </div>

      <div className={`${wrap} pt-6 md:pt-8 pb-12 md:pb-24 flex flex-col lg:flex-row gap-10 lg:gap-12 items-start`}>
        {/* ── The package, part by part ─────────────────────── */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-8 md:gap-10">
          {/* section tabs: stick under the site header while scrolling the parts */}
          <nav aria-label="חלקי החבילה" className="sticky top-[60px] md:top-[76px] z-30 -mx-4 px-4 md:mx-0 md:px-0 bg-white/95 backdrop-blur border-b border-line">
            <div className="flex gap-1.5 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map(t => (
                <a key={t.id} href={`#${t.id}`} aria-current={activeTab === t.id ? "true" : undefined}
                  className={`shrink-0 inline-flex items-center min-h-[40px] px-4 rounded-full text-[15px] transition-colors ${activeTab === t.id ? "bg-ink text-white font-bold" : "text-ink font-medium hover:bg-soft"}`}>
                  {t.label}
                </a>
              ))}
            </div>
          </nav>
          <div className="flex flex-col gap-12 md:gap-14">

          <Section id="stay" title="הדירה">
            {apt.description && (
              <div>
                <p className={`text-[16px] md:text-[17px] leading-[1.75] text-body whitespace-pre-line ${showFullDesc ? "" : "line-clamp-4"}`}>{apt.description}</p>
                {apt.description.length > 180 && (
                  <button type="button" onClick={() => setShowFullDesc(v => !v)} className={`${btn.link} mt-2 min-h-[40px]`}>
                    {showFullDesc ? "פחות" : "לקרוא הכל"}
                  </button>
                )}
              </div>
            )}
            {facts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {facts.map(f => (
                  <div key={f.l} className="rounded-2xl border border-line p-3.5 md:p-4">
                    <div className="font-display font-bold text-[18px] md:text-[20px] text-ink">{f.v}</div>
                    <div className="text-[14px] text-muted">{f.l}</div>
                  </div>
                ))}
              </div>
            )}
            {apt.amenities?.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <h3 className="font-bold text-[17px] text-ink">מה יש בדירה</h3>
                <ul className="flex flex-wrap gap-2">
                  {apt.amenities.map((a, i) => (
                    <li key={i} className={chip}><span className="text-accent">{amenityIcon(a)}</span>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-2.5">
              <h3 className="font-bold text-[17px] text-ink">איפה זה</h3>
              {mapEmbed && (
                <iframe src={mapEmbed} title={`המיקום של ${apt.name} במפה`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
                  className="w-full h-[260px] md:h-[320px] rounded-[18px] border border-line bg-soft" />
              )}
              <div className="rounded-[18px] bg-soft border border-line p-4 md:p-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[15px] md:text-[16px] leading-relaxed text-body max-w-[560px]">
                  ואל טורנס, הכפר הגבוה באירופה (2,300 מ&apos;), עם יציאה ישירה ל-600 ק&quot;מ מסלולים של שלושת העמקים.
                </p>
                {mapLink && (
                  <a href={mapLink} target="_blank" rel="noopener noreferrer" className={`${btn.outline} min-h-[44px] px-4 text-[15px]`}>לפתוח ב-Google Maps</a>
                )}
              </div>
            </div>
          </Section>

          <Section id="pass" title={hasDates && skiDays > 0 ? `סקי פס ל-${skiDays} ימי גלישה` : "סקי פס"}
            sub="בוחרים אחד, או מדלגים. את הסקי פס אוספים בעצמכם מהמכונה בכפר.">
            <div role="group" aria-label="סקי פס" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <OptionCard kind="check" checked={skiOn && skiArea === "trois_vallees"} onSelect={() => choosePass("trois_vallees")}
                disabled={!passOpen("trois_vallees")}
                title="שלושת העמקים" sub='600 ק"מ מסלולים, כל האזור' price={passPrice("trois_vallees")} />
              <OptionCard kind="check" checked={skiOn && skiArea === "val_thorens"} onSelect={() => choosePass("val_thorens")}
                disabled={!passOpen("val_thorens")}
                title="ואל טורנס ואורל" sub="המסלולים של הכפר עצמו" price={passPrice("val_thorens")} />
            </div>
            {skiOn && (
              <QtyRow label="כמה אנשים צריכים סקי פס?" qty={skiQty} setQty={setSkiQty} max={maxGuests} total={skiTotal} />
            )}
          </Section>

          <Section id="transfer" title="הסעה">
            <OptionCard kind="check" checked={transfer} icon={<IconBus size={20} />}
              onSelect={() => { const v = !transfer; setTransfer(v); if (v) setTransferQty(Math.min(transferQty || 1, guests) || 1); }}
              title="שאטל ישיר משדה התעופה עד הדירה" sub={`הלוך וחזור · ${eur(TRANSFER_PRICE)} לאדם`}>
              <QtyRow label="כמה אנשים צריכים הסעה?" qty={transferQty} setQty={setTransferQty} max={maxGuests} total={trTotal} />
              <button type="button" onClick={() => setShowTransfer(true)}
                className="flex items-center justify-between gap-3 min-h-[48px] px-4 rounded-2xl bg-white border border-line hover:border-line-strong text-[15px] text-start transition-colors">
                <span className="font-bold text-ink flex items-center gap-2">
                  {flightFilled(flight) && <Check />}
                  {flightFilled(flight) ? "פרטי הטיסה נשמרו" : "פרטי הטיסה להסעה"}
                </span>
                <span className="text-accent font-bold">{flightFilled(flight) ? "עריכה" : "למילוי"}</span>
              </button>
            </OptionCard>
          </Section>

          <Section id="gear" title="ציוד">
            <OptionCard kind="check" checked={equipment} icon={<IconSkis size={20} />}
              onSelect={() => { const v = !equipment; setEquipment(v); if (v) setEquipQty(Math.min(equipQty || 1, guests) || 1); }}
              title="סקי או סנובורד לכל ימי הגלישה" sub="€30 ליום, €120 לשבוע, ועוד €20 לכל יום נוסף. לאדם."
              price={skiDays > 0 ? `${eur(equipCost(skiDays))} לאדם${hasDates ? ` · ${skiDays} ימים` : ""}` : "מ-€30 לאדם"}>
              <QtyRow label="כמה אנשים צריכים ציוד?" qty={equipQty} setQty={setEquipQty} max={maxGuests} total={equipTotal} />
            </OptionCard>
          </Section>

          <Section id="flight" title="טיסה" sub="רק טיסה ישירה הלוך וחזור מתל אביב, במחיר האמיתי לתאריכים שלכם.">
            <FlightAddOn state={direct} ret={returnLeg} checkin={checkin} checkout={checkout}
              checked={flightOn}
              onToggle={v => { setBookFlight(v); if (v) setBookFlightQty(guests || 1); }}
              qty={bookFlightQty} setQty={setBookFlightQty} maxQty={maxGuests} total={bookFlightTotal}
              bag={{
                on: bagOn, unit: BAGGAGE_PRICE, qty: baggageQty, setQty: setBaggageQty, total: baggageTotal,
                toggle: () => { const v = !baggage; setBaggage(v); if (v) setBaggageQty(Math.min(baggageQty || guests, guests) || 1); },
              }} />
          </Section>

          <Section id="policy" title="ביטול ושירות">
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-[17px] text-ink">מדיניות ביטול</h3>
              <div role="radiogroup" aria-label="מדיניות ביטול" className="flex flex-col gap-3">
                <OptionCard kind="radio" checked={cancel === "regular"} onSelect={() => setCancel("regular")} icon={<IconShield size={20} />}
                  title="ביטול רגיל" sub="לפי התקנון, במחיר הרגיל" />
                <OptionCard kind="radio" checked={cancel === "none"} onSelect={() => setShowNoCancel(true)} icon={<IconShield size={20} />}
                  title="בלי אפשרות ביטול" sub="מחיר מוזל. אי אפשר לבטל, ואין החזר כספי." price={`${eur(CANCEL_NONE)} הנחה`} />
                <OptionCard kind="radio" checked={cancel === "flexible"} onSelect={() => setCancel("flexible")} icon={<IconShield size={20} />}
                  title="ביטול גמיש" sub="80% החזר עד שבוע לפני, 50% עד 24 שעות לפני ההמראה, ואחר כך אין החזר." price={`תוספת ${eur(CANCEL_FLEX)}`} />
              </div>
              <a href="/terms" target="_blank" rel="noopener noreferrer" className={`${btn.link} text-[15px] w-fit`}>מדיניות הביטולים בתקנון</a>
            </div>
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-[17px] text-ink">רמת שירות</h3>
                <button type="button" onClick={() => setShowAiInfo(true)} className={`${btn.link} text-[15px] min-h-[40px]`}>איך עובד שירות AI?</button>
              </div>
              <div role="radiogroup" aria-label="רמת שירות" className="flex flex-col gap-3">
                <OptionCard kind="radio" checked={service === "human"} onSelect={() => setService("human")} icon={<IconUser size={20} />}
                  title="שירות אנושי מלא" sub="נציג ישראלי זמין לפני החופשה, במהלכה ואחריה" />
                <OptionCard kind="radio" checked={service === "ai"} onSelect={() => setService("ai")} icon={<IconBot size={20} />}
                  title="ניהול עצמאי עם AI" sub="צ'אט AI לכל שאלה, ואיסוף עצמאי של הסקי פס" price={`${eur(AI_DISCOUNT)} הנחה`} />
              </div>
            </div>
          </Section>
          </div>
        </div>

        {/* ── Summary (sticky aside on desktop, after the parts on the phone) ── */}
        <aside id="summary" aria-label="סיכום החבילה" className="scroll-mt-[76px] md:scroll-mt-[96px] w-full lg:w-[400px] shrink-0 lg:sticky lg:top-[96px]">
          <div className={`${card} shadow-card p-5 flex flex-col gap-4 lg:max-h-[calc(100dvh-112px)] lg:overflow-y-auto overscroll-contain`}>
            {/* title, dates and guests */}
            {(editDates || !hasDates || laCimeNoMatch || datesTaken) ? (
              <div className="flex flex-col gap-3">
                <span className="font-display font-bold text-[20px] text-ink">{anyAddOn ? "החבילה שלכם" : "המחיר שלכם"}</span>
                {!hasDates && <p className="text-[15px] font-bold text-ink -mt-1">{agency ? "בחרו שבוע, ונראה לכם את המחיר המדויק." : "בחרו תאריכים, ונראה לכם את המחיר המדויק."}</p>}
                {hasDates && laCimeNoMatch && <p className="text-[15px] text-warn font-bold -mt-1">הדירה הזו מושכרת שבת עד שבת. התאריכים שבחרתם לא נופלים בשבוע פנוי, אז בחרו אחד מהשבועות.</p>}
                {datesTaken && !editDates && <p className="text-[15px] text-danger font-bold -mt-1">הדירה כבר תפוסה בחלק מהתאריכים האלה. אפשר לבחור תאריכים אחרים.</p>}
                <div className="rounded-2xl border border-line p-4">
                  <DatesForm apt={apt} checkin={checkin} checkout={checkout} guests={guests} onApply={applyDates}
                    onCancel={hasDates && editDates && !laCimeNoMatch && !datesTaken ? () => setEditDates(false) : undefined} />
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-display font-bold text-[20px] text-ink">{anyAddOn ? "החבילה שלכם" : "המחיר שלכם"}</span>
                  <span className="text-[14px] text-muted">{datesLine} · {guests} {guests === 1 ? "אדם" : "אנשים"}{weekMatch ? " · שבת עד שבת" : ""}</span>
                </div>
                <button type="button" onClick={() => setEditDates(true)} className={`${btn.link} text-[15px] min-h-[40px] shrink-0`}>שינוי</button>
              </div>
            )}

            {canBook && (
              <>
                {/* the stay's price */}
                {stay && breakdown.length > 0 && (
                  <div className="flex flex-col gap-2 -mt-1">
                    <div className="flex items-center justify-between gap-3 text-[15px]">
                      <span className="text-body text-[14px]">
                        {eur(avgNightlyPrice)} {breakdown.length > 1 ? "ללילה בממוצע" : "ללילה"}
                        {cleaningFee > 0 && <span className="text-muted"> · ניקיון {eur(cleaningFee)}</span>}
                      </span>
                      <button type="button" onClick={() => setShowBreakdown(v => !v)} aria-expanded={showBreakdown}
                        className={`${btn.link} text-[14px] shrink-0 min-h-[36px]`}>
                        {showBreakdown ? "להסתיר" : "לפי לילות"}
                      </button>
                    </div>
                    {showBreakdown && (
                      <div className="rounded-xl border border-line overflow-hidden text-[14px]">
                        <div className="max-h-52 overflow-y-auto divide-y divide-line">
                          {breakdown.map(({ date, price }, i) => (
                            <div key={i} className="flex justify-between items-center px-3.5 py-2">
                              <span className="text-muted">{fmtDate(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`)}</span>
                              <span className={`font-bold ${price !== basePrice ? "text-accent" : "text-ink"}`}>{eur(price)}</span>
                            </div>
                          ))}
                        </div>
                        {cleaningFee > 0 && (
                          <div className="flex justify-between items-center px-3.5 py-2 border-t border-line">
                            <span className="text-muted">ניקיון (פעם אחת)</span>
                            <span className="font-bold text-ink">{eur(cleaningFee)}</span>
                          </div>
                        )}
                        {breakdown.length > 1 && (
                          <div className="flex justify-between items-center px-3.5 py-2 bg-soft border-t border-line font-bold">
                            <span className="text-body">ממוצע ללילה</span>
                            <span className="text-ink">{eur(avgNightlyPrice)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {weekMatch && nights < 7 && (
                  <p className="text-[14px] text-muted -mt-1">המחיר קבוע לשבוע מלא, גם אם נשארים פחות לילות.</p>
                )}

                {/* lines */}
                <dl className="flex flex-col gap-2.5 text-[15px]">
                  {lines.map(l => (
                    <div key={l.label} className="flex justify-between gap-3">
                      <dt className="text-body">{l.label}</dt>
                      <dd className={`font-bold shrink-0 ${l.good ? "text-ok-text" : "text-ink"}`}>{l.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="border-t border-line pt-4 flex flex-col gap-3">
                  <div className="flex justify-between items-baseline gap-3">
                    <span className="text-[15px] text-muted">{guests > 1 ? "סה\"כ לכל החבורה" : "סה\"כ"}</span>
                    <span className="font-display font-bold text-[20px] text-ink">{eur(grandTotal)}</span>
                  </div>
                  {guests > 1 && <PerPerson amount={eur(perPerson)} size="lg" />}
                  <p className="text-[13px] text-muted">בתשלום בכרטיס נוספת עמלת סליקה של 1.9%.</p>
                </div>

                {/* split payment */}
                {guests > 1 && (
                  <div className="rounded-2xl bg-soft px-4 py-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-[15px] text-ink">כמה משלמים?</span>
                      <Stepper value={splitCount} onChange={setSplitCount} max={guests} label="כמה משלמים" />
                    </div>
                    {splitCount > 1 && (
                      <div className="rounded-xl bg-white border border-line px-3.5 py-3 text-[14px]">
                        <div className="flex justify-between font-bold text-ink text-[15px]">
                          <span>החלק שלכם לתשלום עכשיו</span>
                          <span>{eur(payNow)}</span>
                        </div>
                        <p className="text-muted mt-1 leading-relaxed">הסה&quot;כ ({eur(grandTotal)}) מתחלק שווה ל-{splitCount}. אחרי התשלום תקבלו קישור לשלוח לחברים.</p>
                      </div>
                    )}
                  </div>
                )}

                <CardPaymentButton apartmentId={id} apartment={apt?.name ?? ""} checkin={checkin} checkout={checkout}
                  guests={guests} nights={nights} skiPass={skiOn} transfer={transfer} equipment={equipment} cancel={cancel} service={service}
                  transferDetails={transferDetails}
                  flight={flightOn} flightPrice={bookFlightTotal + baggageTotal} flightDetails={bookFlightDetails}
                  grandTotal={payNow}
                  split={splitCount > 1 ? { sharesTotal: splitCount, accommodationTotal: grandTotal, shareAmount: shareAccommodation, area: "Val Thorens, Trois Vallées" } : undefined}
                  label={splitCount > 1 ? "לשלם את החלק שלכם בכרטיס" : "להזמנה ותשלום מאובטח"}
                  className={`${btn.primaryLg} w-full`} />
              </>
            )}

            {hasDates && datesTaken && (
              <Link href={`/search?checkin=${checkin}&checkout=${checkout}&guests=${guests}`} className={`${btn.outline} w-full`}>
                לדירות פנויות בתאריכים האלה
              </Link>
            )}
            {hasDates && laCimeNoMatch && (
              <Link href="/weekly" className={`${btn.outline} w-full`}>לכל הדירות שבת עד שבת</Link>
            )}

            {/* more actions */}
            <div className="grid grid-cols-3 gap-2 -mt-1">
              <SaveTripButton apartmentId={id} checkin={checkin} checkout={checkout} guests={guests}
                label="שמירה"
                className="flex flex-col min-[400px]:flex-row items-center justify-center gap-1 min-[400px]:gap-1.5 min-h-[56px] min-[400px]:min-h-[46px] px-2 rounded-xl border border-line hover:border-line-strong bg-white text-ink text-[14px] font-bold transition-colors" />
              <button type="button" onClick={handleSendQuote} disabled={creatingQuote || !canBook}
                className="flex flex-col min-[400px]:flex-row items-center justify-center gap-1 min-[400px]:gap-1.5 min-h-[56px] min-[400px]:min-h-[46px] px-2 rounded-xl border border-line hover:border-line-strong bg-white text-ink text-[14px] font-bold transition-colors disabled:opacity-45 disabled:hover:border-line">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg>
                {creatingQuote ? "רגע…" : "הצעת מחיר"}
              </button>
              <button type="button" onClick={() => { navigator.clipboard?.writeText("https://skisharebook.com" + window.location.pathname + window.location.search); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex flex-col min-[400px]:flex-row items-center justify-center gap-1 min-[400px]:gap-1.5 min-h-[56px] min-[400px]:min-h-[46px] px-2 rounded-xl border border-line hover:border-line-strong bg-white text-ink text-[14px] font-bold transition-colors">
                {copied ? <Check size={18} /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
                )}
                {copied ? "הועתק" : "שיתוף"}
              </button>
            </div>

            <CheckList className="text-[14px] text-body gap-1.5" items={[
              "כל אחד יכול לשלם את החלק שלו",
              "אפשר לבחור ביטול גמיש",
              <a key="wa" href={waBookHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-ink hover:text-accent transition-colors">
                שאלה? כותבים לנציג בוואטסאפ <IconWhatsApp size={16} className="text-[#128C4B]" />
              </a>,
            ]} />

            {canBook && stay?.source === "airbnb" && (
              <p className="text-[13px] leading-relaxed text-muted -mt-1">המחיר של הדירה לפי איירבנב לתאריכים האלה, ומתעדכן אם הוא משתנה שם.</p>
            )}
          </div>
        </aside>
      </div>

      {/* spacer so the end of the page clears the phone booking bar */}
      <div className="h-[92px] lg:hidden" aria-hidden="true" />

      {/* ── Phone booking bar ──────────────────────────────────── */}
      <div dir="rtl" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-line px-4 pt-3 flex items-center gap-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))", boxShadow: "0 -8px 24px rgba(11,27,51,0.08)" }}>
        <div className="flex-1 min-w-0 leading-tight">
          {!hasDates ? (
            <>
              <div className="font-bold text-[16px] text-ink">{agency ? "בחרו שבוע" : "בחרו תאריכים"}</div>
              <div className="text-[13px] text-muted">{agency ? "שבת עד שבת" : "המחיר לפי התאריכים"}</div>
            </>
          ) : !canBook ? (
            <div className="font-bold text-[15px] text-warn">{datesTaken ? "תפוס בתאריכים האלה" : "השבוע הזה לא פנוי"}</div>
          ) : splitCount > 1 ? (
            <>
              <div className="text-[13px] text-muted">החלק שלכם</div>
              <div className="font-display font-extrabold text-[22px] text-ink">{eur(payNow)}</div>
            </>
          ) : guests > 1 ? (
            <>
              <div className="flex items-baseline gap-1"><span className="font-display font-extrabold text-[22px] text-ink">{eur(perPerson)}</span><span className="text-[13px] text-muted">לאדם</span></div>
              <div className="text-[13px] text-muted">{eur(grandTotal)} לכל החבורה</div>
            </>
          ) : (
            <>
              <div className="text-[13px] text-muted">{weekMatch ? "סה\"כ, שבת עד שבת" : `סה"כ, ${nights} לילות`}</div>
              <div className="font-display font-extrabold text-[22px] text-ink">{eur(grandTotal)}</div>
            </>
          )}
        </div>
        <button type="button" onClick={() => toSummary(!canBook)} className={`${btn.primary} px-6`}>
          {canBook ? "להזמנה" : hasDates ? "לשנות תאריכים" : "בחירה"}
        </button>
      </div>

      {/* ── Photos, full screen ──────────────────────────────── */}
      {lightbox !== null && <Lightbox images={images} start={lightbox} name={apt.name} onClose={() => setLightbox(null)} />}

      {/* ── No-cancellation confirmation + signature ───────────── */}
      {showNoCancel && (
        <Modal title="בלי אפשרות ביטול" onClose={() => setShowNoCancel(false)}>
          <p className="text-[15px] leading-relaxed text-body mb-4">
            האפשרות הזו מוזילה את המחיר ב-{eur(CANCEL_NONE)}, אבל את ההזמנה <b className="text-ink">אי אפשר לבטל</b>, ולא יהיה החזר כספי, לפי התקנון.
          </p>
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input type="checkbox" checked={noCancelAgreed} onChange={e => setNoCancelAgreed(e.target.checked)} className="mt-1 w-5 h-5 shrink-0 accent-[#1652F0]" />
            <span className="text-[15px] text-body leading-relaxed">קראתי והבנתי <b className="text-ink">שלא אוכל לבטל את ההזמנה</b> ולא אקבל החזר כספי בשום מקרה, ו<a href="/terms" target="_blank" rel="noopener noreferrer" className="text-accent font-bold underline">התקנון</a> מקובל עליי.</span>
          </label>
          <label className="block mb-4">
            <span className={fieldLabel}>חתימה (שם מלא)</span>
            <input value={signature} onChange={e => setSignature(e.target.value)} placeholder="השם המלא שלכם" className={field} />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={!noCancelAgreed || signature.trim().length < 2}
              onClick={() => { setCancel("none"); setShowNoCancel(false); }}
              className={`${btn.primary} flex-1`}>אישור וחתימה</button>
            <button type="button" onClick={() => setShowNoCancel(false)} className={btn.outline}>ביטול</button>
          </div>
        </Modal>
      )}

      {/* ── Quote share popup ──────────────────────────────────── */}
      {quoteUrl && (
        <Modal title="הצעת המחיר מוכנה" onClose={() => setQuoteUrl(null)}>
          <p className="text-[15px] leading-relaxed text-body mb-5">אפשר לשלוח את הקישור. הוא נפתח באפליקציה אם היא מותקנת, ואם לא, בדפדפן.</p>
          <label className="block mb-5">
            <span className={fieldLabel}>הקישור להצעה</span>
            <div className="flex gap-2">
              <input readOnly value={quoteUrl} dir="ltr" className={`${field} text-[14px] text-right bg-soft min-w-0`} onFocus={e => e.currentTarget.select()} />
              <button type="button" onClick={() => copyTo(quoteUrl, "web")} className={`${btn.primary} px-5 shrink-0`}>
                {qCopied === "web" ? "הועתק" : "העתקה"}
              </button>
            </div>
          </label>
          <div className="flex gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(`הצעת מחיר ל-${apt?.name ?? "דירה"} 🎿\n${quoteUrl}`)}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-[14px] bg-[#128C4B] hover:bg-[#0F7A40] text-white font-bold transition-colors">
              <IconWhatsApp size={18} /> לשלוח בוואטסאפ
            </a>
            <a href={quoteUrl} target="_blank" rel="noopener noreferrer" className={btn.outline}>לפתוח</a>
          </div>
        </Modal>
      )}

      {/* ── Transfer flight details ────────────────────────────── */}
      <FlightDetailsModal open={showTransfer} onClose={() => setShowTransfer(false)} value={flight} onChange={setFlight} />

      {/* ── AI service info ────────────────────────────────────── */}
      {showAiInfo && (
        <Modal title="איך עובד שירות AI?" onClose={() => setShowAiInfo(false)}>
          <CheckList className="text-[15px] leading-relaxed text-body gap-3" items={[
            "מקבלים את הכתובת המלאה ואת שעות הצ'ק-אין והצ'ק-אאוט.",
            "המפתחות מחכים לכם בדלת כ-48 שעות לפני ההגעה. את הדירה מפנים בשעת הצ'ק-אאוט הרגילה.",
            "אם הזמנתם סקי פס, אוספים אותו בעצמכם מהמכונה במהלך השהות.",
            "לאורך החופשה עוזר AI בצ'אט עונה על כל שאלה.",
            "במקרים חריגים (נזק בדירה, מקרה חירום) אפשר תמיד לפנות לנציגים שלנו דרך האתר.",
          ]} />
          <button type="button" onClick={() => setShowAiInfo(false)} className={`${btn.primary} w-full mt-5`}>הבנתי</button>
        </Modal>
      )}
    </div>
  );
}

// a new number of guests starts the page fresh (the per-person add-ons count from it)
function ApartmentPageKeyed(props: Initial) {
  const params = useSearchParams();
  return <ApartmentPage key={params.get("guests") ?? ""} {...props} />;
}

export default function ApartmentClient(props: Initial) {
  return (
    <Suspense fallback={<SkiLoader label="רגע, טוענים את הדירה…" />}>
      <ApartmentPageKeyed {...props} />
    </Suspense>
  );
}
