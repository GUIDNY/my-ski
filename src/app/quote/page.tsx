"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Apartment } from "@/types";
import {
  IconMountain, IconCalendar, IconChevronLeft, IconCheck,
} from "@/components/Icons";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;
};
const fmtFull = (s: string) => {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return `${d.getDate()} ${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const TRANSFER_PRICE = 180;
const FLEXIBLE_EXTRA = 100;
const AI_DISCOUNT = 50;

function QuotePage() {
  const params = useSearchParams();
  const router = useRouter();
  const [apt, setApt] = useState<Apartment | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  const apartmentId = params.get("apartment_id") ?? "";
  const apartment = params.get("apartment") ?? "דירה";
  const checkin = params.get("checkin") ?? "";
  const checkout = params.get("checkout") ?? "";
  const guests = parseInt(params.get("guests") ?? "2");
  const nights = parseInt(params.get("nights") ?? "1");
  const skiPass = params.get("ski_pass") === "true";
  const transfer = params.get("transfer") === "true";
  const cancel = params.get("cancel") ?? "none";
  const service = params.get("service") ?? "human";

  const aptTotal = parseInt(params.get("apt_total") ?? "0");
  const flexExtra = parseInt(params.get("flex_extra") ?? "0");
  const grandTotal = parseInt(params.get("grand_total") ?? "0");

  useEffect(() => {
    if (!apartmentId) return;
    fetch(`/api/apartments/${apartmentId}`)
      .then(r => r.json())
      .then(setApt)
      .catch(() => {});
  }, [apartmentId]);

  const imgs = apt?.images?.length ? apt.images : ["/apt1.jpg", "/apt2.jpg", "/apt3.jpg"];
  const avgNightly = nights > 0 ? Math.round(aptTotal / nights) : aptTotal;

  const lineItems = [
    { label: "לינה", sub: `${avgNightly.toLocaleString()} € × ${nights} לילות`, amount: aptTotal, show: true },
    { label: "הסעה הלוך־חזור", sub: "שאטל פרטי משדה התעופה", amount: TRANSFER_PRICE, show: transfer },
    { label: "מדיניות ביטול גמישה", sub: `80% החזר · ${guests} אורחים`, amount: FLEXIBLE_EXTRA * guests, show: cancel === "flexible" },
    { label: "הנחת ניהול עצמאי", sub: "AI concierge", amount: -(AI_DISCOUNT * guests), show: service === "ai" },
  ].filter(i => i.show);

  const bank = {
    name: process.env.NEXT_PUBLIC_BANK_NAME || "בנק הפועלים",
    iban: process.env.NEXT_PUBLIC_BANK_IBAN || "IL62012673000000026026",
    swift: process.env.NEXT_PUBLIC_BANK_SWIFT || "POALILIT",
    account: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "SKISHARE - GUINDY IDAN AND MIZRAHI AMIT",
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-28" dir="rtl">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="absolute top-0 inset-x-0 z-30 px-5 md:px-8 py-5 flex items-center justify-between">
        <button onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition">
          <IconChevronLeft size={18} className="rotate-180" />
        </button>
        <div className="flex items-center gap-2 text-white font-display font-bold tracking-tight">
          MY·SKI
          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
            <IconMountain size={14} className="text-white" />
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative w-full h-[58vh] min-h-[420px] bg-slate-900 overflow-hidden">
        {imgs.map((src, i) => (
          <img key={i} src={src} alt={apartment}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === imgIdx ? "opacity-100" : "opacity-0"}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/15 to-slate-900/30" />

        {/* arrows */}
        {imgs.length > 1 && (
          <>
            <button onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition">
              <IconChevronLeft size={18} className="rotate-180" />
            </button>
            <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition">
              <IconChevronLeft size={18} />
            </button>
          </>
        )}

        {/* title */}
        <div className="absolute bottom-0 inset-x-0 p-6 md:p-10">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-white/80 text-xs font-medium tracking-widest uppercase mb-3">
              <IconMountain size={13} /> Val Thorens · France
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-black text-white leading-none">{apartment}</h1>
            <p className="text-white/60 text-sm mt-3">הצעת מחיר אישית · נשלחה {fmtFull(new Date().toISOString().slice(0,10))}</p>
          </div>
        </div>
      </section>

      {/* thumbnails */}
      {imgs.length > 1 && (
        <div className="max-w-3xl mx-auto px-6 md:px-10 -mt-8 relative z-20">
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
            {imgs.map((src, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden ring-2 transition ${i === imgIdx ? "ring-blue-500" : "ring-white"} shadow-md`}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 md:px-10 mt-10 space-y-5">

        {/* ── Stay details ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-100">
            <div className="p-5 text-center">
              <p className="text-xs text-slate-400 font-medium mb-1.5">כניסה</p>
              <p className="font-display font-bold text-slate-900">{fmtDate(checkin)}</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-xs text-slate-400 font-medium mb-1.5">יציאה</p>
              <p className="font-display font-bold text-slate-900">{fmtDate(checkout)}</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-xs text-slate-400 font-medium mb-1.5">אורחים</p>
              <p className="font-display font-bold text-slate-900">{guests} · {nights} לילות</p>
            </div>
          </div>
        </div>

        {/* ── Price breakdown ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 md:p-8">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-5">פירוט מחיר</h2>
          <div className="space-y-1">
            {lineItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div>
                  <p className="font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                </div>
                <p className={`font-display font-bold tabular-nums ${item.amount < 0 ? "text-emerald-600" : "text-slate-900"}`}>
                  {item.amount < 0 ? "−" : ""}€{Math.abs(item.amount).toLocaleString()}
                </p>
              </div>
            ))}
            {skiPass && (
              <div className="flex items-center justify-between py-3 border-b border-slate-50">
                <div>
                  <p className="font-medium text-slate-800">סקי פס · Trois Vallées</p>
                  <p className="text-xs text-slate-400 mt-0.5">600 ק״מ מסלולים</p>
                </div>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">מחיר בקרוב</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Total ─────────────────────────────────────────── */}
        <div className="rounded-2xl bg-slate-900 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="relative flex items-end justify-between">
            <div>
              <p className="text-white/50 text-sm mb-1">סה״כ לתשלום</p>
              <p className="text-white/40 text-xs">{guests} אורחים · {nights} לילות · ~€{Math.round(grandTotal / nights)}/לילה</p>
            </div>
            <p className="font-display text-5xl md:text-6xl font-black leading-none tabular-nums">€{grandTotal.toLocaleString()}</p>
          </div>
        </div>

        {/* ── Bank details ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 md:p-8">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">תשלום בהעברה בנקאית</h2>
          <p className="text-sm text-slate-400 mb-6">לאחר קבלת ההעברה נאשר את ההזמנה והדירה תהיה שמורה עבורך.</p>

          <div className="space-y-px rounded-xl overflow-hidden border border-slate-100">
            {[
              ["בנק", bank.name],
              ["IBAN", bank.iban],
              ["SWIFT", bank.swift],
              ["מוטב", bank.account],
            ].map(([k, v], i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-4 py-3.5 bg-slate-50/60 odd:bg-white">
                <span className="text-sm text-slate-400 flex-shrink-0">{k}</span>
                <span className={`text-sm font-semibold text-slate-800 text-left ${k === "IBAN" || k === "SWIFT" ? "font-mono tracking-tight" : ""}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* trust note */}
        <div className="flex items-center gap-2 justify-center text-xs text-slate-400 pt-2">
          <IconCheck size={13} className="text-emerald-500" />
          הצעה תקפה ל־30 יום · MySki · Val Thorens
        </div>
      </main>

      {/* ── Sticky CTA ────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-100 px-5 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex-shrink-0">
            <p className="text-[11px] text-slate-400 leading-none mb-0.5">סה״כ</p>
            <p className="font-display font-black text-slate-900 text-lg leading-none">€{grandTotal.toLocaleString()}</p>
          </div>
          <a href={`/book?apartment_id=${apartmentId}&apartment=${encodeURIComponent(apartment)}&checkin=${checkin}&checkout=${checkout}&guests=${guests}&ski_pass=${skiPass}&transfer=${transfer}&cancel=${cancel}&service=${service}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold py-3.5 rounded-xl text-center transition shadow-sm shadow-blue-600/20">
            המשך להזמנה ←
          </a>
        </div>
      </div>
    </div>
  );
}

export default function QuotePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <QuotePage />
    </Suspense>
  );
}
