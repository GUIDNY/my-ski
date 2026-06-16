"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { SeasonRental } from "@/types";
import {
  IconMountain, IconBed, IconUsers, IconCalendar, IconCheck, IconChevronLeft, IconWhatsApp,
} from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s + "T12:00:00");
  return `${d.getDate()} ${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export default function SeasonRentalDetail() {
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<SeasonRental | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch(`/api/season-rentals/${id}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(setR)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!r) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f9fb] text-center px-6" dir="rtl">
      <p className="text-5xl mb-4">🏔️</p>
      <h1 className="font-display text-2xl font-black text-slate-900 mb-2">הדירה לא נמצאה</h1>
      <a href="/seasonaires" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition">חזרה לאזור הסזונרים</a>
    </div>
  );

  const imgs = r.images?.length ? r.images : ["/apt1.jpg", "/apt2.jpg", "/apt3.jpg"];

  const waHref = buildWaHref({
    intro: "היי! 👋 אני מעוניין/ת בדירה לעונה הבאה:",
    lines: [
      `🏔️ ${r.name} · ${r.area}`,
      `🛏️ ${r.beds} חדרים · עד ${r.sleeps} אנשים`,
      `📅 זמינה: ${fmtDate(r.available_from)} — ${fmtDate(r.available_to)}`,
      `⏳ מינימום ${r.min_months} חודשים`,
      `💶 €${r.price_per_month.toLocaleString()} / חודש`,
    ],
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-28 lg:pb-0" dir="rtl">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/seasonaires" className="text-slate-500 hover:text-slate-900 text-sm transition">→ אזור הסזונרים</a>
          <a href="/" className="flex items-center gap-2 font-display font-black text-slate-900">SkiShare
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><IconMountain size={16} className="text-white" /></span>
          </a>
        </div>
      </header>

      {/* Gallery */}
      <section className="relative w-full h-80 md:h-[460px] bg-slate-900 overflow-hidden">
        {imgs.map((src, i) => (
          <img key={i} src={src} alt={r.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0"}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
        {imgs.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + imgs.length) % imgs.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition">
              <IconChevronLeft size={18} className="rotate-180" />
            </button>
            <button onClick={() => setIdx(i => (i + 1) % imgs.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition">
              <IconChevronLeft size={18} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {imgs.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === idx ? "bg-white w-8" : "bg-white/50 w-2"}`} />
              ))}
            </div>
          </>
        )}
        <div className="absolute bottom-6 right-6 text-white">
          <p className="flex items-center gap-1.5 text-sm opacity-90 mb-1"><IconMountain size={14} /> {r.area}</p>
          <h1 className="font-display text-4xl md:text-5xl font-black">{r.name}</h1>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">

        {/* Main */}
        <main className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat icon={<IconBed size={18} />} label="חדרים" value={`${r.beds}`} />
              <Stat icon={<IconUsers size={18} />} label="עד" value={`${r.sleeps} אנשים`} />
              <Stat icon={<IconCalendar size={18} />} label="מינימום" value={`${r.min_months} חודשים`} />
              <Stat icon={<IconCheck size={18} />} label="זמינה מ-" value={fmtDate(r.available_from).replace(/ \d{4}$/, "")} />
            </div>
          </div>

          {r.description && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-3">על הדירה</h2>
              <p className="text-slate-600 leading-relaxed">{r.description}</p>
            </div>
          )}

          {r.amenities?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-4">מה כלול</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {r.amenities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-slate-700 p-3 bg-slate-50 rounded-xl">
                    <IconCheck size={15} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-2">תקופת זמינות</h2>
            <p className="text-slate-600">{fmtDate(r.available_from)} — {fmtDate(r.available_to)}</p>
            <p className="text-sm text-slate-400 mt-1">סקי פס עונתי זמין בנפרד · €1,070 לכל העונה</p>
          </div>
        </main>

        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block sticky top-24">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-sm text-slate-400">מחיר חודשי</p>
            <p className="font-display text-4xl font-black text-slate-900 mt-1">€{r.price_per_month.toLocaleString()}<span className="text-base font-medium text-slate-400"> / חודש</span></p>
            <p className="text-xs text-slate-400 mt-1">מינימום {r.min_months} חודשים</p>
            <a href={waHref} target="_blank" rel="noopener noreferrer"
              className="mt-5 flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold py-3.5 rounded-xl transition">
              <IconWhatsApp size={20} /> צור קשר להזמנה
            </a>
            <p className="text-center text-xs text-slate-400 mt-3">נציג ישראלי יחזור אליך בוואטסאפ</p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-100 px-4 py-3 flex items-center gap-3">
        <div className="flex-shrink-0">
          <p className="text-[11px] text-slate-400 leading-none mb-0.5">לחודש</p>
          <p className="font-display font-black text-slate-900 text-lg leading-none">€{r.price_per_month.toLocaleString()}</p>
        </div>
        <a href={waHref} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold py-3.5 rounded-xl transition">
          <IconWhatsApp size={18} /> צור קשר להזמנה
        </a>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-right">
      <span className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-2">{icon}</span>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-display font-bold text-slate-900 text-sm mt-0.5">{value}</p>
    </div>
  );
}
