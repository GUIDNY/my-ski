"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Apartment } from "@/types";
import { calcTotalForRange } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import CardPaymentButton from "@/components/CardPaymentButton";
import { buildWaHref } from "@/lib/whatsapp";
import { IconMountain, IconUser, IconBed, IconCheck, IconWhatsApp } from "@/components/Icons";
import Logo from "@/components/Logo";

const HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmt = (s: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE[d.getMonth()]} ${d.getFullYear()}`; };
const capacity = (a: Apartment) => a.max_guests || a.beds * 2 || 2;
const SKI_DAY_PRICE = 70;
const TRANSFER_PRICE = 180;

function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const imgs = images?.length ? images : ["/hero-ski.jpg"];
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative h-52 rounded-t-2xl overflow-hidden group">
      <img src={imgs[idx]} alt={alt} className="w-full h-full object-cover" />
      {imgs.length > 1 && (
        <>
          <button onClick={() => setIdx((idx - 1 + imgs.length) % imgs.length)}
            className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow text-gray-700">›</button>
          <button onClick={() => setIdx((idx + 1) % imgs.length)}
            className="absolute top-1/2 left-2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow text-gray-700">‹</button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {imgs.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white scale-125" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AptBlock({ a }: { a: Apartment }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <Gallery images={a.images} alt={a.name} />
      <div className="p-5 text-right">
        <h3 className="font-display font-black text-gray-900 text-lg">{a.name}</h3>
        <p className="text-xs text-gray-400 mb-3">{a.type}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500 justify-end mb-3">
          <span className="flex items-center gap-1 font-bold text-blue-600"><IconUser size={12} /> עד {capacity(a)}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><IconBed size={12} /> {a.beds} חד׳</span>
          <span>·</span>
          <span>{a.baths} אמב׳</span>
          <span>·</span>
          <span>{a.sqm} מ״ר</span>
        </div>
        {a.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end mb-3">
            {a.amenities.slice(0, 6).map((am, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full">
                <IconCheck size={10} className="text-green-500" /> {am}
              </span>
            ))}
          </div>
        )}
        {a.description && <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{a.description}</p>}
      </div>
    </div>
  );
}

function ComboInner() {
  const params = useSearchParams();
  const aId = params.get("a") || "", bId = params.get("b") || "";
  const checkin = params.get("checkin") || "", checkout = params.get("checkout") || "";
  const guests = parseInt(params.get("guests") || "2");
  const nights = checkin && checkout ? Math.round((+new Date(checkout) - +new Date(checkin)) / 86400000) : 0;

  const [a, setA] = useState<Apartment | null>(null);
  const [b, setB] = useState<Apartment | null>(null);
  const [rulesA, setRulesA] = useState<PricingRule[]>([]);
  const [rulesB, setRulesB] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [skiPass, setSkiPass] = useState(false);
  const [transfer, setTransfer] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/apartments").then(r => r.json()),
      fetch(`/api/pricing-rules?apartment_id=${aId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/pricing-rules?apartment_id=${bId}`).then(r => r.json()).catch(() => []),
    ]).then(([apts, ra, rb]) => {
      const list: Apartment[] = Array.isArray(apts) ? apts : [];
      setA(list.find(x => x.id === aId) ?? null);
      setB(list.find(x => x.id === bId) ?? null);
      setRulesA(Array.isArray(ra) ? ra : []);
      setRulesB(Array.isArray(rb) ? rb : []);
      setLoading(false);
    });
  }, [aId, bId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!a || !b) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500" dir="rtl">השילוב לא נמצא. <a href="/apartments" className="text-blue-600 underline mr-1">חזרה לדירות</a></div>;

  const totalA = nights > 0 ? calcTotalForRange(checkin, checkout, Number(a.price_per_night), rulesA) : Number(a.price_per_night);
  const totalB = nights > 0 ? calcTotalForRange(checkin, checkout, Number(b.price_per_night), rulesB) : Number(b.price_per_night);
  const skiTotal = skiPass ? SKI_DAY_PRICE * guests * Math.max(nights, 1) : 0;
  const trTotal = transfer ? TRANSFER_PRICE : 0;
  const total = totalA + totalB + skiTotal + trTotal;
  const comboName = `${a.name} + ${b.name}`;

  const wa = buildWaHref({
    intro: "היי! מעוניין/ת בחבילה משולבת של שתי דירות 🎿",
    lines: [
      `דירות: ${comboName}`, `תאריכים: ${fmt(checkin)}–${fmt(checkout)}`, `${guests} אורחים · ${nights} לילות`,
      skiPass ? "🎿 כולל סקי פס" : "", transfer ? "🚐 כולל הסעה" : "",
    ].filter(Boolean),
    total,
  });

  return (
    <div className="min-h-screen bg-[#f8f9ff]" dir="rtl">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/apartments" className="text-sm text-gray-500 hover:text-gray-900">→ חזרה לדירות</a>
          <a href="/"><Logo className="h-8" /></a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        <div className="text-center mb-7">
          <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">חבילה משולבת · 2 דירות</span>
          <h1 className="font-display text-3xl font-black text-gray-900">{comboName}</h1>
          <p className="text-gray-500 mt-1 flex items-center justify-center gap-1"><IconMountain size={14} className="text-blue-400" /> Val Thorens · מתאים עד {capacity(a) + capacity(b)} אורחים</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* Apartments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AptBlock a={a} />
            <AptBlock a={b} />
          </div>

          {/* Booking panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 lg:sticky lg:top-24">
            <div className="space-y-2.5">
              <Row label="תאריכים" value={`${fmt(checkin)} – ${fmt(checkout)}`} />
              <Row label="לילות" value={`${nights}`} />
              <Row label="אורחים" value={`${guests}`} />
            </div>

            {/* Add-ons */}
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">תוספות</div>
              <Addon label="סקי פס · Trois Vallées" sub={`€${SKI_DAY_PRICE} ליום · לאדם`} checked={skiPass} onChange={setSkiPass} />
              <Addon label="הסעה הלוך-חזור" sub={`+€${TRANSFER_PRICE}`} checked={transfer} onChange={setTransfer} />
            </div>

            {/* Breakdown */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <Row label={a.name} value={`€${totalA.toLocaleString()}`} muted />
              <Row label={b.name} value={`€${totalB.toLocaleString()}`} muted />
              {skiPass && <Row label={`סקי פס × ${guests} × ${nights}`} value={`€${skiTotal.toLocaleString()}`} muted />}
              {transfer && <Row label="הסעה" value={`€${trTotal}`} muted />}
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="font-black text-gray-900 text-lg">סה״כ</span>
              <span className="font-display text-2xl font-black text-blue-600">€{total.toLocaleString()}</span>
            </div>

            <CardPaymentButton
              apartmentId={a.id} apartment={comboName}
              extraApartmentId={b.id} extraApartmentName={b.name}
              checkin={checkin} checkout={checkout} guests={guests} nights={nights}
              skiPass={skiPass} transfer={transfer} grandTotal={total} cancel="none" service="human"
              label="תשלום מאובטח בכרטיס" />
            <a href={wa} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold py-3.5 rounded-xl transition">
              <IconWhatsApp size={20} /> תיאום בוואטסאפ
            </a>
            <p className="text-center text-xs text-gray-400">הזמנה אחת לשתי הדירות · תשלום מאובטח PayPlus</p>
          </div>
        </div>
      </main>
    </div>
  );
}

const Row = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={muted ? "text-gray-400 text-sm" : "text-gray-600"}>{label}</span>
    <span className={muted ? "text-gray-500 text-sm" : "font-bold text-gray-900"}>{value}</span>
  </div>
);

function Addon({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
      <div className="text-right">
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        <div className="text-xs text-gray-400">{sub}</div>
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-5 h-5 accent-blue-600" />
    </label>
  );
}

export default function ComboPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50" />}><ComboInner /></Suspense>;
}
