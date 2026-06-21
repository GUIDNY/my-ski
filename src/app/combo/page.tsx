"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Apartment } from "@/types";
import { calcTotalForRange } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import CardPaymentButton from "@/components/CardPaymentButton";
import { buildWaHref } from "@/lib/whatsapp";
import { IconMountain, IconUser, IconBed, IconCheck, IconWhatsApp, IconStar, IconSkis, IconBus } from "@/components/Icons";
import Logo from "@/components/Logo";

const HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmt = (s: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE[d.getMonth()]} ${d.getFullYear()}`; };
const capacity = (a: Apartment) => a.max_guests || a.beds * 2 || 2;
const TRANSFER_PRICE = 180;

function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const imgs = images?.length ? images : ["/hero-ski.jpg"];
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative h-60 rounded-t-2xl overflow-hidden">
      <img src={imgs[idx]} alt={alt} className="w-full h-full object-cover" />
      {imgs.length > 1 && (
        <>
          <button onClick={() => setIdx((idx - 1 + imgs.length) % imgs.length)}
            className="absolute top-1/2 right-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white flex items-center justify-center shadow text-gray-700 text-lg">›</button>
          <button onClick={() => setIdx((idx + 1) % imgs.length)}
            className="absolute top-1/2 left-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white flex items-center justify-center shadow text-gray-700 text-lg">‹</button>
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
            {imgs.slice(0, 8).map((_, i) => (
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <Gallery images={a.images} alt={a.name} />
      <div className="p-5 text-right">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 text-sm"><IconStar size={13} className="text-amber-400" /><span className="font-bold text-gray-700">4.9</span></span>
          <h3 className="font-display font-black text-gray-900 text-lg">{a.name}</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1 justify-end">
          <IconMountain size={12} className="text-blue-400" /> Val Thorens, Trois Vallées · {a.type}
        </p>
        <div className="flex items-center gap-2.5 text-xs text-gray-500 justify-end mb-3 flex-wrap">
          <span className="flex items-center gap-1 font-bold text-blue-600"><IconUser size={12} /> עד {capacity(a)}</span>
          <span>·</span><span className="flex items-center gap-1"><IconBed size={12} /> {a.beds} חד׳</span>
          <span>·</span><span>{a.baths} אמב׳</span>
          <span>·</span><span>{a.sqm} מ״ר</span>
        </div>
        {a.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end mb-3">
            {a.amenities.slice(0, 8).map((am, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full">
                <IconCheck size={10} className="text-green-500" /> {am}
              </span>
            ))}
          </div>
        )}
        {a.description && <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line line-clamp-6">{a.description}</p>}
      </div>
    </div>
  );
}

function AddonCard({ icon, label, sublabel, price, checked, onChange }: {
  icon: React.ReactNode; label: string; sublabel: string; price: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-right ${checked ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-white hover:border-blue-200"}`}>
      <span className={`flex-shrink-0 ${checked ? "text-blue-600" : "text-gray-400"}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        <div className="text-xs text-gray-400">{sublabel}</div>
      </div>
      <span className="text-sm font-bold text-blue-600 flex-shrink-0 whitespace-nowrap">{price}</span>
      <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${checked ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300"}`}>{checked && <IconCheck size={12} />}</span>
    </button>
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
  const trTotal = transfer ? TRANSFER_PRICE : 0;
  const total = totalA + totalB + trTotal;           // ski pass: price coming soon → not charged
  const comboName = `${a.name} + ${b.name}`;
  const avgNightly = nights > 0 ? Math.round((totalA + totalB) / nights) : Number(a.price_per_night) + Number(b.price_per_night);

  const wa = buildWaHref({
    intro: "היי! מעוניין/ת בחבילה משולבת של שתי דירות 🎿",
    lines: [
      `דירות: ${comboName}`, `תאריכים: ${fmt(checkin)}–${fmt(checkout)}`, `${guests} אורחים · ${nights} לילות`,
      skiPass ? "🎿 מעוניין/ת גם בסקי פס" : "", transfer ? "🚐 כולל הסעה" : "",
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
          <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">חבילה משולבת · 2 דירות צמודות</span>
          <h1 className="font-display text-3xl font-black text-gray-900">{comboName}</h1>
          <p className="text-gray-500 mt-1 flex items-center justify-center gap-1.5">
            <IconMountain size={14} className="text-blue-400" /> Val Thorens, France · מתאים עד {capacity(a) + capacity(b)} אורחים
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-6 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AptBlock a={a} />
            <AptBlock a={b} />
          </div>

          {/* Booking panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm lg:sticky lg:top-24 overflow-hidden">
            <div className="bg-blue-50/60 px-6 py-5 border-b border-gray-100">
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-xs text-gray-400">/ לילה ממוצע</span>
                <span className="font-display text-3xl font-black text-gray-900">€{avgNightly.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">{fmt(checkin)} — {fmt(checkout)} · {nights} לילות · {guests} אורחים</p>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">תוספות</div>
                <div className="flex flex-col gap-2">
                  <AddonCard icon={<IconSkis size={18} />} label="סקי פס · Trois Vallées" sublabel="600 ק״מ מסלולים · כל הרמות" price="מחיר בקרוב" checked={skiPass} onChange={setSkiPass} />
                  <AddonCard icon={<IconBus size={18} />} label="הסעה הלוך-חזור" sublabel="שאטל ישיר משדה התעופה" price={`+€${TRANSFER_PRICE}`} checked={transfer} onChange={setTransfer} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <Row label={a.name} value={`€${totalA.toLocaleString()}`} muted />
                <Row label={b.name} value={`€${totalB.toLocaleString()}`} muted />
                {transfer && <Row label="הסעה הלוך-חזור" value={`€${trTotal}`} muted />}
                {skiPass && <Row label="סקי פס" value="מחיר בקרוב" muted />}
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

export default function ComboPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50" />}><ComboInner /></Suspense>;
}
