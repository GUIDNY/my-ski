"use client";
import { useEffect, useState } from "react";
import type { SeasonRental } from "@/types";
import {
  IconBed, IconUsers, IconCalendar, IconWhatsApp, IconSnowflake, IconParty, IconBriefcase,
} from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";

// Community WhatsApp group invite
const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/HBxs0bCitS4FYxSSKlSlsF?mode=ac_t";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string | null) => {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;
};

function RentalCard({ r }: { r: SeasonRental }) {
  const img = r.images?.[0] ?? "/apt1.jpg";
  return (
    <a href={`/seasonaires/${r.id}`}
      className="group bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all overflow-hidden flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <img src={img} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">{r.min_months}+ חודשים</div>
        <span className="absolute bottom-3 right-3 text-white text-sm font-semibold drop-shadow">{r.area}</span>
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

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <span className="text-xs font-bold tracking-widest uppercase text-blue-600">{kicker}</span>
      <h2 className="font-display text-3xl font-black text-slate-900 mt-1">{title}</h2>
      {sub && <p className="text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function ComingSoon({ icon, tint, title, desc }: { icon: React.ReactNode; tint: string; title: string; desc: string }) {
  return (
    <div className="relative bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center overflow-hidden">
      <span className="absolute top-4 left-4 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">בקרוב · Coming soon</span>
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${tint} mb-4`}>{icon}</div>
      <h3 className="font-display text-xl font-black text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">{desc}</p>
    </div>
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

  const waContact = buildWaHref({
    intro: "היי! 👋 אני מתעניין/ת בעונת סקי שלמה (סזונר) ב-Val Thorens.",
    lines: ["אשמח לקבל פרטים על דירות לטווח ארוך, סקי פס עונתי ואפשרויות עבודה."],
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb]" dir="rtl">

      {/* Hero */}
      <section className="relative h-[420px] bg-slate-900 overflow-hidden">
        <img src="/view.jpg" alt="Val Thorens" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-900/45 to-slate-900/55" />
        <div className="relative max-w-5xl mx-auto px-6 h-full flex flex-col justify-end pb-12 text-white">
          <a href="/" className="absolute top-6 right-6">
            <img src="/skishare-logo.png" alt="SkiShare" className="h-12 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
          </a>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold tracking-widest uppercase mb-4 w-fit">
            <IconSnowflake size={13} /> קהילת הסזונרים
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-black leading-none">אזור הסזונרים</h1>
          <p className="text-white/80 text-lg mt-4 max-w-2xl">
            הבית של מי שעושה עונה שלמה ב-Val Thorens — קהילה, לוח דירות לטווח ארוך, אירועים, עבודות ומידע. הכל במקום אחד.
          </p>
        </div>
      </section>

      {/* WhatsApp community banner */}
      <section className="max-w-5xl mx-auto px-6 -mt-10 relative z-10">
        <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer"
          className="group flex items-center gap-4 bg-[#25D366] rounded-2xl p-5 md:p-6 shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 transition-transform text-white">
          <span className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0"><IconWhatsApp size={28} /></span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-black text-lg md:text-xl leading-tight">הצטרפו לקבוצת הוואטסאפ של הסזונרים</p>
            <p className="text-white/85 text-sm mt-0.5">דירות, טיפים, אירועים ועבודות — כל הקהילה במקום אחד</p>
          </div>
          <span className="font-bold flex-shrink-0 group-hover:-translate-x-1 transition-transform">הצטרפו ←</span>
        </a>
      </section>

      {/* Long-term apartments board */}
      <section id="board" className="max-w-5xl mx-auto px-6 pt-14 scroll-mt-6">
        <SectionHead kicker="לוח דירות" title="דירות לטווח ארוך" sub="חודשיים ומעלה · מחיר חודשי · מתעדכן כל הזמן" />
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-80 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500">אין כרגע דירות זמינות — דברו איתנו ונמצא לכם משהו.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentals.map(r => <RentalCard key={r.id} r={r} />)}
          </div>
        )}
      </section>

      {/* Events — coming soon */}
      <section id="events" className="max-w-5xl mx-auto px-6 pt-14 scroll-mt-6">
        <SectionHead kicker="קהילה" title="אירועים קרובים" />
        <ComingSoon icon={<IconParty size={28} className="text-violet-600" />} tint="bg-violet-50"
          title="אירועי קהילה בדרך"
          desc="מפגשי סזונרים, ערבי אפטר-סקי, טריפים וחוויות משותפות. הצטרפו לקבוצת הוואטסאפ כדי להיות הראשונים לדעת." />
      </section>

      {/* Jobs — coming soon */}
      <section id="jobs" className="max-w-5xl mx-auto px-6 pt-14 pb-16 scroll-mt-6">
        <SectionHead kicker="עבודה על ההר" title="חיפוש עבודות" />
        <ComingSoon icon={<IconBriefcase size={28} className="text-amber-600" />} tint="bg-amber-50"
          title="לוח דרושים לסזונרים בדרך"
          desc="משרות באתר הסקי — מסעדות, בארים, חנויות ציוד, בתי מלון ועוד. עם דרכון אירופאי אפשר לעבוד ולממן את העונה. הלוח ייפתח בקרוב." />
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute -left-16 -top-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl" />
          <h2 className="relative font-display text-3xl font-black mb-3">רוצים להיות חלק מהקהילה?</h2>
          <p className="relative text-white/70 mb-6 max-w-xl mx-auto">הצטרפו לקבוצת הוואטסאפ של הסזונרים, או דברו איתנו ישירות על דירה, סקי פס ועבודה.</p>
          <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold px-8 py-4 rounded-xl transition">
              <IconWhatsApp size={20} /> הצטרפו לקבוצה
            </a>
            <a href={waContact} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-display font-bold px-8 py-4 rounded-xl transition">
              דברו איתנו
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
