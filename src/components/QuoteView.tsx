"use client";
import { useEffect, useState } from "react";
import type { Apartment } from "@/types";
import {
  IconMountain, IconCalendar, IconChevronLeft, IconCheck, IconPlus, IconImage,
  IconTicket, IconSkis, IconBus, IconBank, IconCreditCard,
  IconUsers, IconUser, IconMoon, IconWhatsApp,
} from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";
import { getEffectivePrice } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import Logo from "@/components/Logo";
import CardPaymentButton from "@/components/CardPaymentButton";
import FlightDetailsModal, { EMPTY_FLIGHT, flightToString, flightFilled, type Flight } from "@/components/FlightDetailsModal";

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

export default function QuoteView({ q }: { q: QuoteData }) {
  const {
    apartmentId, apartment, checkin, checkout, guests, nights,
    skiPass, transfer, cancel, service, aptTotal, grandTotal,
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
  const trTotal = transferOn ? TRANSFER_PRICE : 0;
  const equipTotal = equipmentOn ? equipCost(nights) : 0;
  const flexExtra = cancel === "flexible" ? FLEXIBLE_EXTRA * guests : 0;
  const aiDisc = service === "ai" ? AI_DISCOUNT * guests : 0;
  const liveTotal = baseApt + trTotal + equipTotal + flexExtra - aiDisc;

  const ADDONS = [
    { key: "skipass", icon: <IconTicket size={20} />, title: "סקי פס", sub: "כל אזור Trois Vallées · 600 ק״מ מסלולים", soon: true },
    { key: "equipment", icon: <IconSkis size={20} />, title: "השכרת ציוד סקי/סנובורד", sub: "€30 ליום · €120 לשבוע · +€20 ליום נוסף", price: equipCost(nights), on: equipmentOn, toggle: () => setEquipmentOn(v => !v) },
    { key: "transfer", icon: <IconBus size={20} />, title: "הסעה הלוך-חזור", sub: "משדה התעופה וחזרה · מחיר לא קבוע, עשוי להשתנות", price: TRANSFER_PRICE, on: transferOn, toggle: () => setTransferOn(v => !v) },
    { key: "lessons", icon: <IconUser size={20} />, title: "שיעורי סקי / סנובורד", sub: "מדריך מוסמך · כל הרמות", soon: true },
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
      cancel === "flexible" ? "✅ מדיניות ביטול גמישה" : null,
      skiPass ? "🎿 מעוניין/ת גם בסקי פס" : null,
      service === "ai" ? "🤖 ניהול עצמאי (AI)" : null,
    ],
    total: liveTotal,
    pageUrl: pageUrl ? `ההצעה: ${pageUrl}` : undefined,
  });

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
      {transferOn      && <Row label="הסעה הלוך־חזור" sub="שאטל פרטי" amount={`€${TRANSFER_PRICE}`} />}
      {equipmentOn     && <Row label="השכרת ציוד" sub={`${nights} לילות`} amount={`€${equipTotal.toLocaleString()}`} />}
      {cancel === "flexible" && <Row label="ביטול גמיש" sub={`${guests} אורחים`} amount={`€${(FLEXIBLE_EXTRA * guests).toLocaleString()}`} />}
      {service === "ai" && <Row label="הנחת AI" sub="ניהול עצמאי" amount={`−€${(AI_DISCOUNT * guests).toLocaleString()}`} green />}
      {skiPass && (
        <div className="flex items-center justify-between py-2.5">
          <div><p className="text-sm font-medium text-slate-700">סקי פס</p></div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">בקרוב</span>
        </div>
      )}
    </>
  );

  const addonsGrid = (
    <div className="space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {ADDONS.map((a) => {
        const soon = "soon" in a && a.soon;
        const selected = "on" in a && a.on;
        return (
          <button key={a.key} type="button" disabled={soon} onClick={() => "toggle" in a && a.toggle?.()}
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-right transition-all ${soon ? "bg-slate-50 border-slate-100 cursor-default" : selected ? "bg-blue-50 border-blue-400" : "bg-white border-slate-200 hover:border-blue-300"}`}>
            <span className={`w-10 h-10 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0 ${selected ? "bg-blue-600 text-white" : "bg-white text-blue-600"}`}>{a.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{a.title}</p>
              <p className="text-xs text-slate-400 truncate">{a.sub}</p>
            </div>
            {soon
              ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex-shrink-0">בקרוב</span>
              : <span className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">+€{(a as { price: number }).price}</span>
                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${selected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"}`}>{selected && <IconCheck size={12} />}</span>
                </span>}
          </button>
        );
      })}
    </div>
    {transferOn && (
      <button onClick={() => setShowTransfer(true)}
        className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors text-sm text-right">
        <span className="text-blue-700 font-semibold">{flightFilled(flight) ? "✓ פרטי טיסה נשמרו · עריכה" : "מלא פרטי טיסה להסעה ←"}</span>
        <span className="text-xs text-blue-400">הגעה + חזור</span>
      </button>
    )}
    </div>
  );

  const paymentBlock = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
        <button onClick={() => setShowBank(v => !v)} className="w-full flex items-center justify-between text-blue-600">
          <span className="flex items-center gap-2"><IconBank size={18} /><span className="font-bold text-slate-800">תשלום בהעברה בנקאית</span></span>
          <span className="text-xs font-bold text-blue-600">{showBank ? "הסתר ▲" : "הצג פרטים ▼"}</span>
        </button>
        {showBank && (
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-xs font-bold text-slate-500 border-b border-slate-200 pb-1 mb-2">העברה בשקלים (ILS)</p>
              <KV k="בנק" v={bank.name} />
              <KV k="סניף" v={bank.branch} />
              <KV k="מספר חשבון" v={bank.account} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 border-b border-slate-200 pb-1 mb-2">העברה בינלאומית (FX)</p>
              <KV k="IBAN" v={bank.iban} mono />
              <KV k="SWIFT" v={bank.swift} mono />
              <KV k="מוטב" v={bank.holder} />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-blue-600">
            <IconCreditCard size={18} /><span className="font-bold text-slate-800">כרטיס אשראי</span>
          </div>
          <div className="flex gap-1">
            <div className="w-8 h-5 rounded bg-slate-200" />
            <div className="w-8 h-5 rounded bg-slate-200" />
          </div>
        </div>
        <ul className="space-y-2.5">
          <li className="flex items-center gap-2 text-sm text-slate-600"><IconCheck size={14} className="text-emerald-500" /> עד 3 תשלומים ללא ריבית</li>
          <li className="flex items-center gap-2 text-sm text-slate-600"><IconCheck size={14} className="text-emerald-500" /> תשלום מאובטח בתקן PCI-DSS</li>
        </ul>
      </div>
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
            <h3 className="font-display text-lg font-black text-slate-900">תוספות ותשלום</h3>
            <span className="font-display text-2xl font-black text-emerald-500">€{liveTotal.toLocaleString()}</span>
          </div>
          {addonsGrid}
          <CardPaymentButton apartmentId={apartmentId} apartment={apartment} checkin={checkin} checkout={checkout}
            guests={guests} nights={nights} skiPass={skiPass} transfer={transferOn} equipment={equipmentOn} transferDetails={transferDetails} cancel={cancel} service={service}
            grandTotal={liveTotal}
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

              <div className="mt-4">
                <CardPaymentButton apartmentId={apartmentId} apartment={apartment} checkin={checkin} checkout={checkout}
                  guests={guests} nights={nights} skiPass={skiPass} transfer={transferOn} equipment={equipmentOn} transferDetails={transferDetails} cancel={cancel} service={service}
                  grandTotal={liveTotal} />
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
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-5">דרכי תשלום</h2>
              {paymentBlock}
            </div>
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

      {/* MOBILE STICKY CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <p className="text-[11px] text-slate-400 leading-none mb-0.5">סה״כ</p>
            <p className="font-display font-black text-slate-900 text-lg leading-none">€{liveTotal.toLocaleString()}</p>
          </div>
          <a href={waHref} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold py-3.5 rounded-xl text-center transition shadow-sm shadow-emerald-600/20">
            <IconWhatsApp size={18} /> צור קשר להזמנה
          </a>
        </div>
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
