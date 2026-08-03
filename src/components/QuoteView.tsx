"use client";
import { useEffect, useState } from "react";
import type { Apartment } from "@/types";
import {
  IconMountain, IconCalendar, IconChevronLeft, IconCheck, IconPlus, IconImage,
  IconBank, IconCreditCard,
  IconUsers, IconUser, IconMoon, IconWhatsApp,
} from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";
import { getEffectivePrice } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import Logo from "@/components/Logo";
import CardPaymentButton from "@/components/CardPaymentButton";
import FlightDetailsModal, { EMPTY_FLIGHT, flightToString, flightFilled, type Flight } from "@/components/FlightDetailsModal";

/* ── Polished add-on icons ─────────────────────────────────── */
const svgBase = (s: number) => ({ width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
const AdPass = ({ size = 20 }: { size?: number }) => ( // gondola / lift pass
  <svg {...svgBase(size)}><path d="M2.5 5.5 21.5 9" /><path d="M12 6.7V9.5" /><rect x="6.5" y="9.5" width="11" height="8" rx="2.2" /><path d="M6.5 13.5h11" /><path d="M12 9.5v8" /></svg>
);
const AdSkis = ({ size = 20 }: { size?: number }) => ( // crossed skis + pole
  <svg {...svgBase(size)}><path d="M7.5 3.2 13.5 19.5" /><path d="M16.5 3.2 10.5 19.5" /><path d="M5.4 19.6c1.2.9 2.4.9 3.6 0" /><path d="M14.9 19.6c1.2.9 2.4.9 3.6 0" /></svg>
);
const AdShuttle = ({ size = 20 }: { size?: number }) => ( // shuttle van
  <svg {...svgBase(size)}><path d="M3 12.5 4.4 7.4A2 2 0 0 1 6.3 6h8.4a2 2 0 0 1 1.7 1l2.1 3.4 1.6.5a1.6 1.6 0 0 1 1.1 1.5v2.1a1 1 0 0 1-1 1h-1.1" /><path d="M3 12.5v2.5a1 1 0 0 0 1 1h1.2" /><circle cx="7.6" cy="16" r="1.9" /><circle cx="16.6" cy="16" r="1.9" /><path d="M9.5 16h5.2" /><path d="M3.4 12.5H17" /><path d="M10.2 6.2v6" /></svg>
);
const AdLesson = ({ size = 20 }: { size?: number }) => ( // instructor + slalom flag
  <svg {...svgBase(size)}><circle cx="8.5" cy="4.6" r="2.1" /><path d="M8.5 7v4.5" /><path d="M8.5 8.8 6 11" /><path d="M8.5 8.8 11 10.3" /><path d="M6 11l-1 6" /><path d="M11 10.3l1.4 6.7" /><path d="M17 3.5v15" /><path d="M17 4c1.9 1 2.9 1 3.8 0v3.6c-.9 1-1.9 1-3.8 0z" fill="currentColor" stroke="none" /></svg>
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

const TRANSFER_PRICE = 180;
const FLEXIBLE_EXTRA = 100;
const AI_DISCOUNT = 50;
// a "week" = 6 nights → flat €120; under that €30/night; each extra night +€20
const equipCost = (n: number) => (n <= 0 ? 0 : n < 6 ? 30 * n : 120 + 20 * (n - 6));

function QStep({ show, label, qty, setQty, max, total }: {
  show: boolean; label: string; qty: number; setQty: (n: number) => void; max: number; total: number;
}) {
  if (!show) return null;
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200">
      <span className="text-xs font-bold text-blue-700">{label}</span>
      <div className="flex items-center gap-2.5">
        <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}
          className="w-7 h-7 rounded-full bg-white border border-blue-200 text-blue-600 font-black disabled:opacity-40 leading-none">−</button>
        <span className="font-black text-slate-900 w-5 text-center">{qty}</span>
        <button type="button" onClick={() => setQty(Math.min(max, qty + 1))} disabled={qty >= max}
          className="w-7 h-7 rounded-full bg-white border border-blue-200 text-blue-600 font-black disabled:opacity-40 leading-none">+</button>
        <span className="text-xs font-bold text-slate-700 w-16 text-left">= €{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

function QRadio({ label, sublabel, badge, badgeColor, selected, onClick }: {
  label: string; sublabel: string; badge?: string; badgeColor?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-right transition-all ${selected ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          {badge && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: badgeColor }}>{badge}</span>}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">{sublabel}</div>
      </div>
      <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 ${selected ? "border-blue-500 bg-blue-500 ring-2 ring-blue-200" : "border-slate-300"}`} />
    </button>
  );
}

export default function QuoteView({ q }: { q: QuoteData }) {
  const {
    apartmentId, apartment, checkin, checkout, guests, nights,
    skiPass, transfer, aptTotal, grandTotal,
  } = q;

  const [apt, setApt] = useState<Apartment | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [pageUrl, setPageUrl] = useState("");
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
  const [openCancel, setOpenCancel] = useState(false);
  const [openService, setOpenService] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const transferDetails = transferOn ? flightToString(flight) : "";

  useEffect(() => { setPageUrl(window.location.href); }, []);
  useEffect(() => {
    if (!apartmentId) return;
    fetch(`/api/pricing-rules?apartment_id=${apartmentId}`).then(r => r.json()).then(d => setRules(Array.isArray(d) ? d : [])).catch(() => {});
  }, [apartmentId]);

  // per-night breakdown from the seasonal calendar (falls back to the stored total)
  const nightly = (() => {
    if (!checkin || !checkout || nights <= 0 || !apt) return [] as { date: Date; price: number }[];
    const out: { date: Date; price: number }[] = [];
    const end = new Date(checkout + "T12:00:00");
    for (let d = new Date(checkin + "T12:00:00"); d < end; d.setDate(d.getDate() + 1))
      out.push({ date: new Date(d), price: getEffectivePrice(new Date(d), Number(apt.price_per_night || 0), rules) });
    return out;
  })();
  const baseApt = nightly.length ? nightly.reduce((s, n) => s + n.price, 0) : aptTotal;

  // live total recomputed from the base lodging + currently-selected add-ons
  // add-ons are per-person: price × number of people who need each add-on
  const equipUnit = equipCost(nights);
  const trTotal = transferOn ? TRANSFER_PRICE * transferQty : 0;
  const equipTotal = equipmentOn ? equipUnit * equipQty : 0;
  const flexExtra = cancel === "flexible" ? 100 : 0;
  const noCancelDiscount = cancel === "none" ? -100 : 0;
  const aiDisc = service === "ai" ? 50 : 0;
  const liveTotal = baseApt + trTotal + equipTotal + flexExtra + noCancelDiscount - aiDisc;

  // split payment: divide the FULL total (lodging + all add-ons) equally between payers
  const shareBase = Math.round(liveTotal / splitCount);
  const payNow = splitCount > 1 ? shareBase : liveTotal;
  const splitProp = splitCount > 1 ? { sharesTotal: splitCount, accommodationTotal: liveTotal, shareAmount: shareBase, area: "Val Thorens, Trois Vallées" } : undefined;

  const splitSelector = (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-slate-800">כמה אנשים משלמים?</span>
          <span className="block text-[11px] text-slate-400">עד {guests} משלמים · מתחלקים בלינה</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSplitCount(n => Math.max(1, n - 1))} disabled={splitCount <= 1}
            className="w-7 h-7 rounded-full border border-slate-200 text-slate-500 font-bold disabled:opacity-40">−</button>
          <span className="font-black text-slate-900 w-5 text-center">{splitCount}</span>
          <button onClick={() => setSplitCount(n => Math.min(guests, n + 1))} disabled={splitCount >= guests}
            className="w-7 h-7 rounded-full border border-slate-200 text-slate-500 font-bold disabled:opacity-40">+</button>
        </div>
      </div>
      {splitCount > 1 && (
        <div className="bg-blue-50 rounded-lg px-3 py-2 mt-2.5 text-sm">
          <div className="flex justify-between font-bold text-blue-900"><span>החלק שלך עכשיו</span><span>€{payNow.toLocaleString()}</span></div>
          <p className="text-xs text-blue-600 mt-0.5">הסה״כ €{liveTotal.toLocaleString()} (כולל כל התוספות) ÷ {splitCount} · אחרי התשלום תקבל/י קישור לשלוח לחברים.</p>
        </div>
      )}
    </div>
  );

  const cancelLabel = cancel === "flexible" ? "ביטול גמיש (+€100)" : cancel === "none" ? "ללא ביטול (−€100)" : "ביטול רגיל";
  const serviceLabel = service === "ai" ? "AI בלבד (−€50)" : "שירות אנושי מלא";

  const choicesBlock = (
    <div className="space-y-2">
      {/* cancellation selector */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button onClick={() => setOpenCancel(v => !v)} className="w-full flex items-center justify-between p-3.5 text-right">
          <span><span className="text-sm font-bold text-slate-800">מדיניות ביטול</span><span className="block text-xs text-blue-600 mt-0.5">{cancelLabel}</span></span>
          <span className="text-slate-400">{openCancel ? "▲" : "▼"}</span>
        </button>
        {openCancel && (
          <div className="px-3 pb-3 flex flex-col gap-2">
            <QRadio label="ביטול רגיל" sublabel="בהתאם לתנאי התקנון · מחיר רגיל" selected={cancel === "regular"} onClick={() => { setCancel("regular"); setOpenCancel(false); }} />
            <QRadio label="ללא אפשרות ביטול" sublabel="מחיר מוזל · לא ניתן לבטל ואין החזר" badge="−€100" badgeColor="#ef4444" selected={cancel === "none"} onClick={() => setShowNoCancel(true)} />
            <QRadio label="ביטול גמיש" sublabel="80% החזר עד שבוע לפני · 50% עד 24ש׳ · אח״כ אין החזר" badge="+€100" badgeColor="#10b981" selected={cancel === "flexible"} onClick={() => { setCancel("flexible"); setOpenCancel(false); }} />
            <a href="/terms" target="_blank" className="text-xs text-blue-600 hover:underline font-semibold">מדיניות הביטולים בתקנון ←</a>
          </div>
        )}
      </div>
      {/* service selector */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button onClick={() => setOpenService(v => !v)} className="w-full flex items-center justify-between p-3.5 text-right">
          <span><span className="text-sm font-bold text-slate-800">רמת שירות</span><span className="block text-xs text-blue-600 mt-0.5">{serviceLabel}</span></span>
          <span className="text-slate-400">{openService ? "▲" : "▼"}</span>
        </button>
        {openService && (
          <div className="px-3 pb-3 flex flex-col gap-2">
            <QRadio label="שירות אנושי מלא" sublabel="נציג ישראלי זמין לפני, במהלך ואחרי" selected={service === "human"} onClick={() => { setService("human"); setOpenService(false); }} />
            <QRadio label="AI בלבד" sublabel="ניהול עצמאי · צ׳אטבוט · איסוף עצמאי של הסקי פס" badge="−€50" badgeColor="#6366f1" selected={service === "ai"} onClick={() => { setService("ai"); setOpenService(false); }} />
          </div>
        )}
      </div>
    </div>
  );

  const ADDONS = [
    { key: "skipass", icon: <AdPass size={22} />, title: "סקי פס", sub: "כל אזור Trois Vallées · 600 ק״מ מסלולים", soon: true },
    { key: "equipment", icon: <AdSkis size={22} />, title: "השכרת ציוד סקי/סנובורד *", sub: "€30 ליום · €120 לשבוע · לאדם", price: equipUnit * equipQty, unit: equipUnit, on: equipmentOn, toggle: () => { setEquipmentOn(v => !v); if (!equipmentOn) setEquipQty(Math.min(equipQty || 1, guests) || 1); } },
    { key: "transfer", icon: <AdShuttle size={22} />, title: "הסעה הלוך-חזור", sub: "משדה התעופה וחזרה · €180 לאדם", price: TRANSFER_PRICE * transferQty, unit: TRANSFER_PRICE, on: transferOn, toggle: () => { setTransferOn(v => !v); if (!transferOn) setTransferQty(Math.min(transferQty || 1, guests) || 1); } },
    { key: "lessons", icon: <AdLesson size={22} />, title: "שיעורי סקי / סנובורד", sub: "מדריך מוסמך · כל הרמות", soon: true },
  ];

  useEffect(() => {
    if (!apartmentId) return;
    fetch(`/api/apartments/${apartmentId}`).then(r => r.json()).then(setApt).catch(() => {});
  }, [apartmentId]);

  const imgs = apt?.images?.length ? apt.images : ["/apt1.jpg", "/apt2.jpg", "/apt3.jpg"];
  const avgNightly = nights > 0 ? Math.round(baseApt / nights) : baseApt;
  const fmtFull = (d: Date) => `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;

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

  const policiesCard = (
    <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100 p-5">
      <h3 className="font-display font-bold text-slate-900 mb-3">מדיניות ומידע</h3>
      <ul className="space-y-2.5 text-sm text-slate-600">
        <li className="flex gap-2"><span>🛡️</span><span><b className="text-slate-800">ביטול:</b> רגיל לפי התקנון · ביטול גמיש (+€100): 80% החזר עד שבוע לפני, 50% עד 24ש׳ לפני, אח״כ אין החזר · ללא ביטול (−€100): לא ניתן לביטול.</span></li>
        <li className="flex gap-2"><span>👤</span><span><b className="text-slate-800">שירות אנושי מלא:</b> נציג ישראלי זמין לפני, במהלך ואחרי החופשה.</span></li>
        <li className="flex gap-2"><span>🤖</span><span><b className="text-slate-800">שירות AI (−€50):</b> ניהול עצמאי עם צ׳אטבוט · מפתחות בדלת 48ש׳ לפני · איסוף עצמאי של הסקי פס · פנייה לנציג במקרים חריגים.</span></li>
        <li className="flex gap-2"><span>🚐</span><span><b className="text-slate-800">הסעה:</b> מחיר לא קבוע, עשוי להשתנות · אישור סופי עד 48 שעות.</span></li>
        <li className="flex gap-2"><span>💳</span><span><b className="text-slate-800">תשלום:</b> בכרטיס נוספת עמלת סליקה 1.9% · אפשר העברה בנקאית ללא עמלה (דברו עם נציג).</span></li>
      </ul>
      <a href="/terms" target="_blank" className="inline-block mt-3 text-sm font-bold text-blue-600 hover:underline">מדיניות הביטולים והתקנון המלא ←</a>
    </div>
  );

  const breakdownRows = (
    <>
      <div className="py-2.5">
        <button onClick={() => setShowNights(v => !v)} className="w-full flex items-center justify-between">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-700">לינה</p>
            <p className="text-xs text-slate-400">€{avgNightly.toLocaleString()} ממוצע × {nights} לילות · פירוט {showNights ? "▲" : "▼"}</p>
          </div>
          <span className="text-sm font-bold text-slate-900">€{baseApt.toLocaleString()}</span>
        </button>
        {showNights && nightly.length > 0 && (
          <div className="mt-2 rounded-xl border border-slate-100 overflow-hidden">
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
              {nightly.map((n, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <span className="text-slate-500">{fmtFull(n.date)}</span>
                  <span className="font-semibold text-slate-700">€{n.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {transferOn      && <Row label="הסעה הלוך־חזור" sub={transferQty > 1 ? `שאטל פרטי · ${transferQty} אנשים` : "שאטל פרטי"} amount={`€${trTotal.toLocaleString()}`} />}
      {equipmentOn     && <Row label="השכרת ציוד" sub={`${nights} לילות${equipQty > 1 ? ` · ${equipQty} אנשים` : ""}`} amount={`€${equipTotal.toLocaleString()}`} />}
      {cancel === "flexible" && <Row label="ביטול גמיש" amount="€100" />}
      {cancel === "none" && <Row label="ללא אפשרות ביטול" amount="−€100" green />}
      {service === "ai" && <Row label="הנחת AI" sub="ניהול עצמאי" amount="−€50" green />}
      {skiPass && (
        <div className="flex items-center justify-between py-2.5">
          <div><p className="text-sm font-medium text-slate-700">סקי פס</p></div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">בקרוב</span>
        </div>
      )}
    </>
  );

  const addonsGrid = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
      {ADDONS.map((a) => {
        const soon = "soon" in a && a.soon;
        const selected = "on" in a && a.on;
        return (
          <div key={a.key} className="space-y-2">
            <button type="button" disabled={soon} onClick={() => "toggle" in a && a.toggle?.()}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-right transition-all ${soon ? "bg-slate-50 border-slate-100 cursor-default" : selected ? "bg-blue-50 border-blue-400" : "bg-white border-slate-200 hover:border-blue-300"}`}>
              <span className={`w-10 h-10 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0 ${selected ? "bg-blue-600 text-white" : "bg-white text-blue-600"}`}>{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{a.title}</p>
                <p className="text-xs text-slate-400 truncate">{a.sub}</p>
              </div>
              {soon
                ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex-shrink-0">בקרוב</span>
                : <span className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-blue-600">+€{(a as { price: number }).price.toLocaleString()}</span>
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${selected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"}`}>{selected && <IconCheck size={12} />}</span>
                  </span>}
            </button>

            {/* equipment: qty + premium note directly under the equipment card */}
            {a.key === "equipment" && equipmentOn && (
              <>
                <QStep show label="כמה אנשים צריכים ציוד?" qty={equipQty} setQty={setEquipQty} max={Math.max(guests, 1)} total={equipTotal} />
                <p className="text-[11px] text-slate-400 px-1 leading-relaxed">* לשדרוג לציוד פרמיום ניתן לשלם תוספת בחנות ההשכרה עצמה.</p>
              </>
            )}

            {/* transfer: qty + flight directly under the transfer card */}
            {a.key === "transfer" && transferOn && (
              <>
                <QStep show label="כמה אנשים צריכים הסעה?" qty={transferQty} setQty={setTransferQty} max={Math.max(guests, 1)} total={trTotal} />
                <button onClick={() => setShowTransfer(true)}
                  className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors text-sm text-right">
                  <span className="text-blue-700 font-semibold">{flightFilled(flight) ? "✓ פרטי טיסה נשמרו · עריכה" : "מלא פרטי טיסה להסעה ←"}</span>
                  <span className="text-xs text-blue-400">הגעה + חזור</span>
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  // bank transfer (collapsible) — used inside the floating sheet & desktop
  const paymentBlock = (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <button onClick={() => setShowBank(v => !v)} className="w-full flex items-center justify-between text-blue-600">
        <span className="flex items-center gap-2"><IconBank size={18} /><span className="font-bold text-slate-800">תשלום בהעברה בנקאית</span></span>
        <span className="text-xs font-bold text-blue-600">{showBank ? "הסתר ▲" : "הצג פרטים ▼"}</span>
      </button>
      {showBank && (
        <div className="space-y-4 mt-4">
          <div>
            <p className="text-xs font-bold text-slate-500 border-b border-slate-200 pb-1 mb-2">העברה בשקלים (ILS)</p>
            <KV k="בנק" v={bank.name} /><KV k="סניף" v={bank.branch} /><KV k="מספר חשבון" v={bank.account} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 border-b border-slate-200 pb-1 mb-2">העברה בינלאומית (FX)</p>
            <KV k="IBAN" v={bank.iban} mono /><KV k="SWIFT" v={bank.swift} mono /><KV k="מוטב" v={bank.holder} />
          </div>
        </div>
      )}
    </div>
  );

  // credit-card explanation — shown at the bottom of the quote (not in the sheet)
  const cardInfoNote = (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="font-display font-bold text-slate-900 flex items-center gap-2 mb-3"><IconCreditCard size={18} className="text-blue-600" /> תשלום בכרטיס אשראי</h3>
      <ul className="space-y-2 text-sm text-slate-600">
        <li className="flex items-center gap-2"><IconCheck size={14} className="text-emerald-500" /> עד 3 תשלומים ללא ריבית</li>
        <li className="flex items-center gap-2"><IconCheck size={14} className="text-emerald-500" /> תשלום מאובטח בתקן PCI-DSS · PayPlus</li>
        <li className="flex items-center gap-2"><IconCheck size={14} className="text-emerald-500" /> בכרטיס נוספת עמלת סליקה 1.9%</li>
        <li className="flex items-center gap-2"><IconCheck size={14} className="text-emerald-500" /> אפשר לשלם בהעברה בנקאית ללא עמלה — דברו עם נציג</li>
      </ul>
    </div>
  );

  return (
    <div className="bg-[#f7f9fb] min-h-screen" dir="rtl">

      {/* DESKTOP TOP NAV */}
      <header className="hidden lg:flex sticky top-0 z-50 bg-white border-b border-slate-100 px-8 h-16 items-center justify-between">
        <a href="/"><Logo className="h-9" /></a>
        <span className="text-sm font-semibold text-slate-400">הצעת מחיר אישית · {apartment}</span>
      </header>

      {/* MOBILE HEADER */}
      <header className="lg:hidden absolute top-0 inset-x-0 z-30 px-4 py-4 flex items-center justify-between">
        <a href="/"><Logo className="h-9" white /></a>
        <div className="flex items-center gap-2">
          <button onClick={() => setSheetOpen(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold"><IconPlus size={13} /> תוספות</button>
          <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold"><IconImage size={13} /> תמונות</button>
        </div>
      </header>

      {/* MOBILE LAYOUT */}
      <div className="lg:hidden pb-28">
        <section className="relative w-full h-[440px] bg-slate-900 overflow-hidden"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 90%, 0 100%)" }}>
          {imgs.map((src, i) => (
            <img key={i} src={src} alt={apartment}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === imgIdx ? "opacity-100" : "opacity-0"}`} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/25" />

          {/* image arrows + dots */}
          {imgs.length > 1 && (
            <>
              <button onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)} aria-label="הקודם"
                className="absolute top-1/3 right-3 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center z-10">
                <IconChevronLeft size={18} className="rotate-180" /></button>
              <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)} aria-label="הבא"
                className="absolute top-1/3 left-3 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center z-10">
                <IconChevronLeft size={18} /></button>
              <div className="absolute top-[30%] left-0 right-0 flex justify-center gap-1.5 z-10">
                {imgs.slice(0, 10).map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} aria-label={`תמונה ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${i === imgIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
                ))}
              </div>
            </>
          )}

          <div className="absolute bottom-16 inset-x-0 px-6 text-white">
            <div className="flex items-center gap-1.5 text-xs font-medium opacity-90 mb-1.5">
              <IconMountain size={13} /> Val Thorens, France
            </div>
            <h1 className="font-display text-5xl font-black leading-none">{apartment}</h1>
            <p className="text-white/60 text-sm mt-2">הצעת מחיר בלעדית</p>
          </div>
        </section>

        <div className="px-4 -mt-4 relative z-20 space-y-5">
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
            <div className="p-5 space-y-4">
              <DetailRow icon={<IconCalendar size={20} />} label="תאריכים"
                main={`${fmtDate(checkin)} — ${fmtDate(checkout)}`} sub={`${nights} לילות`} />
              <div className="h-px bg-slate-100" />
              <DetailRow icon={<IconUsers size={20} />} label="הרכב" main={`${guests} אנשים`} />
            </div>
            <div className="px-5 pt-4 pb-5 bg-slate-50/70 border-t border-slate-100">
              <h3 className="font-display font-bold text-slate-900 mb-3">פירוט מחיר</h3>
              <div className="divide-y divide-slate-100">{breakdownRows}</div>
            </div>
            <div className="bg-slate-900 px-5 py-5 flex items-center justify-between text-white relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="relative">
                <p className="text-white/50 text-sm">סה״כ לתשלום</p>
                <p className="text-white/35 text-xs mt-0.5">{guests} אנשים · {nights} לילות</p>
              </div>
              <div className="relative text-left">
                <p className="font-display text-4xl font-black text-emerald-400 leading-none">€{liveTotal.toLocaleString()}</p>
                <p className="text-white/40 text-xs mt-1">~ €{Math.round(liveTotal / nights)} / לילה</p>
              </div>
            </div>
          </div>

          {/* Booking options (mobile, on the page) */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100 p-5 space-y-4">
            <h3 className="font-display font-bold text-slate-900 flex items-center gap-2"><IconPlus size={18} className="text-blue-600" /> התאמת ההזמנה</h3>
            {addonsGrid}
            {splitSelector}
          </div>

          {/* About + location */}
          {apt?.description && (
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100 p-5">
              <h3 className="font-display font-bold text-slate-900 mb-2">על הדירה</h3>
              <p className={`text-sm text-slate-500 leading-relaxed whitespace-pre-line ${showDesc ? "" : "line-clamp-3"}`}>{apt.description}</p>
              {apt.description.length > 180 && (
                <button onClick={() => setShowDesc(v => !v)} className="mt-2 text-sm font-bold text-blue-600">{showDesc ? "הצג פחות ↑" : "קרא עוד ←"}</button>
              )}
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100 p-5">
            <h3 className="font-display font-bold text-slate-900 mb-2">מיקום</h3>
            {apt?.map_url ? (
              <a href={apt.map_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-100 p-4 hover:bg-blue-100 transition">
                <span className="flex items-center gap-2 font-bold text-slate-800"><IconMountain size={16} className="text-blue-600" /> Val Thorens, France</span>
                <span className="text-xs font-bold text-blue-600">פתח במפה ←</span>
              </a>
            ) : (
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-slate-600">
                <span className="flex items-center gap-2 font-bold text-slate-800 mb-1"><IconMountain size={16} className="text-blue-600" /> Val Thorens, France</span>
                <p>הכפר הגבוה ביותר באירופה · 2,300 מ׳ · גישה ישירה ל-600 ק״מ מסלולים</p>
              </div>
            )}
          </div>

          {policiesCard}
          {cardInfoNote}

          <p className="flex items-center gap-1.5 justify-center text-xs text-slate-400 pt-2">
            <IconCheck size={13} className="text-emerald-500" /> הצעה תקפה ל־30 יום · SkiShare · Val Thorens
          </p>
        </div>
      </div>

      {/* MOBILE floating bar + sheet */}
      {!sheetOpen && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}>
          <div className="flex-shrink-0 text-right leading-none">
            <div className="text-[11px] text-slate-400 mb-0.5">סה״כ · {nights} לילות</div>
            <div className="text-xl font-black text-slate-900">€{liveTotal.toLocaleString()}</div>
          </div>
          <button onClick={() => setSheetOpen(true)} className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base transition">
            בחר/י תוספות ותשלום ↑
          </button>
        </div>
      )}
      {sheetOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/45" onClick={() => setSheetOpen(false)} />}
      <div className={`lg:hidden fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ${sheetOpen ? "translate-y-0" : "translate-y-full"}`}>
        <div className="bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 space-y-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
          <button onClick={() => setSheetOpen(false)} className="w-full flex justify-center"><span className="w-10 h-1.5 rounded-full bg-slate-300" /></button>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-black text-slate-900">תשלום</h3>
            <span className="font-display text-2xl font-black text-emerald-500">€{(splitCount > 1 ? payNow : liveTotal).toLocaleString()}</span>
          </div>

          {/* order summary (collapsible) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={() => setShowSummary(v => !v)} className="w-full flex items-center justify-between p-3.5">
              <span className="text-sm font-bold text-slate-800">סיכום ההזמנה והתוספות</span>
              <span className="text-slate-400 text-sm">{showSummary ? "▲" : "▼"}</span>
            </button>
            {showSummary && <div className="px-3.5 pb-2 divide-y divide-slate-100">{breakdownRows}</div>}
          </div>

          {choicesBlock}
          <CardPaymentButton apartmentId={apartmentId} apartment={apartment} checkin={checkin} checkout={checkout}
            guests={guests} nights={nights} skiPass={skiPass} transfer={transferOn} equipment={equipmentOn} transferDetails={transferDetails} cancel={cancel} service={service}
            grandTotal={payNow} split={splitProp}
            label={splitCount > 1 ? "שלם/י את חלקך בכרטיס" : undefined}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base transition" />
          <a href={waHref} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold py-3.5 rounded-xl transition"><IconWhatsApp size={20} /> צור קשר עם נציג</a>
          {paymentBlock}
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:block">
        <div className="max-w-6xl mx-auto px-8 pt-10">
          {/* clean header */}
          <div className="flex items-end justify-between gap-8 mb-6">
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">
                הצעת מחיר בלעדית
              </div>
              <h1 className="font-display text-5xl font-black text-slate-900 leading-none">{apartment}</h1>
              <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-3"><IconMountain size={14} className="text-blue-500" /> Val Thorens · Trois Vallées · France</p>
            </div>
            <div className="text-left flex-shrink-0">
              <p className="text-xs text-slate-400 mb-0.5">סה״כ לתשלום</p>
              <p className="font-display text-3xl font-black text-slate-900 leading-none">€{liveTotal.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">{fmtDate(checkin)} — {fmtDate(checkout)}</p>
            </div>
          </div>

          {/* framed gallery — Airbnb-style grid */}
          <div className="relative rounded-3xl overflow-hidden ring-1 ring-slate-200/80 shadow-[0_18px_50px_-12px_rgba(2,6,23,0.25)] h-[460px]">
            {imgs.length >= 5 ? (
              <div className="grid grid-cols-4 grid-rows-2 gap-2 h-full">
                <button onClick={() => setLightbox(0)}
                  className="col-span-2 row-span-2 relative group overflow-hidden">
                  <img src={imgs[0]} alt={apartment} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                </button>
                {imgs.slice(1, 5).map((src, i) => (
                  <button key={i} onClick={() => setLightbox(i + 1)} className="relative group overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={() => setLightbox(0)} className="block w-full h-full group overflow-hidden">
                <img src={imgs[0]} alt={apartment} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </button>
            )}

            {/* show-all button */}
            <button onClick={() => setLightbox(0)}
              className="absolute bottom-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-slate-800 text-sm font-bold shadow-md backdrop-blur transition">
              <IconImage size={15} /> כל התמונות{imgs.length > 1 ? ` (${imgs.length})` : ""}
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-[340px_1fr] gap-8 items-start">
          <aside className="sticky top-24 space-y-4">
            <div className="bg-slate-900 rounded-2xl p-6 text-white text-center relative overflow-hidden">
              <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
              <p className="relative text-white/50 text-sm mb-1">סה״כ לתשלום</p>
              <p className="relative font-display text-5xl font-black text-emerald-400 leading-none">€{liveTotal.toLocaleString()}</p>
              <p className="relative text-white/40 text-xs mt-2">~ €{Math.round(liveTotal / nights)} / לילה</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="divide-y divide-slate-100">{breakdownRows}</div>

              <div className="mt-4">{splitSelector}</div>
              <div className="mt-3">
                <CardPaymentButton apartmentId={apartmentId} apartment={apartment} checkin={checkin} checkout={checkout}
                  guests={guests} nights={nights} skiPass={skiPass} transfer={transferOn} equipment={equipmentOn} transferDetails={transferDetails} cancel={cancel} service={service}
                  grandTotal={payNow} split={splitProp} label={splitCount > 1 ? "שלם/י את חלקך בכרטיס" : undefined} />
              </div>
              <a href={waHref} target="_blank" rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold py-3.5 rounded-xl text-center transition shadow-sm shadow-emerald-600/20">
                <IconWhatsApp size={20} /> צור קשר עם נציג
              </a>
              {apt?.map_url && (
                <a href={apt.map_url} target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 w-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-bold py-3 rounded-xl text-center text-sm transition">
                  <IconMountain size={16} className="text-blue-500" /> מיקום הדירה ב-Google Maps ←
                </a>
              )}
              <p className="text-center text-xs text-slate-400 mt-3">תשלום מאובטח · PayPlus · או סגירה בוואטסאפ</p>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-5 text-right">פרטי החופשה</h2>
              <div className="grid grid-cols-3 gap-4">
                <StatCard icon={<IconCalendar size={20} />} label="תאריכים" value={`${fmtDate(checkin)} — ${fmtDate(checkout)}`} />
                <StatCard icon={<IconMoon size={20} />} label="משך זמן" value={`${nights} לילות`} />
                <StatCard icon={<IconUsers size={20} />} label="הרכב" value={`${guests} אנשים`} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl font-bold text-slate-900">תוספות זמינות</h2>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">אופציונלי</span>
              </div>
              {addonsGrid}
              <div className="mt-5">{choicesBlock}</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7 space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-900">דרכי תשלום</h2>
              {paymentBlock}
            </div>
            {cardInfoNote}
          </main>
        </div>

        <footer className="bg-slate-100 border-t border-slate-200 py-10 mt-6">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <a href="/" className="inline-block"><Logo className="h-10 mx-auto" /></a>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500 mt-4">
              <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'skishareteam@gmail.com'}`} className="hover:text-blue-600">צור קשר</a>
              <span>·</span><span>פרטי בנק</span>
              <span>·</span><span>מדיניות פרטיות</span>
              <span>·</span><span>תנאי שימוש</span>
            </div>
            <p className="text-xs text-slate-400 mt-4">© 2026 SkiShare Premium Travel · Val Thorens, France</p>
          </div>
        </footer>
      </div>

      {/* LIGHTBOX */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)}
            className="absolute top-5 left-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl transition">✕</button>
          <span className="absolute top-6 right-6 text-white/70 text-sm font-semibold">{lightbox + 1} / {imgs.length}</span>

          <button onClick={(e) => { e.stopPropagation(); setLightbox(v => ((v! - 1 + imgs.length) % imgs.length)); }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition">
            <IconChevronLeft size={22} className="rotate-180" />
          </button>
          <img src={imgs[lightbox]} alt="" onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl" />
          <button onClick={(e) => { e.stopPropagation(); setLightbox(v => ((v! + 1) % imgs.length)); }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition">
            <IconChevronLeft size={22} />
          </button>

          {/* thumbnail strip */}
          <div className="absolute bottom-5 inset-x-0 flex justify-center gap-2 px-4 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
            {imgs.map((src, i) => (
              <button key={i} onClick={() => setLightbox(i)}
                className={`w-14 h-14 rounded-lg overflow-hidden ring-2 flex-shrink-0 transition ${i === lightbox ? "ring-white" : "ring-white/20 opacity-60 hover:opacity-100"}`}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {showNoCancel && (
        <div dir="rtl" className="fixed inset-0 z-[95] bg-black/55 flex items-center justify-center p-4" onClick={() => setShowNoCancel(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl font-black text-slate-900 mb-1">ללא אפשרות ביטול</h2>
            <p className="text-sm text-slate-500 mb-4">אפשרות זו מוזילה ב-€100, אך ההזמנה <b>אינה ניתנת לביטול</b> ולא יינתן החזר כספי, בהתאם לתקנון.</p>
            <label className="flex items-start gap-2 cursor-pointer mb-4">
              <input type="checkbox" checked={noCancelAgreed} onChange={e => setNoCancelAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-600" />
              <span className="text-sm text-slate-600 leading-relaxed">אני מאשר/ת שהבנתי כי <b>לא אוכל לבטל</b> ולא אקבל החזר, ומסכים/ה ל<a href="/terms" target="_blank" className="text-blue-600 underline">תקנון</a>.</span>
            </label>
            <label className="block text-xs font-bold text-slate-400 mb-1">חתימה (שם מלא)</label>
            <input value={signature} onChange={e => setSignature(e.target.value)} placeholder="הקלד/י את שמך המלא"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2">
              <button disabled={!noCancelAgreed || signature.trim().length < 2} onClick={() => { setCancel("none"); setShowNoCancel(false); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl">אישור וחתימה</button>
              <button onClick={() => setShowNoCancel(false)} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold">ביטול</button>
            </div>
          </div>
        </div>
      )}

      <FlightDetailsModal open={showTransfer} onClose={() => setShowTransfer(false)} value={flight} onChange={setFlight} />
    </div>
  );
}

/* ── small components ──────────────────────────────────────── */
function Row({ label, sub, amount, green }: { label: string; sub?: string; amount: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <p className={`font-display font-bold tabular-nums ${green ? "text-emerald-600" : "text-slate-900"}`}>{amount}</p>
    </div>
  );
}

function DetailRow({ icon, label, main, sub }: { icon: React.ReactNode; label: string; main: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-right">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="font-display font-bold text-slate-900">{main}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <span className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">{icon}</span>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-right">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">{icon}</span>
      </div>
      <p className="font-display font-bold text-slate-900">{value}</p>
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs text-slate-400 flex-shrink-0">{k}</span>
      <span className={`text-sm font-semibold text-slate-800 text-left ${mono ? "font-mono tracking-tight" : ""}`}>{v}</span>
    </div>
  );
}
