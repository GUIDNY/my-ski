"use client";
import { BANK } from "@/lib/bank";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Apartment, SkiPass } from "@/types";
import {
  IconCalendar, IconChevronLeft, IconImage, IconBank, IconCreditCard,
  IconUsers, IconWhatsApp, IconShield, IconUser, IconBot, IconBus, IconMountain,
} from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";
import { skiDaysFromNights, equipCost } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import { TRANSFER_PRICE, BAGGAGE_PRICE, LIFT_DATES, liftsOpenForStay, packagePassArea, passTier, shortDate, type PassArea } from "@/lib/deal-pricing";
import { encodeExtras, type QuoteExtras } from "@/lib/quote-extras";
import { quoteLines, nightsBetween, FLEXIBLE_EXTRA, NO_CANCEL_DISCOUNT, AI_DISCOUNT } from "@/lib/quote-lines";
import { useDirectFlight, useReturnLeg } from "@/lib/useFlightPrice";
import { flightOrderText } from "@/lib/flight-format";
import FlightAddOn from "@/components/FlightAddOn";
import CardPaymentButton from "@/components/CardPaymentButton";
import FlightDetailsModal, { EMPTY_FLIGHT, flightToString, flightFilled, type Flight } from "@/components/FlightDetailsModal";
import { wrap, card, h1, h2, btn, chip, Crumbs, CheckList, Check, PerPerson, EmptyState } from "@/components/ui";
import OpenChatButton from "@/components/OpenChatButton";
import { helperWaHref } from "@/lib/helper-whatsapp";

/* ── Add-on icons ──────────────────────────────────────────── */
const svgBase = (s: number) => ({ width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });
const AdPass = ({ size = 20 }: { size?: number }) => ( // gondola / lift pass
  <svg {...svgBase(size)}><path d="M2.5 5.5 21.5 9" /><path d="M12 6.7V9.5" /><rect x="6.5" y="9.5" width="11" height="8" rx="2.2" /><path d="M6.5 13.5h11" /><path d="M12 9.5v8" /></svg>
);
const AdSkis = ({ size = 20 }: { size?: number }) => ( // crossed skis
  <svg {...svgBase(size)}><path d="M7.5 3.2 13.5 19.5" /><path d="M16.5 3.2 10.5 19.5" /><path d="M5.4 19.6c1.2.9 2.4.9 3.6 0" /><path d="M14.9 19.6c1.2.9 2.4.9 3.6 0" /></svg>
);
const AdShuttle = ({ size = 20 }: { size?: number }) => ( // shuttle van
  <svg {...svgBase(size)}><path d="M3 12.5 4.4 7.4A2 2 0 0 1 6.3 6h8.4a2 2 0 0 1 1.7 1l2.1 3.4 1.6.5a1.6 1.6 0 0 1 1.1 1.5v2.1a1 1 0 0 1-1 1h-1.1" /><path d="M3 12.5v2.5a1 1 0 0 0 1 1h1.2" /><circle cx="7.6" cy="16" r="1.9" /><circle cx="16.6" cy="16" r="1.9" /><path d="M9.5 16h5.2" /><path d="M3.4 12.5H17" /><path d="M10.2 6.2v6" /></svg>
);
const AdLesson = ({ size = 20 }: { size?: number }) => ( // instructor + slalom flag
  <svg {...svgBase(size)}><circle cx="8.5" cy="4.6" r="2.1" /><path d="M8.5 7v4.5" /><path d="M8.5 8.8 6 11" /><path d="M8.5 8.8 11 10.3" /><path d="M6 11l-1 6" /><path d="M11 10.3l1.4 6.7" /><path d="M17 3.5v15" /><path d="M17 4c1.9 1 2.9 1 3.8 0v3.6c-.9 1-1.9 1-3.8 0z" fill="currentColor" stroke="none" /></svg>
);
const IcoPin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
const IcoChevron = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
);

export type QuoteData = {
  apartmentId: string;
  apartment: string;
  checkin: string;
  checkout: string;
  guests: number;
  nights: number;
  skiPass: boolean;
  transfer: boolean;
  cancel: string;
  service: string;
  aptTotal: number;
  grandTotal: number;
  /** equipment from the quote row (older rows have none) */
  equipment?: boolean;
  /** what was picked on the apartment page, from the quote link (?x=) */
  extras?: QuoteExtras | null;
  /** the short quote id, for its PDF */
  quoteId?: string | null;
};

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;
};
// "16–23 בינואר" / "30 בינואר – 6 בפברואר"
const rangeLabel = (ci: string, co: string) => {
  if (!ci || !co) return fmtDate(ci) || fmtDate(co);
  const a = new Date(ci + "T12:00:00"), b = new Date(co + "T12:00:00");
  return a.getMonth() === b.getMonth()
    ? `\u2066${a.getDate()}\u2060–\u2060${b.getDate()}\u2069 ב${HE_MONTHS[b.getMonth()]}`
    : `${a.getDate()} ב${HE_MONTHS[a.getMonth()]} – ${b.getDate()} ב${HE_MONTHS[b.getMonth()]}`;
};
const eur = (n: number) => `€${Math.round(n).toLocaleString()}`;

// prices: deal-pricing.ts (transfer, bag) and quote-lines.ts (cancellation, AI service)

// the page address, read in the browser only (for the WhatsApp message)
const noSubscribe = () => () => {};

/** An offer link that doesn't open (wrong or old link): a way forward. */
export function QuoteNotFound({
  title = "ההצעה לא נמצאה",
  text = "אולי הקישור כבר לא בתוקף. תכתבו לנו ונכין לכם הצעה חדשה, עם דירה, סקי פס, הסעה וציוד.",
}: { title?: string; text?: string }) {
  return (
    <div className={`${wrap} flex-1 flex items-center justify-center py-14 md:py-20`} dir="rtl">
      <EmptyState className="w-full max-w-[640px]" title={<h1>{title}</h1>} text={text}
        action={<>
          <OpenChatButton className={btn.primary}>לכתוב לעוזר שלנו</OpenChatButton>
          <a href={helperWaHref("היי, הקישור להצעה לא נפתח לי")} target="_blank" rel="noopener noreferrer" className={btn.outline}>
            <span className="text-[#128C4B]"><IconWhatsApp size={18} /></span>וואטסאפ
          </a>
          <Link href="/" className={btn.outline}>לדף הבית</Link>
        </>} />
    </div>
  );
}

/** A map link from map_url: a plain URL, or the src of an embed <iframe>. */
export function mapLink(mapUrl?: string | null): string | null {
  if (!mapUrl) return null;
  const src = mapUrl.match(/src="([^"]+)"/)?.[1] ?? mapUrl.trim();
  return /^https?:\/\//.test(src) ? src : null;
}

/** "−  2  +" for how many people need an add-on. */
const ilDate = (iso: string) => { const [y, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}.${y}`; };

/** label / value rows in one white card (the look of the bots' quotes) */
function SumRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className={`${card} divide-y divide-line`}>
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-4 px-4 md:px-5 py-3">
          <dt className="text-[15px] text-muted">{k}</dt>
          <dd className="text-[15px] font-bold text-ink text-left">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Switch({ on, onClick, label, disabled }: { on: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} disabled={disabled}
      className={`relative shrink-0 w-[46px] h-[28px] rounded-full transition-colors disabled:opacity-40 ${on ? "bg-accent" : "bg-line-strong"}`}>
      <span className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-[right] ${on ? "right-[3px]" : "right-[21px]"}`} />
    </button>
  );
}

/** one line of the price: title, detail, amount and (for add-ons) a switch */
function LineRow({ title, sub, amount, on, onToggle, disabled, children }: {
  title: string; sub?: string; amount: string; on?: boolean; onToggle?: () => void; disabled?: boolean; children?: React.ReactNode;
}) {
  const off = onToggle && !on;
  return (
    <div className="px-4 md:px-5 py-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-[15px] md:text-[16px] font-bold ${off ? "text-muted" : "text-ink"}`}>{title}</p>
          {sub && <p className="text-[13px] md:text-[14px] text-muted mt-0.5">{sub}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {amount && <span className={`text-[15px] md:text-[16px] font-bold tabular-nums ${off ? "text-muted" : "text-ink"}`}>{amount}</span>}
          {onToggle && <Switch on={!!on} onClick={onToggle} disabled={disabled} label={`${title}: ${on ? "להוריד" : "להוסיף"}`} />}
        </div>
      </div>
      {children}
    </div>
  );
}

function MiniQty({ label, qty, setQty, max }: { label: string; qty: number; setQty: (fn: (n: number) => number) => void; max: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[14px] text-muted">{label}</span>
      <button type="button" onClick={() => setQty(n => Math.max(1, n - 1))} disabled={qty <= 1} aria-label="פחות"
        className="w-9 h-9 rounded-full border border-line-strong bg-white text-ink text-[18px] leading-none disabled:opacity-40">−</button>
      <span className="font-bold text-[16px] text-ink w-5 text-center tabular-nums" aria-live="polite">{qty}</span>
      <button type="button" onClick={() => setQty(n => Math.min(max, n + 1))} disabled={qty >= max} aria-label="עוד"
        className="w-9 h-9 rounded-full border border-line-strong bg-white text-ink text-[18px] leading-none disabled:opacity-40">+</button>
    </div>
  );
}

function QStep({ show, label, qty, setQty, max, total }: {
  show: boolean; label: string; qty: number; setQty: (n: number) => void; max: number; total: number;
}) {
  if (!show) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 rounded-2xl bg-soft border border-line">
      <span className="text-[14px] font-bold text-ink">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="פחות"
          className="w-11 h-11 rounded-full bg-white border border-line-strong text-ink text-[20px] leading-none disabled:opacity-40">−</button>
        <span className="font-display font-bold text-[18px] text-ink w-6 text-center" aria-live="polite">{qty}</span>
        <button type="button" onClick={() => setQty(Math.min(max, qty + 1))} disabled={qty >= max} aria-label="עוד"
          className="w-11 h-11 rounded-full bg-white border border-line-strong text-ink text-[20px] leading-none disabled:opacity-40">+</button>
        <span className="text-[14px] font-bold text-ink min-w-[64px] text-left tabular-nums">{eur(total)}</span>
      </div>
    </div>
  );
}

/** An add-on that can be switched on and off, as a card. */
function AddOnToggle({ icon, title, sub, price, on, onToggle, disabled }: {
  icon: ReactNode; title: string; sub: string; price?: string; on: boolean; onToggle: () => void; disabled?: boolean;
}) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-disabled={disabled || undefined} onClick={() => { if (!disabled) onToggle(); }}
      className={`w-full flex items-start gap-3.5 p-4 rounded-[18px] border text-start transition-colors ${disabled ? "border-dashed border-line-strong bg-soft/60 cursor-not-allowed" : on ? "border-accent ring-1 ring-accent bg-accent-soft/60" : "border-line bg-white hover:border-line-strong"}`}>
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${on ? "bg-accent text-white" : disabled ? "bg-white text-muted" : "bg-accent-soft text-accent"}`}>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[16px] font-bold text-ink">{title}</span>
        <span className="block text-[14px] text-muted leading-snug mt-0.5">{sub}</span>
        {price && <span className={`block text-[15px] font-bold mt-1.5 tabular-nums ${disabled ? "text-muted" : "text-ink"}`}>{price}</span>}
      </span>
      <span className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${on ? "bg-accent border-accent text-white" : "border-line-strong bg-white"}`} aria-hidden="true">
        {on && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10" /></svg>}
      </span>
    </button>
  );
}

const IcoPdf = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M12 12v6M9.5 15.5 12 18l2.5-2.5" /></svg>
);

/** One choice in a group (cancellation, service level), as a selectable card. */
function QRadio({ label, sublabel, badge, badgeTone = "neutral", selected, onClick }: {
  label: string; sublabel: string; badge?: string; badgeTone?: "good" | "neutral"; selected: boolean; onClick: () => void;
}) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onClick}
      className={`w-full h-full flex items-start gap-3 p-4 rounded-[18px] border text-start transition-colors ${selected ? "border-accent ring-1 ring-accent bg-accent-soft/60" : "border-line bg-white hover:border-line-strong"}`}>
      <span className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${selected ? "border-accent" : "border-line-strong"}`} aria-hidden="true">
        {selected && <span className="w-2.5 h-2.5 rounded-full bg-accent" />}
      </span>
      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-[16px] font-bold text-ink">{label}</span>
          {badge && <span className={`text-[13px] font-bold px-2 py-0.5 rounded-full ${badgeTone === "good" ? "bg-ok-soft text-ok-text" : "bg-soft text-ink border border-line"}`}>{badge}</span>}
        </span>
        <span className="text-[14px] leading-snug text-muted">{sublabel}</span>
      </span>
    </button>
  );
}

/** Photos: a grid on desktop, one photo with arrows on the phone. */
export function PhotoGallery({ imgs, name, idx, setIdx, onOpen }: {
  imgs: string[]; name: string; idx: number; setIdx: (n: number) => void; onOpen: (i: number) => void;
}) {
  const many = imgs.length >= 3;
  return (
    <>
      {/* desktop grid */}
      <div className={`hidden md:grid relative rounded-card overflow-hidden gap-2.5 ${many ? "grid-cols-3 grid-rows-[220px_220px]" : "grid-cols-1 h-[440px]"}`}>
        <button type="button" onClick={() => onOpen(0)} className={`relative group overflow-hidden bg-soft-2 ${many ? "col-span-2 row-span-2" : ""}`} aria-label="לראות את התמונות בגדול">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[0]} alt={`${name}, תמונה 1`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        </button>
        {many && imgs.slice(1, 3).map((src, i) => (
          <button key={src + i} type="button" onClick={() => onOpen(i + 1)} className="relative group overflow-hidden bg-soft-2" aria-label={`תמונה ${i + 2} בגדול`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${name}, תמונה ${i + 2}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          </button>
        ))}
        {imgs.length > 1 && (
          <button type="button" onClick={() => onOpen(0)}
            className="absolute bottom-3.5 left-3.5 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-white text-ink text-[15px] font-bold hover:bg-soft transition-colors">
            <IconImage size={16} /> כל {imgs.length} התמונות
          </button>
        )}
      </div>

      {/* phone: one photo at a time */}
      <div className="md:hidden relative rounded-card overflow-hidden h-[260px] sm:h-[340px] bg-soft-2">
        <button type="button" onClick={() => onOpen(idx)} className="block w-full h-full" aria-label="לראות את התמונות בגדול">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[idx]} alt={`${name}, תמונה ${idx + 1}`} className="w-full h-full object-cover" />
        </button>
        {imgs.length > 1 && (
          <>
            <button type="button" onClick={() => setIdx((idx - 1 + imgs.length) % imgs.length)} aria-label="התמונה הקודמת"
              className="absolute top-1/2 right-3 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-ink flex items-center justify-center">
              <IconChevronLeft size={18} className="rotate-180" />
            </button>
            <button type="button" onClick={() => setIdx((idx + 1) % imgs.length)} aria-label="התמונה הבאה"
              className="absolute top-1/2 left-3 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-ink flex items-center justify-center">
              <IconChevronLeft size={18} />
            </button>
            <span dir="ltr" className="absolute top-3 left-3 rounded-full bg-ink/70 text-white text-[13px] font-bold px-2.5 py-1 tabular-nums" aria-hidden="true">{idx + 1} / {imgs.length}</span>
            <button type="button" onClick={() => onOpen(idx)}
              className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-xl bg-white text-ink text-[14px] font-bold">
              <IconImage size={15} /> כל התמונות
            </button>
          </>
        )}
      </div>
    </>
  );
}

/** Full-screen photos. Esc closes, the arrow keys move. */
export function Lightbox({ imgs, index, setIndex, name }: {
  imgs: string[]; index: number | null; setIndex: (fn: (v: number | null) => number | null) => void; name: string;
}) {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(() => null);
      else if (e.key === "ArrowLeft") setIndex(v => (v === null ? v : (v + 1) % imgs.length));
      else if (e.key === "ArrowRight") setIndex(v => (v === null ? v : (v - 1 + imgs.length) % imgs.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, imgs.length, setIndex]);

  if (index === null) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-ink/95 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="תמונות"
      onClick={() => setIndex(() => null)}>
      <button type="button" onClick={() => setIndex(() => null)} aria-label="סגירה"
        className="absolute top-4 left-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-[22px] transition-colors">✕</button>
      <span dir="ltr" className="absolute top-6 right-6 text-white/80 text-[14px] font-bold tabular-nums">{index + 1} / {imgs.length}</span>

      <button type="button" aria-label="התמונה הקודמת" onClick={(e) => { e.stopPropagation(); setIndex(v => (v === null ? v : (v - 1 + imgs.length) % imgs.length)); }}
        className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
        <IconChevronLeft size={22} className="rotate-180" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgs[index]} alt={`${name}, תמונה ${index + 1}`} onClick={(e) => e.stopPropagation()}
        className="max-w-[92vw] max-h-[78vh] md:max-h-[82vh] object-contain rounded-xl" />
      <button type="button" aria-label="התמונה הבאה" onClick={(e) => { e.stopPropagation(); setIndex(v => (v === null ? v : (v + 1) % imgs.length)); }}
        className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
        <IconChevronLeft size={22} />
      </button>

      <div className="absolute bottom-5 inset-x-0 flex justify-center gap-2 px-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
        {imgs.map((src, i) => (
          <button key={src + i} type="button" onClick={() => setIndex(() => i)} aria-label={`תמונה ${i + 1}`}
            className={`w-14 h-14 rounded-lg overflow-hidden ring-2 shrink-0 transition ${i === index ? "ring-white" : "ring-white/20 opacity-60 hover:opacity-100"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function QuoteView({ q }: { q: QuoteData }) {
  const { apartmentId, apartment, checkin, checkout } = q;
  const guests = Math.max(q.guests || 1, 1);
  const ex = q.extras ?? null;
  const dealArea = packagePassArea(checkin, checkout);

  const [apt, setApt] = useState<Apartment | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const pageUrl = useSyncExternalStore(noSubscribe, () => window.location.href, () => "");
  const [showTransfer, setShowTransfer] = useState(false);
  const [flight, setFlight] = useState<Flight>(EMPTY_FLIGHT);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [passes, setPasses] = useState<SkiPass[]>([]);
  const [showNights, setShowNights] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  // What's picked: what the quote link carries (?x=, from the apartment
  // page), else the quote's own yes/no fields; the whole group by default.
  const [passOn, setPassOn] = useState(ex ? !!ex.pass : q.skiPass && !!dealArea);
  const [passArea, setPassArea] = useState<PassArea>(ex?.pass?.area ?? dealArea ?? "val_thorens");
  const [passQty, setPassQty] = useState(ex?.pass?.qty ?? guests);
  const [transferOn, setTransferOn] = useState(ex ? !!ex.transfer : q.transfer);
  const [transferQty, setTransferQty] = useState(ex?.transfer?.qty ?? guests);
  const [equipmentOn, setEquipmentOn] = useState(ex ? !!ex.equipment : !!q.equipment);
  const [equipQty, setEquipQty] = useState(ex?.equipment?.qty ?? guests);
  const [flightOn, setFlightOn] = useState(!!ex?.flight);
  const [flightQty, setFlightQty] = useState(ex?.flight?.qty ?? guests);
  const [bagOn, setBagOn] = useState(!!ex?.bag);
  const [bagQty, setBagQty] = useState(ex?.bag?.qty ?? guests);
  const [cancel, setCancel] = useState(q.cancel === "flexible" || q.cancel === "none" ? q.cancel : "regular");
  const [service, setService] = useState(q.service === "ai" ? "ai" : "human");
  const [showNoCancel, setShowNoCancel] = useState(false);
  const [noCancelAgreed, setNoCancelAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [pdfState, setPdfState] = useState<"" | "busy" | "error" | "link">("");
  const transferDetails = transferOn ? flightToString(flight) : "";

  useEffect(() => {
    if (!apartmentId) return;
    fetch(`/api/pricing-rules?apartment_id=${apartmentId}`).then(r => r.json()).then(d => setRules(Array.isArray(d) ? d : [])).catch(() => {});
  }, [apartmentId]);

  useEffect(() => {
    if (!apartmentId) return;
    fetch(`/api/apartments/${apartmentId}`).then(r => r.json()).then(d => setApt(d && d.id ? d : null)).catch(() => {});
  }, [apartmentId]);

  useEffect(() => {
    fetch("/api/ski-passes").then(r => r.json()).then(d => setPasses(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  /* the flight: only a real direct round trip, at its live price */
  const direct = useDirectFlight(checkin, checkout);
  const directFlight = direct.status === "found" ? direct.flight : null;
  const flightEff = flightOn && !!directFlight;
  const bagEff = bagOn && flightEff;
  const returnLeg = useReturnLeg(directFlight, checkin, checkout, flightEff);

  const nights = nightsBetween(checkin, checkout) || q.nights;
  // a stay of N nights gives N-1 ski days (arrival and departure days aren't on the slopes)
  const skiDays = skiDaysFromNights(nights);
  const equipUnit = equipCost(skiDays);
  const passOpen = (a: PassArea) => liftsOpenForStay(a, checkin, checkout);
  const tierOf = (a: PassArea) => passTier(passes, a, skiDays);
  const passEff = passOn && passOpen(passArea) && !!tierOf(passArea);

  const picked: QuoteExtras = {
    pass: passEff ? { area: passArea, qty: passQty } : undefined,
    transfer: transferOn ? { qty: transferQty } : undefined,
    equipment: equipmentOn && skiDays > 0 ? { qty: equipQty } : undefined,
    flight: flightEff ? { qty: flightQty } : undefined,
    bag: bagEff ? { qty: bagQty } : undefined,
  };
  // every line and the total, priced live, the same way the PDF prices them
  const calc = quoteLines({ apt, rules, passes, checkin, checkout, guests, extras: picked, cancel, service, flight: directFlight, fallbackAptTotal: q.aptTotal });
  const amountOf = (key: string) => calc.lines.find(l => l.key === key)?.amount ?? 0;
  const liveTotal = calc.total;
  const perPerson = calc.perPerson;
  const nightly = calc.stay?.nights ?? [];
  const cleaningFee = calc.cleaningFee;
  const baseApt = calc.aptTotal;
  const flightText = flightEff && directFlight
    ? flightOrderText(directFlight, returnLeg.leg, checkin, checkout, flightQty, bagEff ? { qty: bagQty, unit: BAGGAGE_PRICE } : null)
    : "";

  // split payment: divide the FULL total (lodging + all add-ons) equally between payers
  const shareBase = Math.round(liveTotal / splitCount);
  const payNow = splitCount > 1 ? shareBase : liveTotal;
  const splitProp = splitCount > 1 ? { sharesTotal: splitCount, accommodationTotal: liveTotal, shareAmount: shareBase, area: "Val Thorens, Trois Vallées" } : undefined;

  const imgs = apt?.images?.length ? apt.images : ["/view.jpg", "/chalet-interior.jpg"];
  const avgNightly = nights > 0 ? Math.round((baseApt - cleaningFee) / nights) : baseApt;
  const fmtFull = (d: Date) => `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;
  const mapHref = mapLink(apt?.map_url);
  const meta = [
    "ואל טורנס",
    apt?.max_guests ? `עד ${apt.max_guests} אנשים` : "",
    apt?.sqm ? `${apt.sqm} מ"ר` : "",
  ].filter(Boolean).join(" · ");

  /* ── The quote as a PDF, as picked right now ─────────────── */
  const pickedCode = encodeExtras(picked);
  const pdfHref = `/api/quote-pdf?${new URLSearchParams({
    apartment_id: apartmentId, name: apartment, checkin, checkout, guests: String(guests), cancel, service,
    ...(pickedCode ? { x: pickedCode } : {}),
    ...(q.quoteId ? { q: q.quoteId } : {}),
    ...(flightEff && returnLeg.leg?.departTime && returnLeg.leg.arriveTime ? { rd: returnLeg.leg.departTime, ra: returnLeg.leg.arriveTime } : {}),
    // the outbound times and airline as shown here (the flight cache may not keep them)
    ...(flightEff && directFlight?.departTime && directFlight.arriveTime ? { od: directFlight.departTime, oa: directFlight.arriveTime } : {}),
    ...(flightEff && directFlight?.airline ? { al: directFlight.airline } : {}),
  }).toString()}`;
  // Phones (and the app) get the share sheet with the file: save it, send it
  // on WhatsApp. Without it, the app opens the PDF in Safari from a link the
  // person taps; a computer downloads the file.
  const getPdf = async () => {
    if (pdfState === "busy") return;
    const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
    const inApp = !!w.Capacitor?.isNativePlatform?.();
    const phone = inApp || /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent);
    setPdfState("busy");
    try {
      const res = await fetch(pdfHref);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const fileName = `SkiShare - ${apartment}.pdf`.replace(/[\\/:*?"<>|]/g, "");
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (phone && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: `הצעת מחיר, ${apartment}` }); } catch { /* the share sheet was closed */ }
        setPdfState("");
      } else if (phone) {
        setPdfState("link");
      } else {
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href; a.download = fileName;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(href), 30000);
        setPdfState("");
      }
    } catch {
      setPdfState("error");
    }
  };
  const pdfButton = (
    <div className="flex flex-col gap-1.5">
      <button type="button" onClick={getPdf} disabled={pdfState === "busy"} className={`${btn.outline} w-full`}>
        <IcoPdf /> {pdfState === "busy" ? "מכינים את ה-PDF…" : "הצעת המחיר כ-PDF"}
      </button>
      {pdfState === "link" && <a href={pdfHref} target="_blank" rel="noopener" className={`${btn.link} self-center min-h-[44px]`}>לפתוח את ה-PDF</a>}
      {pdfState === "error" && <p className="text-[13px] text-danger text-center">לא הצלחנו להכין PDF כרגע. אפשר לנסות שוב עוד רגע.</p>}
    </div>
  );

  const bank = BANK;

  /* ── WhatsApp link with pre-filled booking summary ──────── */
  const waHref = buildWaHref({
    intro: "היי! 👋 אני מעוניין/ת בהצעת המחיר הבאה:",
    lines: [
      `🏔️ דירה: ${apartment}`,
      `📅 תאריכים: ${fmtDate(checkin)} — ${fmtDate(checkout)} (${nights} לילות)`,
      `👥 אורחים: ${guests}`,
      ...calc.lines.filter(l => l.key !== "stay").map(l => `• ${l.label}: ${l.amount < 0 ? `−€${-l.amount}` : `€${l.amount}`}`),
      transferDetails ? `🚐 פרטי הטיסה להסעה: ${transferDetails}` : null,
      flightText ? `✈️ ${flightText}` : null,
    ],
    total: liveTotal,
    pageUrl: pageUrl ? `ההצעה: ${pageUrl}` : undefined,
  });

  const breakdownRows = (
    <>
      <div className="py-2.5">
        <button type="button" onClick={() => setShowNights(v => !v)} aria-expanded={showNights} disabled={!nightly.length}
          className="w-full flex items-start justify-between gap-3 text-start">
          <span className="min-w-0">
            <span className="block text-[15px] text-ink">{calc.weekly ? "לינה, שבוע שלם (שבת עד שבת)" : `לינה, ${nights} לילות${cleaningFee > 0 ? ", כולל ניקיון" : ""}`}</span>
            {!calc.weekly && (
              <span className="flex items-center gap-1 text-[13px] text-muted mt-0.5">
                {eur(avgNightly)} ממוצע ללילה{cleaningFee > 0 ? ` + ${eur(cleaningFee)} ניקיון` : ""}
                {nightly.length > 0 && <span className="inline-flex items-center gap-0.5 text-accent font-bold">· פירוט <IcoChevron open={showNights} /></span>}
              </span>
            )}
          </span>
          <span className="text-[15px] font-bold tabular-nums text-ink shrink-0">{eur(baseApt)}</span>
        </button>
        {showNights && nightly.length > 0 && (
          <div className="mt-2.5 rounded-xl border border-line overflow-hidden">
            <div className="max-h-48 overflow-y-auto divide-y divide-line">
              {nightly.map((n, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 text-[13px]">
                  <span className="text-muted">{fmtFull(n.date)}</span>
                  <span className="font-bold text-ink tabular-nums">{eur(n.price)}</span>
                </div>
              ))}
              {cleaningFee > 0 && (
                <div className="flex items-center justify-between px-3 py-2 text-[13px]">
                  <span className="text-muted">ניקיון (פעם אחת)</span>
                  <span className="font-bold text-ink tabular-nums">{eur(cleaningFee)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {calc.lines.filter(l => l.key !== "stay").map(l => (
        <PriceRow key={l.key} label={l.label} sub={l.sub} amount={l.amount < 0 ? `−${eur(-l.amount)}` : eur(l.amount)} good={l.amount < 0} />
      ))}
    </>
  );

  const splitSelector = (
    <div className="rounded-2xl border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="block text-[15px] font-bold text-ink">כמה משלמים?</span>
          <span className="block text-[13px] text-muted">עד {guests} · כל אחד משלם את החלק שלו</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => setSplitCount(n => Math.max(1, n - 1))} disabled={splitCount <= 1} aria-label="פחות משלמים"
            className="w-11 h-11 rounded-full border border-line-strong bg-white text-ink text-[20px] leading-none disabled:opacity-40">−</button>
          <span className="font-display font-bold text-[18px] text-ink w-6 text-center" aria-live="polite">{splitCount}</span>
          <button type="button" onClick={() => setSplitCount(n => Math.min(guests, n + 1))} disabled={splitCount >= guests} aria-label="עוד משלם"
            className="w-11 h-11 rounded-full border border-line-strong bg-white text-ink text-[20px] leading-none disabled:opacity-40">+</button>
        </div>
      </div>
      {splitCount > 1 && (
        <div className="bg-accent-soft rounded-xl px-3.5 py-3 mt-3">
          <div className="flex justify-between gap-3 text-[15px] font-bold text-ink"><span>החלק של כל אחד</span><span className="tabular-nums">{eur(payNow)}</span></div>
          <p className="text-[13px] text-body mt-1 leading-snug">הסה&quot;כ {eur(liveTotal)} (כולל כל התוספות) חלקי {splitCount}. אחרי התשלום תקבלו קישור לשלוח לחברים.</p>
        </div>
      )}
    </div>
  );

  const payLabel = splitCount > 1 ? "לתשלום החלק שלי בכרטיס" : undefined;
  const payButton = (
    <CardPaymentButton apartmentId={apartmentId} apartment={apartment} checkin={checkin} checkout={checkout}
      guests={guests} nights={nights} skiPass={passEff} transfer={transferOn} equipment={!!picked.equipment} transferDetails={transferDetails} cancel={cancel} service={service}
      flight={flightEff} flightPrice={amountOf("flight") + amountOf("bag")} flightDetails={flightText || undefined}
      grandTotal={payNow} split={splitProp} label={payLabel}
      className={`${btn.primaryLg} w-full`} />
  );
  const waButton = (
    <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${btn.outline} w-full`}>
      <span className="text-[#128C4B]"><IconWhatsApp size={20} /></span> לדבר עם נציג בוואטסאפ
    </a>
  );

  const totals = (
    <>
      <div className="border-t border-line pt-3.5 flex justify-between items-baseline gap-3">
        <span className="text-[15px] text-muted">סה&quot;כ לכל החבורה</span>
        <span className="font-bold text-[18px] text-ink tabular-nums">{eur(liveTotal)}</span>
      </div>
      {guests > 1 ? (
        <div className="flex flex-col gap-1">
          <PerPerson amount={eur(perPerson)} size="lg" />
          <span className="text-[14px] text-muted">ל-{guests} אנשים · {nights} לילות</span>
        </div>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="font-display font-extrabold text-[40px] leading-none text-ink">{eur(liveTotal)}</span>
          <span className="text-[15px] text-muted">{nights} לילות</span>
        </div>
      )}
    </>
  );

  const trust = (
    <CheckList className="text-body" items={["כל אחד משלם את החלק שלו", "עד 3 תשלומים בלי ריבית", "תשלום מאובטח · PayPlus"]} />
  );

  const choiceNoCancel = () => setShowNoCancel(true);

  return (
    <div className="bg-white text-ink" dir="rtl">
      {/* ── top: where we are, the title, dates and guests, photos ── */}
      <div className={`${wrap} pt-5 md:pt-7`}>
        <Crumbs items={[{ label: "דף הבית", href: "/" }, { label: "הצעת מחיר" }, { label: apartment }]} />
        <div className="flex flex-wrap items-end justify-between gap-4 mt-3 md:mt-4">
          <div className="flex flex-col gap-2 min-w-0">
            <span className="self-start inline-flex items-center rounded-full bg-accent-soft text-accent text-[13px] font-bold px-3 py-1">הצעת מחיר אישית</span>
            <h1 className={h1}>{apartment}</h1>
            <span className="text-[16px] md:text-[17px] text-muted">{meta}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {checkin && checkout && (
              <span className={chip}><span className="text-accent"><IconCalendar size={16} /></span>{rangeLabel(checkin, checkout)} · {nights} לילות</span>
            )}
            <span className={chip}><span className="text-accent"><IconUsers size={16} /></span>{guests} אנשים</span>
            <button type="button" onClick={getPdf} disabled={pdfState === "busy"} className={`${chip} hover:border-line-strong transition-colors`}>
              <span className="text-accent"><IcoPdf /></span>{pdfState === "busy" ? "מכינים…" : "PDF"}
            </button>
          </div>
        </div>
        <div className="mt-5 md:mt-6">
          <PhotoGallery imgs={imgs} name={apartment} idx={Math.min(imgIdx, imgs.length - 1)} setIdx={setImgIdx} onOpen={setLightbox} />
        </div>
      </div>

      <div className={`${wrap} pt-7 md:pt-9 pb-10 lg:pb-24 flex flex-col lg:flex-row gap-9 items-start`}>
        {/* ── the offer ── */}
        <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-10">
          {/* the trip at a glance (the same look as the quotes the bots send) */}
          <section className="flex flex-col gap-4">
            <h2 className="font-display font-bold text-[22px] md:text-[26px] tracking-tight text-ink">סיכום החופשה</h2>
            <SumRows rows={[
              ["יעד", "ואל טורנס, צרפת"],
              ...(checkin && checkout ? [["תאריכים", `${ilDate(checkin)} עד ${ilDate(checkout)}`] as [string, string]] : []),
              ["משך החופשה", `${nights} לילות`],
              ["מספר אורחים", String(guests)],
              ["לינה", apartment],
              ["סקי פס", passEff ? `כלול, ${passQty} ${passArea === "trois_vallees" ? "שלושת העמקים" : "ואל טורנס"}` : "לא כלול"],
              ["הסעה מהשדה", transferOn ? `כלולה, ${transferQty} אנשים` : "לא כלולה"],
              ["ציוד סקי/סנובורד", picked.equipment ? `כלול, ${equipQty} סטים` : "לא כלול"],
              ["טיסות", flightEff ? `כלולות, ${flightQty} אנשים` : "לא כלולות"],
            ]} />
          </section>

          {/* the apartment */}
          <section id="stay" className="flex flex-col gap-4" aria-labelledby="stay-h">
            <h2 id="stay-h" className="font-display font-bold text-[22px] md:text-[26px] tracking-tight text-ink">על הדירה · {apartment}</h2>
            {apt && (
              <SumRows rows={[
                ...(apt.beds ? [["חדרי שינה", String(apt.beds)] as [string, string]] : []),
                ...(apt.baths ? [["חדרי רחצה", String(apt.baths)] as [string, string]] : []),
                ...(apt.sqm ? [["גודל", `${apt.sqm} מ"ר`] as [string, string]] : []),
                ...(apt.max_guests ? [["תפוסה מקסימלית", `${apt.max_guests} אורחים`] as [string, string]] : []),
              ]} />
            )}
            {apt?.description ? (
              <div>
                <p className={`text-[16px] leading-[1.75] text-body whitespace-pre-line ${showDesc ? "" : "line-clamp-6"}`}>{apt.description}</p>
                {apt.description.length > 300 && (
                  <button type="button" onClick={() => setShowDesc(v => !v)} className={`${btn.link} mt-2 min-h-[44px]`}>{showDesc ? "להציג פחות" : "לקרוא עוד"}</button>
                )}
              </div>
            ) : (
              <p className="text-[16px] leading-[1.75] text-body">דירה בואל טורנס, הכפר הגבוה באירופה: 2,300 מטר, עם גישה ל-600 ק&quot;מ מסלולים של שלושת העמקים.</p>
            )}
            {mapHref && (
              <a href={mapHref} target="_blank" rel="noopener noreferrer" className={`${btn.link} self-start min-h-[44px]`}><span className="text-accent"><IcoPin /></span>המיקום במפה ‹</a>
            )}
          </section>

          {/* the price, line by line: switches to take things out or add them */}
          <section id="extras" className="flex flex-col gap-4" aria-labelledby="extras-h">
            <div className="flex flex-col gap-1">
              <h2 id="extras-h" className="font-display font-bold text-[22px] md:text-[26px] tracking-tight text-ink">פירוט מחירים</h2>
              <p className="text-[15px] text-muted">אפשר להוסיף או להוריד סקי פס, הסעה, ציוד וטיסה, והמחיר מתעדכן מיד.</p>
            </div>
            <div className={`${card} divide-y divide-line`}>
              <LineRow title={calc.lines[0]?.label || "לינה"} sub={calc.lines[0]?.sub} amount={eur(baseApt)} />
              <LineRow title={`סקי פס${skiDays > 0 ? ` · ${skiDays} ימי גלישה` : ""}`}
                sub={passEff ? `${passArea === "trois_vallees" ? "שלושת העמקים" : "ואל טורנס ואורל"} · ${passQty} אנשים` : "המסלולים של ואל טורנס, או כל שלושת העמקים"}
                amount={passEff ? eur(amountOf("pass")) : ""} on={passEff} onToggle={() => setPassOn(v => !v)}
                disabled={!passOpen(passArea) && !passEff}>
                {passEff && (
                  <div className="flex flex-col gap-2.5 mt-2.5">
                    <div role="group" aria-label="איזה סקי פס" className="flex flex-wrap gap-2">
                      {(["val_thorens", "trois_vallees"] as const).map(a2 => {
                        const t = tierOf(a2);
                        const open = passOpen(a2);
                        return (
                          <button key={a2} type="button" disabled={!open || (!t && passes.length > 0)} onClick={() => setPassArea(a2)} aria-pressed={passArea === a2}
                            className={`min-h-[40px] px-3.5 rounded-full border text-[14px] font-bold transition-colors disabled:opacity-40 ${passArea === a2 ? "border-accent bg-accent-soft text-accent" : "border-line-strong text-ink"}`}>
                            {a2 === "trois_vallees" ? "שלושת העמקים" : "ואל טורנס"}{t ? ` · ${eur(t.price)}` : ""}
                          </button>
                        );
                      })}
                    </div>
                    <MiniQty label="לכמה אנשים" qty={passQty} setQty={setPassQty} max={guests} />
                  </div>
                )}
              </LineRow>
              <LineRow title="הסעה הלוך וחזור" sub={`שאטל משדה התעופה עד הדירה · ${eur(TRANSFER_PRICE)} לאדם`}
                amount={transferOn ? eur(amountOf("transfer")) : `+${eur(TRANSFER_PRICE * guests)}`} on={transferOn}
                onToggle={() => { const v = !transferOn; setTransferOn(v); if (v) setTransferQty(n => Math.min(n || guests, guests) || 1); }}>
                {transferOn && (
                  <div className="flex flex-wrap items-center gap-3 mt-2.5">
                    <MiniQty label="לכמה אנשים" qty={transferQty} setQty={setTransferQty} max={guests} />
                    <button type="button" onClick={() => setShowTransfer(true)} className={`${btn.link} min-h-[40px] text-[14px] ${flightFilled(flight) ? "!text-ok-text" : ""}`}>
                      {flightFilled(flight) ? <><Check size={15} /> פרטי הטיסה נשמרו</> : "למלא את פרטי הטיסה להסעה ‹"}
                    </button>
                  </div>
                )}
              </LineRow>
              <LineRow title="ציוד סקי או סנובורד" sub={`${skiDays} ימי גלישה · ${eur(equipUnit)} לאדם`}
                amount={picked.equipment ? eur(amountOf("equipment")) : `+${eur(equipUnit * guests)}`} on={!!picked.equipment} disabled={skiDays < 1}
                onToggle={() => { const v = !equipmentOn; setEquipmentOn(v); if (v) setEquipQty(n => Math.min(n || guests, guests) || 1); }}>
                {picked.equipment && <div className="mt-2.5"><MiniQty label="לכמה אנשים" qty={equipQty} setQty={setEquipQty} max={guests} /></div>}
              </LineRow>
              {calc.lines.filter(l => ["flex", "nocancel", "ai"].includes(l.key)).map(l => (
                <LineRow key={l.key} title={l.label} amount={l.amount < 0 ? `−${eur(-l.amount)}` : eur(l.amount)} />
              ))}
              <div className="flex items-center justify-between gap-4 px-4 md:px-5 py-4 bg-soft rounded-b-card">
                <span className="text-[16px] font-bold text-ink">סה״כ לכל החבורה</span>
                <span className="font-display font-extrabold text-[20px] text-ink tabular-nums">{eur(liveTotal)}</span>
              </div>
            </div>
            <p className="text-[13px] text-muted leading-relaxed">את הסקי פס אוספים בעצמכם מהמכונה בכפר. ציוד פרמיום אפשר לשדרג בחנות ההשכרה.</p>

            {/* the flight: only a direct round trip */}
            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-[17px] font-bold text-ink">טיסה ישירה</h3>
              <FlightAddOn state={direct} ret={returnLeg} checkin={checkin} checkout={checkout}
                checked={flightEff} onToggle={v => { setFlightOn(v); if (v) setFlightQty(n => Math.min(n || guests, guests) || 1); }}
                qty={flightQty} setQty={setFlightQty} maxQty={guests} total={amountOf("flight")}
                bag={{ on: bagEff, unit: BAGGAGE_PRICE, qty: bagQty, setQty: setBagQty, total: amountOf("bag"), toggle: () => setBagOn(v => !v) }} />
            </div>
          </section>

          {/* cancellation and service */}
          <section id="choices" className="flex flex-col gap-6" aria-labelledby="choices-h">
            <h2 id="choices-h" className="font-display font-bold text-[22px] md:text-[26px] tracking-tight text-ink">ביטול ושירות</h2>
            <div role="radiogroup" aria-labelledby="cancel-h" className="flex flex-col gap-3">
              <h3 id="cancel-h" className="text-[17px] font-bold text-ink">מדיניות ביטול</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <QRadio label="ביטול רגיל" sublabel="לפי התקנון, במחיר הרגיל" selected={cancel === "regular"} onClick={() => setCancel("regular")} />
                <QRadio label="ביטול גמיש" sublabel="80% החזר עד שבוע לפני, 50% עד 24 שעות לפני" badge={`+${eur(FLEXIBLE_EXTRA)}`} selected={cancel === "flexible"} onClick={() => setCancel("flexible")} />
                <QRadio label="בלי אפשרות ביטול" sublabel="מחיר מוזל, אבל אי אפשר לבטל ואין החזר" badge={`−${eur(NO_CANCEL_DISCOUNT)}`} badgeTone="good" selected={cancel === "none"} onClick={choiceNoCancel} />
              </div>
            </div>
            <div role="radiogroup" aria-labelledby="service-h" className="flex flex-col gap-3">
              <h3 id="service-h" className="text-[17px] font-bold text-ink">רמת שירות</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QRadio label="שירות אנושי מלא" sublabel="נציג ישראלי זמין לפני החופשה, במהלכה ואחריה" selected={service === "human"} onClick={() => setService("human")} />
                <QRadio label="AI בלבד" sublabel="ניהול עצמאי עם צ'אטבוט, ואיסוף עצמאי של הסקי פס" badge={`−${eur(AI_DISCOUNT)}`} badgeTone="good" selected={service === "ai"} onClick={() => setService("ai")} />
              </div>
            </div>
            <Link href="/terms" target="_blank" className={`${btn.link} self-start`}>מדיניות הביטולים בתקנון ‹</Link>
          </section>

          {/* payment and good to know */}
          <section id="payment" className="flex flex-col gap-4" aria-labelledby="payment-h">
            <h2 id="payment-h" className="font-display font-bold text-[22px] md:text-[26px] tracking-tight text-ink">תשלום</h2>
            <div className={`${card} p-5 md:p-6`}>
              <h3 className="flex items-center gap-2 text-[17px] font-bold text-ink mb-3"><span className="text-accent"><IconCreditCard size={20} /></span>בכרטיס אשראי</h3>
              <CheckList className="text-body" items={[
                "עד 3 תשלומים בלי ריבית",
                "תשלום מאובטח בתקן PCI-DSS · PayPlus",
                "בכרטיס יש עמלת סליקה של 1.9%",
                "בהעברה בנקאית אין עמלה (הפרטים כאן למטה)",
              ]} />
            </div>
            <div className={`${card} overflow-hidden`}>
              <button type="button" onClick={() => setShowBank(v => !v)} aria-expanded={showBank}
                className="w-full flex items-center justify-between gap-3 p-5 md:px-6 min-h-[64px] text-start">
                <span className="flex items-center gap-2 text-[17px] font-bold text-ink"><span className="text-accent"><IconBank size={20} /></span>בהעברה בנקאית</span>
                <span className="inline-flex items-center gap-1 text-[14px] font-bold text-accent">{showBank ? "להסתיר" : "לפרטים"} <IcoChevron open={showBank} /></span>
              </button>
              {showBank && (
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5 px-5 md:px-6 pb-6">
                  <div>
                    <p className="text-[13px] font-bold text-muted border-b border-line pb-1.5 mb-2">העברה בשקלים</p>
                    <KV k="בנק" v={bank.name} /><KV k="סניף" v={bank.branch} /><KV k="מספר חשבון" v={bank.account} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-muted border-b border-line pb-1.5 mb-2">העברה בינלאומית</p>
                    <KV k="IBAN" v={bank.iban} mono /><KV k="SWIFT" v={bank.swift} mono /><KV k="מוטב" v={bank.holder} />
                  </div>
                </div>
              )}
            </div>
            <div className={`${card} p-5 md:p-6`}>
              <h3 className="text-[17px] font-bold text-ink mb-3">חשוב לדעת</h3>
              <ul className="flex flex-col gap-3 text-[15px] leading-relaxed text-body">
                <Info icon={<IconShield size={18} />} title="ביטול">רגיל לפי התקנון. ביטול גמיש (+€100): 80% החזר עד שבוע לפני, 50% עד 24 שעות לפני, ואחר כך אין החזר. בלי ביטול (−€100): אי אפשר לבטל.</Info>
                <Info icon={<IconUser size={18} />} title="שירות אנושי מלא">נציג ישראלי זמין לפני החופשה, במהלכה ואחריה.</Info>
                <Info icon={<IconBot size={18} />} title="שירות AI (−€50)">ניהול עצמאי עם צ&apos;אטבוט, מפתחות בדלת 48 שעות לפני, איסוף עצמאי של הסקי פס, ופנייה לנציג במקרים חריגים.</Info>
                <Info icon={<IconBus size={18} />} title="הסעה">המחיר לא קבוע ויכול להשתנות. אישור סופי עד 48 שעות לפני.</Info>
                <Info icon={<IconCreditCard size={18} />} title="תשלום">בכרטיס נוספת עמלת סליקה של 1.9%. בהעברה בנקאית אין עמלה (דברו עם נציג).</Info>
              </ul>
              <Link href="/terms" target="_blank" className={`${btn.link} mt-4`}>התקנון המלא ומדיניות הביטולים ‹</Link>
            </div>
          </section>
        </div>

        {/* ── summary: sticky on desktop ── */}
        <aside aria-label="סיכום ההצעה"
          className="hidden lg:flex flex-col w-[380px] xl:w-[400px] shrink-0 sticky top-[96px] max-h-[calc(100dvh-116px)] bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
          {/* what's in it: scrolls inside when the window is short */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] px-6 pt-6 pb-2 flex flex-col gap-3 *:shrink-0">
            <span className="text-[18px] font-bold text-ink">ההצעה שלכם</span>
            <div className="flex flex-col divide-y divide-line">{breakdownRows}</div>
            {trust}
            <span className="text-[13px] text-muted leading-relaxed pb-2">ההצעה בתוקף ל-30 יום. המחיר של הדירה לפי לוח המחירים לתאריכים האלה.</span>
          </div>
          {/* the price and the buttons: always in view */}
          <div className="shrink-0 px-6 pb-6 flex flex-col gap-3.5">
            {totals}
            {splitSelector}
            {payButton}
            {waButton}
            {pdfButton}
          </div>
        </aside>
      </div>

      {/* ── phone: price and the main button at the bottom ── */}
      {!sheetOpen && (
        <div className="lg:hidden sticky bottom-0 z-40 bg-white border-t border-line px-4 pt-3 flex items-center gap-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)", boxShadow: "0 -8px 24px rgba(11,27,51,0.08)" }}>
          <div className="flex flex-col leading-tight min-w-0">
            {guests > 1 ? (
              <>
                <span className="flex items-baseline gap-1"><span className="font-display font-extrabold text-[22px] text-ink tabular-nums">{eur(perPerson)}</span><span className="text-[13px] text-muted">לאדם</span></span>
                <span className="text-[12px] text-muted tabular-nums">{eur(liveTotal)} לכל החבורה</span>
              </>
            ) : (
              <>
                <span className="font-display font-extrabold text-[22px] text-ink tabular-nums">{eur(liveTotal)}</span>
                <span className="text-[12px] text-muted">{nights} לילות</span>
              </>
            )}
          </div>
          <button type="button" onClick={() => setSheetOpen(true)} className={`${btn.primary} flex-1`}>לתשלום</button>
        </div>
      )}

      {/* phone: the payment sheet */}
      {sheetOpen && <div className="lg:hidden fixed inset-0 z-[55] bg-ink/40" onClick={() => setSheetOpen(false)} aria-hidden="true" />}
      <div role="dialog" aria-modal="true" aria-label="תשלום" inert={!sheetOpen}
        className={`lg:hidden fixed inset-x-0 bottom-0 z-[60] transition-[transform,visibility] duration-300 ${sheetOpen ? "visible translate-y-0" : "invisible translate-y-full"}`}>
        <div className="bg-white rounded-t-[24px] max-h-[88dvh] overflow-y-auto overscroll-contain px-4 pt-2 flex flex-col gap-4 *:shrink-0" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}>
          <button type="button" onClick={() => setSheetOpen(false)} aria-label="סגירה" className="w-full flex justify-center py-2"><span className="w-10 h-1.5 rounded-full bg-line-strong" /></button>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[22px] font-bold text-ink">תשלום</h2>
            <button type="button" onClick={() => setSheetOpen(false)} aria-label="סגירה" className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:bg-soft text-[18px]">✕</button>
          </div>

          <div className="rounded-2xl border border-line overflow-hidden">
            <button type="button" onClick={() => setShowSummary(v => !v)} aria-expanded={showSummary} className="w-full flex items-center justify-between gap-3 px-4 min-h-[52px]">
              <span className="text-[15px] font-bold text-ink">מה כלול ומה בחרתם</span>
              <IcoChevron open={showSummary} />
            </button>
            {showSummary && <div className="px-4 pb-1 divide-y divide-line">{breakdownRows}</div>}
          </div>

          {totals}
          {splitSelector}
          {payButton}
          {waButton}
          {pdfButton}
          <a href="#payment" onClick={() => setSheetOpen(false)} className={`${btn.link} self-center min-h-[44px]`}>פרטים להעברה בנקאית</a>
          {trust}
        </div>
      </div>

      <Lightbox imgs={imgs} index={lightbox} setIndex={setLightbox} name={apartment} />

      {showNoCancel && (
        <div dir="rtl" className="fixed inset-0 z-[95] bg-ink/55 flex items-end sm:items-center justify-center p-3 sm:p-4" onClick={() => setShowNoCancel(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="nocancel-h" className="bg-white rounded-card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 id="nocancel-h" className="font-display text-[22px] font-bold text-ink mb-1.5">בלי אפשרות ביטול</h2>
            <p className="text-[15px] text-body leading-relaxed mb-4">המחיר יורד ב-{eur(NO_CANCEL_DISCOUNT)}, אבל ההזמנה <b className="text-ink">לא ניתנת לביטול</b> ואין החזר כספי, לפי התקנון.</p>
            <label className="flex items-start gap-2.5 cursor-pointer mb-4">
              <input type="checkbox" checked={noCancelAgreed} onChange={e => setNoCancelAgreed(e.target.checked)} className="mt-1 w-5 h-5 accent-[#1652F0] shrink-0" />
              <span className="text-[15px] text-body leading-relaxed">הבנו שאי אפשר לבטל ושלא יהיה החזר, ואנחנו מסכימים ל<Link href="/terms" target="_blank" className="text-accent font-bold underline">תקנון</Link>.</span>
            </label>
            <label htmlFor="nocancel-sign" className="block text-[14px] font-bold text-ink mb-1.5">חתימה (שם מלא)</label>
            <input id="nocancel-sign" value={signature} onChange={e => setSignature(e.target.value)} placeholder="שם מלא" autoComplete="name"
              className="w-full min-h-[48px] rounded-xl border border-line-strong bg-white px-4 text-[16px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 mb-4" />
            <div className="flex gap-2">
              <button type="button" disabled={!noCancelAgreed || signature.trim().length < 2} onClick={() => { setCancel("none"); setShowNoCancel(false); }}
                className={`${btn.primary} flex-1`}>אישור וחתימה</button>
              <button type="button" onClick={() => setShowNoCancel(false)} className={btn.outline}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      <FlightDetailsModal open={showTransfer} onClose={() => setShowTransfer(false)} value={flight} onChange={setFlight} />
    </div>
  );
}

/* ── small components ──────────────────────────────────────── */
function PriceRow({ label, sub, amount, good }: { label: string; sub?: string; amount: string; good?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[15px] text-ink">{label}</p>
        {sub && <p className="text-[13px] text-muted mt-0.5">{sub}</p>}
      </div>
      <p className={`text-[15px] font-bold tabular-nums shrink-0 ${good ? "text-ok-text" : "text-ink"}`}>{amount}</p>
    </div>
  );
}

function Info({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="text-accent mt-1 shrink-0">{icon}</span>
      <span><b className="text-ink">{title}:</b> {children}</span>
    </li>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[14px] text-muted shrink-0">{k}</span>
      <span dir={mono ? "ltr" : undefined} className={`text-[15px] font-bold text-ink text-left ${mono ? "font-mono tracking-tight break-all" : "break-words"}`}>{v}</span>
    </div>
  );
}
