"use client";
import { useEffect, useState } from "react";
import type { SeasonRental } from "@/types";
import {
  IconMountain, IconBed, IconUsers, IconTicket, IconCheck, IconCalendar,
} from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";

const SEASON_PASS_PRICE = 1070;

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string | null) => {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;
};

const INFO = [
  { icon: <IconTicket size={22} />, title: "סקי פס עונתי", value: "€1,070", sub: "גישה לכל העונה · Trois Vallées · 600 ק״מ מסלולים" },
  { icon: <IconCheck size={22} />, title: "עבודה בעונה", value: "דרכון אירופאי", sub: "עם דרכון אירופאי אפשר לעבוד באתר ולממן את החופשה" },
  { icon: <IconUsers size={22} />, title: "לכל הגילאים", value: "18 – 60+", sub: "סזונרים צעירים, זוגות וגם מבוגרים — כולם מוצאים את מקומם" },
  { icon: <IconMountain size={22} />, title: "עונה שלמה", value: "נוב׳ – מאי", sub: "לגור על ההר, לגלוש כל יום, ולחיות את חיי הכפר האלפיני" },
];

function RentalCard({ r }: { r: SeasonRental }) {
  const img = r.images?.[0] ?? "/apt1.jpg";
  return (
    <a href={`/seasonaires/${r.id}`}
      className="group bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all overflow-hidden flex flex-col">
      <div className="relative h-52 overflow-hidden">
        <img src={img} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          {r.min_months}+ חודשים
        </div>
        <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between text-white">
          <span className="text-sm font-semibold drop-shadow">{r.area}</span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1 text-right" dir="rtl">
        <h3 className="font-display font-black text-slate-900 text-lg mb-1">{r.name}</h3>
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1"><IconBed size={13} /> {r.beds} חד׳</span>
          <span>·</span>
          <span className="flex items-center gap-1"><IconUsers size={13} /> עד {r.sleeps}</span>
          {r.available_from && (<><span>·</span><span className="flex items-center gap-1"><IconCalendar size={12} /> מ-{fmtDate(r.available_from)}</span></>)}
        </div>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {r.amenities?.slice(0, 3).map((a, i) => (
            <span key={i} className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full">{a}</span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="font-display text-2xl font-black text-slate-900">€{r.price_per_month.toLocaleString()}</span>
            <span className="text-sm text-slate-400"> / חודש</span>
          </div>
          <span className="text-sm font-bold text-blue-600 group-hover:underline">פרטים ←</span>
        </div>
      </div>
    </a>
  );
}

export default function SeasonairesPage() {
  const [rentals, setRentals] = useState<SeasonRental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/season-rentals")
      .then(r => r.json())
      .then(d => { setRentals(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const waHref = buildWaHref({
    intro: "היי! 👋 אני מתעניין/ת בעונת סקי שלמה (סזונר) ב-Val Thorens.",
    lines: ["אשמח לקבל פרטים על דירות לטווח ארוך, סקי פס עונתי ואפשרויות עבודה."],
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb]" dir="rtl">

      {/* Hero */}
      <section className="relative h-[440px] bg-slate-900 overflow-hidden">
        <img src="/apt3.jpg" alt="Season" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/40 to-slate-900/50" />
        <div className="relative max-w-5xl mx-auto px-6 h-full flex flex-col justify-end pb-12 text-white">
          <a href="/" className="absolute top-6 right-6 flex items-center gap-2 font-display font-black text-white text-lg">
            SkiShare
            <svg width="34" height="24" viewBox="0 0 48 32" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 28 L15 11 L21 19" /><path d="M17 23 L29 6 L45 28" />
            </svg>
          </a>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold tracking-widest uppercase mb-4 w-fit">
            ❄️ אזור הסזונרים
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-black leading-none max-w-2xl">לעשות עונה שלמה על ההרים</h1>
          <p className="text-white/80 text-lg mt-4 max-w-2xl">
            לגור בלב Val Thorens, לגלוש כל בוקר, לעבוד באתר ולחיות את החוויה הכי מיוחדת שיש — עונת סקי מלאה. דירות לטווח ארוך, סקי פס עונתי, והכל מסודר.
          </p>
        </div>
      </section>

      {/* Info strip */}
      <section className="max-w-5xl mx-auto px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INFO.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <span className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">{c.icon}</span>
              <p className="text-xs text-slate-400 font-medium">{c.title}</p>
              <p className="font-display text-xl font-black text-slate-900 mt-0.5">{c.value}</p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{c.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why a season */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 md:p-12 text-white">
          <h2 className="font-display text-3xl font-black mb-4">למה עונה שלמה?</h2>
          <p className="text-white/85 leading-relaxed max-w-3xl">
            עונת סקי היא לא חופשה — זו תקופת חיים. אתה קם בבוקר אל מול ההרים המושלגים, גולש על 600 ק״מ מסלולים בעולם, ואחר הצהריים חי את חיי הכפר האלפיני עם קהילת סזונרים מכל העולם. עם דרכון אירופאי אפשר אפילו לעבוד באתר ולממן את החופשה. זה מתאים לכל גיל — צעירים שרוצים שנת גאפ, זוגות, ואפילו מבוגרים שמחפשים חוויה אחרת. אנחנו מסדרים לך את הדירה לטווח ארוך, את הסקי פס העונתי (€1,070), ואת כל מה שצריך כדי פשוט להגיע ולגלוש.
          </p>
        </div>
      </section>

      {/* Rentals */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-3xl font-black text-slate-900">דירות לטווח ארוך</h2>
            <p className="text-slate-500 mt-1">חודשיים ומעלה · מחיר חודשי · מתעדכן כל הזמן</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-80 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500">אין כרגע דירות זמינות — דבר איתנו ונמצא לך משהו.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentals.map(r => <RentalCard key={r.id} r={r} />)}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -left-16 -top-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl" />
          <h2 className="relative font-display text-3xl font-black mb-3">חושב/ת על עונה?</h2>
          <p className="relative text-white/70 mb-6 max-w-xl mx-auto">ספר/י לנו מה אתה מחפש — תקופה, תקציב, וכמה אתם — ואנחנו נתפור לך את העונה המושלמת.</p>
          <a href={waHref} target="_blank" rel="noopener noreferrer"
            className="relative inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold px-8 py-4 rounded-xl transition">
            דברו איתנו בוואטסאפ
          </a>
        </div>
      </section>
    </div>
  );
}
