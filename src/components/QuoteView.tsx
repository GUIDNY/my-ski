"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Apartment } from "@/types";
import {
  IconCalendar, IconChevronLeft, IconImage, IconBank, IconCreditCard,
  IconUsers, IconWhatsApp, IconShield, IconUser, IconBot, IconBus, IconMountain,
} from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";
import { stayBreakdown, skiDaysFromNights, equipCost } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
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
    ? `${a.getDate()}–${b.getDate()} ב${HE_MONTHS[b.getMonth()]}`
    : `${a.getDate()} ב${HE_MONTHS[a.getMonth()]} – ${b.getDate()} ב${HE_MONTHS[b.getMonth()]}`;
};
const eur = (n: number) => `€${Math.round(n).toLocaleString()}`;

const TRANSFER_PRICE = 180;
const FLEXIBLE_EXTRA = 100;
const NO_CANCEL_DISCOUNT = 100;
const AI_DISCOUNT = 50;
// a "week" = 6 nights → flat €120; under that €30/night; each extra night +€20

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
  const {
    apartmentId, apartment, checkin, checkout, guests, nights,
    skiPass, transfer, aptTotal,
  } = q;

  const [apt, setApt] = useState<Apartment | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const pageUrl = useSyncExternalStore(noSubscribe, () => window.location.href, () => "");
  const [showTransfer, setShowTransfer] = useState(false);
  const [flight, setFlight] = useState<Flight>(EMPTY_FLIGHT);
  const [transferOn, setTransferOn] = useState(transfer);
  const [equipmentOn, setEquipmentOn] = useState(false);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [showNights, setShowNights] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  const [transferQty, setTransferQty] = useState(1);
  const [equipQty, setEquipQty] = useState(1);
  const [cancel, setCancel] = useState(q.cancel === "flexible" || q.cancel === "none" ? q.cancel : "regular");
  const [service, setService] = useState(q.service === "ai" ? "ai" : "human");
  const [showNoCancel, setShowNoCancel] = useState(false);
  const [noCancelAgreed, setNoCancelAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const transferDetails = transferOn ? flightToString(flight) : "";

  useEffect(() => {
    if (!apartmentId) return;
    fetch(`/api/pricing-rules?apartment_id=${apartmentId}`).then(r => r.json()).then(d => setRules(Array.isArray(d) ? d : [])).catch(() => {});
  }, [apartmentId]);

  useEffect(() => {
    if (!apartmentId) return;
    fetch(`/api/apartments/${apartmentId}`).then(r => r.json()).then(setApt).catch(() => {});
  }, [apartmentId]);

  // per-night breakdown, priced like the bots (Airbnb calendar + cleaning for
  // our own apartments, else the seasonal rules); falls back to the stored total
  const stay = checkin && checkout && nights > 0 && apt
    ? stayBreakdown(checkin, checkout, Number(apt.price_per_night || 0), rules) : null;
  const nightly = stay ? stay.nights : [];
  const cleaningFee = stay ? stay.fee : 0;
  const baseApt = nightly.length && stay ? stay.total : aptTotal;

  // live total recomputed from the base lodging + currently-selected add-ons
  // add-ons are per-person: price × number of people who need each add-on
  // A stay of N nights only yields N-1 actual ski days (arrival/departure days aren't spent on the slopes)
  const skiDays = skiDaysFromNights(nights);
  const equipUnit = equipCost(skiDays);
  const trTotal = transferOn ? TRANSFER_PRICE * transferQty : 0;
  const equipTotal = equipmentOn ? equipUnit * equipQty : 0;
  const flexExtra = cancel === "flexible" ? FLEXIBLE_EXTRA : 0;
  const noCancelDiscount = cancel === "none" ? -NO_CANCEL_DISCOUNT : 0;
  const aiDisc = service === "ai" ? AI_DISCOUNT : 0;
  const liveTotal = baseApt + trTotal + equipTotal + flexExtra + noCancelDiscount - aiDisc;
  const perPerson = guests > 0 ? Math.round(liveTotal / guests) : liveTotal;

  // split payment: divide the FULL total (lodging + all add-ons) equally between payers
  const shareBase = Math.round(liveTotal / splitCount);
  const payNow = splitCount > 1 ? shareBase : liveTotal;
  const splitProp = splitCount > 1 ? { sharesTotal: splitCount, accommodationTotal: liveTotal, shareAmount: shareBase, area: "Val Thorens, Trois Vallées" } : undefined;

  const imgs = apt?.images?.length ? apt.images : ["/view.jpg", "/chalet-interior.jpg", "/hero-ski.jpg"];
  const avgNightly = nights > 0 ? Math.round((baseApt - cleaningFee) / nights) : baseApt;
  const fmtFull = (d: Date) => `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;
  const mapHref = mapLink(apt?.map_url);
  const beds = Number(apt?.beds) || 0;
  const meta = [
    "ואל טורנס",
    apt?.max_guests ? `עד ${apt.max_guests} אנשים` : "",
    beds > 1 ? `${beds} חדרי שינה` : beds === 1 ? "חדר שינה" : "",
    apt?.sqm ? `${apt.sqm} מ"ר` : "",
  ].filter(Boolean).join(" · ");

  const bank = {
    name:    process.env.NEXT_PUBLIC_BANK_NAME    || "בנק הפועלים (12)",
    branch:  "673",
    account: "260269",
    iban:    process.env.NEXT_PUBLIC_BANK_IBAN    || "IL62012673000000026026",
    swift:   process.env.NEXT_PUBLIC_BANK_SWIFT   || "POALILIT",
    holder:  process.env.NEXT_PUBLIC_BANK_ACCOUNT || "SKISHARE - GUINDY IDAN & MIZRAHI AMIT",
  };

  /* ── WhatsApp link with pre-filled booking summary ──────── */
  const waHref = buildWaHref({
    intro: "היי! 👋 אני מעוניין/ת בהצעת המחיר הבאה:",
    lines: [
      `🏔️ דירה: ${apartment}`,
      `📅 תאריכים: ${fmtDate(checkin)} — ${fmtDate(checkout)} (${nights} לילות)`,
      `👥 אורחים: ${guests}`,
      transferOn ? `🚐 כולל הסעה הלוך-חזור${transferDetails ? ` (${transferDetails})` : ""}` : null,
      equipmentOn ? `🎿 כולל השכרת ציוד (€${equipTotal})` : null,
      cancel === "flexible" ? "✅ מדיניות ביטול גמישה" : cancel === "none" ? "🔒 ללא אפשרות ביטול" : null,
      skiPass ? "🎿 מעוניין/ת גם בסקי פס" : null,
      service === "ai" ? "🤖 ניהול עצמאי (AI)" : null,
    ],
    total: liveTotal,
    pageUrl: pageUrl ? `ההצעה: ${pageUrl}` : undefined,
  });

  const ADDONS = [
    { key: "transfer", icon: <AdShuttle size={22} />, title: "הסעה הלוך וחזור", sub: `שאטל משדה התעופה עד הדירה · ${eur(TRANSFER_PRICE)} לאדם`, price: TRANSFER_PRICE * transferQty, on: transferOn, toggle: () => { setTransferOn(v => !v); if (!transferOn) setTransferQty(Math.min(transferQty || 1, guests) || 1); } },
    { key: "equipment", icon: <AdSkis size={22} />, title: "ציוד סקי או סנובורד", sub: `${eur(equipUnit)} לאדם ל-${skiDays} ימי גלישה (€30 ליום, עד €120 לשבוע)`, price: equipUnit * equipQty, on: equipmentOn, toggle: () => { setEquipmentOn(v => !v); if (!equipmentOn) setEquipQty(Math.min(equipQty || 1, guests) || 1); } },
    { key: "skipass", icon: <AdPass size={22} />, title: "סקי פס", sub: "שלושת העמקים, 600 ק\"מ. בינתיים מוסיפים בוואטסאפ", soon: true },
    { key: "lessons", icon: <AdLesson size={22} />, title: "שיעורי סקי או סנובורד", sub: "מדריך מוסמך, לכל הרמות", soon: true },
  ];

  const breakdownRows = (
    <>
      <div className="py-2.5">
        <button type="button" onClick={() => setShowNights(v => !v)} aria-expanded={showNights}
          className="w-full flex items-start justify-between gap-3 text-start">
          <span className="min-w-0">
            <span className="block text-[15px] text-ink">לינה, {nights} לילות{cleaningFee > 0 ? ", כולל ניקיון" : ""}</span>
            <span className="flex items-center gap-1 text-[13px] text-muted mt-0.5">
              {eur(avgNightly)} ממוצע ללילה{cleaningFee > 0 ? ` + ${eur(cleaningFee)} ניקיון` : ""}
              {nightly.length > 0 && <span className="inline-flex items-center gap-0.5 text-accent font-bold">· פירוט <IcoChevron open={showNights} /></span>}
            </span>
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
      {transferOn && <PriceRow label={`הסעה × ${transferQty}`} sub="שאטל הלוך וחזור" amount={eur(trTotal)} />}
      {equipmentOn && <PriceRow label={`ציוד × ${equipQty}`} sub={`${skiDays} ימי גלישה`} amount={eur(equipTotal)} />}
      {cancel === "flexible" && <PriceRow label="ביטול גמיש" amount={eur(FLEXIBLE_EXTRA)} />}
      {cancel === "none" && <PriceRow label="ללא אפשרות ביטול" amount={`−${eur(NO_CANCEL_DISCOUNT)}`} good />}
      {service === "ai" && <PriceRow label="הנחת שירות AI" sub="ניהול עצמאי" amount={`−${eur(AI_DISCOUNT)}`} good />}
      {skiPass && (
        <div className="flex items-center justify-between gap-3 py-2.5">
          <div><p className="text-[15px] text-ink">סקי פס</p><p className="text-[13px] text-muted mt-0.5">מוסיפים בוואטסאפ</p></div>
          <span className="text-[12px] font-bold text-warn bg-warn-soft px-2.5 py-1 rounded-full shrink-0">בקרוב באתר</span>
        </div>
      )}
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
      guests={guests} nights={nights} skiPass={skiPass} transfer={transferOn} equipment={equipmentOn} transferDetails={transferDetails} cancel={cancel} service={service}
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
          </div>
        </div>
        <div className="mt-5 md:mt-6">
          <PhotoGallery imgs={imgs} name={apartment} idx={Math.min(imgIdx, imgs.length - 1)} setIdx={setImgIdx} onOpen={setLightbox} />
        </div>
      </div>

      <div className={`${wrap} pt-7 md:pt-9 pb-10 lg:pb-24 flex flex-col lg:flex-row gap-9 items-start`}>
        {/* ── the offer ── */}
        <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-10">
          <nav aria-label="חלקי ההצעה" className="flex gap-2 overflow-x-auto border-b border-line pb-3 -mx-4 px-4 md:mx-0 md:px-0">
            {[["#stay", "הדירה"], ["#extras", "תוספות"], ["#choices", "ביטול ושירות"], ["#payment", "תשלום"]].map(([href, label]) => (
              <a key={href} href={href} className="shrink-0 inline-flex items-center min-h-[44px] px-4 rounded-full border border-line text-[15px] font-medium text-ink hover:border-ink transition-colors">{label}</a>
            ))}
          </nav>

          {/* the apartment */}
          <section id="stay" className="flex flex-col gap-4" aria-labelledby="stay-h">
            <h2 id="stay-h" className={h2}>הדירה</h2>
            {apt?.description ? (
              <div>
                <p className={`text-[16px] md:text-[17px] leading-[1.7] text-body whitespace-pre-line ${showDesc ? "" : "line-clamp-4"}`}>{apt.description}</p>
                {apt.description.length > 220 && (
                  <button type="button" onClick={() => setShowDesc(v => !v)} className={`${btn.link} mt-2 min-h-[44px]`}>{showDesc ? "להציג פחות" : "לקרוא עוד"}</button>
                )}
              </div>
            ) : (
              <p className="text-[16px] md:text-[17px] leading-[1.7] text-body">דירה בואל טורנס, הכפר הגבוה באירופה: 2,300 מטר, עם גישה ל-600 ק&quot;מ מסלולים של שלושת העמקים.</p>
            )}
            {apt && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  apt.max_guests ? { v: `עד ${apt.max_guests}`, l: "אנשים" } : null,
                  beds ? { v: String(beds), l: beds === 1 ? "חדר שינה" : "חדרי שינה" } : null,
                  apt.baths ? { v: String(apt.baths), l: apt.baths === 1 ? "חדר רחצה" : "חדרי רחצה" } : null,
                  apt.sqm ? { v: `${apt.sqm} מ"ר`, l: "גודל" } : null,
                ].filter((x): x is { v: string; l: string } => !!x).map(f => (
                  <div key={f.l} className="border border-line rounded-2xl p-3.5">
                    <div className="font-display font-bold text-[18px] text-ink">{f.v}</div>
                    <div className="text-[14px] text-muted">{f.l}</div>
                  </div>
                ))}
              </div>
            )}
            {mapHref ? (
              <a href={mapHref} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3.5 min-h-[56px] hover:border-ink transition-colors">
                <span className="flex items-center gap-2.5 font-bold text-[15px] text-ink"><span className="text-accent"><IcoPin /></span>ואל טורנס, צרפת</span>
                <span className="text-[14px] font-bold text-accent">לפתוח במפה ‹</span>
              </a>
            ) : (
              <div className="flex items-start gap-2.5 rounded-2xl bg-soft px-4 py-3.5 text-[15px] text-body">
                <span className="text-accent mt-0.5"><IconMountain size={18} /></span>
                <span><b className="text-ink">ואל טורנס, צרפת.</b> הכפר הגבוה באירופה, 2,300 מטר, עם גישה ישירה ל-600 ק&quot;מ מסלולים.</span>
              </div>
            )}
          </section>

          {/* add-ons */}
          <section id="extras" className="flex flex-col gap-4" aria-labelledby="extras-h">
            <div className="flex flex-col gap-1.5">
              <h2 id="extras-h" className={h2}>תוספות</h2>
              <p className="text-[15px] md:text-[16px] text-muted">מוסיפים מה שצריך, והמחיר מתעדכן מיד.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              {ADDONS.map((a) => {
                const soon = "soon" in a && a.soon;
                const selected = "on" in a && !!a.on;
                return (
                  <div key={a.key} className="flex flex-col gap-2">
                    {soon ? (
                      <div className="w-full flex items-start gap-3.5 p-4 rounded-[18px] border border-dashed border-line-strong bg-soft/60">
                        <span className="w-11 h-11 rounded-xl bg-white text-muted flex items-center justify-center shrink-0">{a.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[16px] font-bold text-ink">{a.title}</p>
                          <p className="text-[14px] text-muted leading-snug mt-0.5">{a.sub}</p>
                        </div>
                        <span className="text-[12px] font-bold text-warn bg-warn-soft px-2.5 py-1 rounded-full shrink-0">בקרוב באתר</span>
                      </div>
                    ) : (
                      <button type="button" role="checkbox" aria-checked={selected} onClick={() => "toggle" in a && a.toggle?.()}
                        className={`w-full flex items-start gap-3.5 p-4 rounded-[18px] border text-start transition-colors ${selected ? "border-accent ring-1 ring-accent bg-accent-soft/60" : "border-line bg-white hover:border-line-strong"}`}>
                        <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-accent text-white" : "bg-accent-soft text-accent"}`}>{a.icon}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[16px] font-bold text-ink">{a.title}</span>
                          <span className="block text-[14px] text-muted leading-snug mt-0.5">{a.sub}</span>
                          <span className="block text-[15px] font-bold text-ink mt-1.5 tabular-nums">+{eur((a as { price: number }).price)}</span>
                        </span>
                        <span className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${selected ? "bg-accent border-accent text-white" : "border-line-strong bg-white"}`} aria-hidden="true">
                          {selected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10" /></svg>}
                        </span>
                      </button>
                    )}

                    {/* equipment: how many people, under the equipment card */}
                    {a.key === "equipment" && equipmentOn && (
                      <>
                        <QStep show label="כמה אנשים צריכים ציוד?" qty={equipQty} setQty={setEquipQty} max={Math.max(guests, 1)} total={equipTotal} />
                        <p className="text-[13px] text-muted px-1 leading-relaxed">ציוד פרמיום אפשר לשדרג בתוספת תשלום בחנות ההשכרה עצמה.</p>
                      </>
                    )}

                    {/* transfer: how many people + flight details, under the transfer card */}
                    {a.key === "transfer" && transferOn && (
                      <>
                        <QStep show label="כמה אנשים צריכים הסעה?" qty={transferQty} setQty={setTransferQty} max={Math.max(guests, 1)} total={trTotal} />
                        <button type="button" onClick={() => setShowTransfer(true)}
                          className="flex items-center justify-between gap-3 w-full min-h-[52px] px-4 rounded-2xl border border-line bg-white hover:border-ink transition-colors text-start">
                          <span className={`flex items-center gap-2 text-[15px] font-bold ${flightFilled(flight) ? "text-ok-text" : "text-accent"}`}>
                            {flightFilled(flight) ? <><Check size={16} /> פרטי הטיסה נשמרו, לעריכה</> : "למלא את פרטי הטיסה להסעה"}
                          </span>
                          <span className="text-[13px] text-muted shrink-0">הגעה וחזרה</span>
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* cancellation and service */}
          <section id="choices" className="flex flex-col gap-6" aria-labelledby="choices-h">
            <h2 id="choices-h" className={h2}>ביטול ושירות</h2>
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
            <h2 id="payment-h" className={h2}>תשלום</h2>
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
