"use client";
import { useEffect, useState } from "react";
import type { SeasonRental } from "@/types";
import {
  IconBed, IconUsers, IconCalendar, IconWhatsApp, IconParty, IconBriefcase,
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
      className="card-luxury group overflow-hidden flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <img src={img} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,15,20,0.5) 0%, transparent 55%)" }} />
        <div className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1" style={{ background: "rgba(11,15,20,0.7)", color: "var(--gold-light)", backdropFilter: "blur(6px)" }}>{r.min_months}+ חודשים</div>
        <span className="absolute bottom-3 right-3 text-sm font-semibold" style={{ color: "var(--ivory)" }}>{r.area}</span>
      </div>
      <div className="p-5 flex flex-col flex-1 text-right" dir="rtl">
        <h3 className="font-display font-medium text-lg mb-1" style={{ color: "var(--charcoal)" }}>{r.name}</h3>
        <div className="flex items-center gap-3 text-xs mb-3" style={{ color: "var(--stone-soft)" }}>
          <span className="flex items-center gap-1"><IconBed size={13} /> {r.beds} חד׳</span>
          <span>·</span>
          <span className="flex items-center gap-1"><IconUsers size={13} /> עד {r.sleeps}</span>
          {r.available_from && (<><span>·</span><span className="flex items-center gap-1"><IconCalendar size={12} /> מ-{fmtDate(r.available_from)}</span></>)}
        </div>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {r.amenities?.slice(0, 3).map((a, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--stone)", background: "var(--ivory-deep)" }}>{a}</span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="font-display text-2xl font-medium" style={{ color: "var(--gold-deep)" }}>€{r.price_per_month.toLocaleString()}</span>
            <span className="text-sm" style={{ color: "var(--stone-soft)" }}> / חודש</span>
          </div>
          <span className="text-sm font-bold group-hover:underline" style={{ color: "var(--gold-deep)" }}>פרטים ←</span>
        </div>
      </div>
    </a>
  );
}

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <span className="eyebrow">{kicker}</span>
      <h2 className="font-display text-3xl font-medium mt-2" style={{ color: "var(--charcoal)" }}>{title}</h2>
      {sub && <p className="mt-1" style={{ color: "var(--stone)" }}>{sub}</p>}
    </div>
  );
}

function ComingSoon({ icon, title, desc }: { icon: React.ReactNode; tint?: string; title: string; desc: string }) {
  return (
    <div className="relative p-8 text-center overflow-hidden" style={{ background: "var(--paper)", border: "1px dashed rgba(28,27,23,0.16)" }}>
      <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full" style={{ color: "var(--gold-deep)", background: "var(--gold-wash)" }}>בקרוב · Coming soon</span>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 border" style={{ borderColor: "var(--gold-line)", color: "var(--gold-deep)" }}>{icon}</div>
      <h3 className="font-display text-xl font-medium mb-2" style={{ color: "var(--charcoal)" }}>{title}</h3>
      <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "var(--stone)" }}>{desc}</p>
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
    intro: "היי! 👋 אני מתעניין/ת בעונת סקי שלמה (סיזיונר) ב-Val Thorens.",
    lines: ["אשמח לקבל פרטים על דירות לטווח ארוך, סקי פס עונתי ואפשרויות עבודה."],
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--ivory)" }} dir="rtl">

      {/* Hero */}
      <section className="relative h-[440px] overflow-hidden">
        <img src="/view.jpg" alt="Val Thorens" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,15,20,0.94) 0%, rgba(11,15,20,0.5) 55%, rgba(11,15,20,0.6) 100%)" }} />
        <div className="relative max-w-5xl mx-auto px-6 h-full flex flex-col justify-end pb-12" style={{ color: "var(--ivory)" }}>
          <a href="/" className="absolute top-6 right-6">
            <img src="/skishare-logo.png" alt="SkiShare" className="h-10 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
          </a>
          <span className="eyebrow eyebrow-light mb-4">❄ קהילת הסיזיונרים</span>
          <h1 className="font-display text-5xl md:text-6xl font-medium leading-none">אזור הסיזיונרים</h1>
          <p className="text-lg mt-4 max-w-2xl font-light" style={{ color: "rgba(250,247,241,0.8)" }}>
            הבית של מי שעושה עונה שלמה ב-Val Thorens — קהילה, לוח דירות לטווח ארוך, אירועים, עבודות ומידע. הכל במקום אחד.
          </p>
        </div>
      </section>

      {/* WhatsApp community banner */}
      <section className="max-w-5xl mx-auto px-6 -mt-10 relative z-10">
        <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer"
          className="group flex items-center gap-4 bg-[#25D366] rounded p-5 md:p-6 shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 transition-transform text-white">
          <span className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0"><IconWhatsApp size={28} /></span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-medium text-lg md:text-xl leading-tight">הצטרפו לקבוצת הוואטסאפ של הסיזיונרים</p>
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
            {[1,2,3].map(i => <div key={i} className="h-80 animate-pulse" style={{ background: "var(--paper)", border: "1px solid rgba(28,27,23,0.08)" }} />)}
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-16" style={{ background: "var(--paper)", border: "1px solid rgba(28,27,23,0.08)" }}>
            <p style={{ color: "var(--stone)" }}>אין כרגע דירות זמינות — דברו איתנו ונמצא לכם משהו.</p>
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
        <ComingSoon icon={<IconParty size={28} />}
          title="אירועי קהילה בדרך"
          desc="מפגשי סיזיונרים, ערבי אפטר-סקי, טריפים וחוויות משותפות. הצטרפו לקבוצת הוואטסאפ כדי להיות הראשונים לדעת." />
      </section>

      {/* Jobs — coming soon */}
      <section id="jobs" className="max-w-5xl mx-auto px-6 pt-14 pb-16 scroll-mt-6">
        <SectionHead kicker="עבודה על ההר" title="חיפוש עבודות" />
        <ComingSoon icon={<IconBriefcase size={28} />}
          title="לוח דרושים לסיזיונרים בדרך"
          desc="משרות באתר הסקי — מסעדות, בארים, חנויות ציוד, בתי מלון ועוד. עם דרכון אירופאי אפשר לעבוד ולממן את העונה. הלוח ייפתח בקרוב." />
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center relative overflow-hidden p-8 md:p-14" style={{ background: "var(--ink)", color: "var(--ivory)" }}>
          <div className="absolute -left-16 -top-16 w-56 h-56 rounded-full blur-3xl" style={{ background: "var(--gold-wash)" }} />
          <span className="eyebrow eyebrow-light relative block mb-4">הקהילה</span>
          <h2 className="relative font-display text-3xl font-medium mb-3">רוצים להיות חלק מהקהילה?</h2>
          <p className="relative mb-8 max-w-xl mx-auto font-light" style={{ color: "rgba(250,247,241,0.7)" }}>הצטרפו לקבוצת הוואטסאפ של הסיזיונרים, או דברו איתנו ישירות על דירה, סקי פס ועבודה.</p>
          <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-medium px-8 py-4 rounded transition">
              <IconWhatsApp size={20} /> הצטרפו לקבוצה
            </a>
            <a href={waContact} target="_blank" rel="noopener noreferrer"
              className="btn-ghost font-display px-8 py-4" style={{ color: "var(--gold-light)", borderColor: "var(--gold-line)" }}>
              דברו איתנו
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
