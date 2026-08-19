import Navbar from "@/components/Navbar";
import SearchWidget from "@/components/SearchWidget";
import FlightSearch from "@/components/FlightSearch";
import Footer from "@/components/Footer";
import Snow from "@/components/Snow";
import { createServerClient } from "@/lib/supabase-server";
import type { Apartment } from "@/types";

/* ── Step icons (thin gold line style) ───────────────────────── */
const IcoBed = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/>
    <path d="M2 14h20"/>
    <path d="M7 14v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
    <path d="M2 20h20"/>
    <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/>
  </svg>
);

const IcoTicket = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
    <line x1="9" y1="9" x2="9" y2="15" strokeDasharray="2 2"/>
    <line x1="15" y1="9" x2="15" y2="15" strokeDasharray="2 2"/>
  </svg>
);

const IcoVan = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h11l4 4v4a2 2 0 0 1-2 2h-1"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="15" cy="17" r="2"/>
    <path d="M9 11V7"/>
    <path d="M14 11V8l3 3"/>
  </svg>
);

const IcoPlane = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>
  </svg>
);

/* ── Data ─────────────────────────────────────────────────── */

const steps = [
  {
    iconEl: <IcoBed />,
    label: "01",
    title: "בחר דירה",
    desc: "דירות מנוהלות ב-Val Thorens לכל גודל קבוצה ותקציב.",
    cta: "המשך לבחירה",
    href: "/apartments",
  },
  {
    iconEl: <IcoTicket />,
    label: "02",
    title: "הוסף סקי פס",
    desc: "Trois Vallées — 600 ק״מ מסלולים, הרשת הגדולה בעולם.",
    cta: "הוסף לחבילה",
    href: "/apartments",
  },
  {
    iconEl: <IcoVan />,
    label: "03",
    title: "הוסף הסעה",
    desc: "שאטל ישיר משדה התעופה לאתר הסקי.",
    cta: "בחר הסעה",
    href: "/transfers",
  },
  {
    iconEl: <IcoPlane />,
    label: "04",
    title: "הוסף טיסה",
    desc: "חיפוש טיסות דרך Skyscanner, ובעתיד — טיסות פרטיות שלנו.",
    cta: "חפש טיסה",
    href: "/search",
  },
];

/* ── Tag helper ───────────────────────────────────────────── */
function aptTag(apts: Apartment[], apt: Apartment): string {
  const prices = apts.map(a => Number(a.price_per_night));
  const p = Number(apt.price_per_night);
  if (p === Math.max(...prices)) return "יוקרה";
  if (p === Math.min(...prices)) return "הכי משתלם";
  return "מומלץ ביותר";
}

/* ── Page ─────────────────────────────────────────────────── */

export default async function Home() {
  const db = createServerClient();
  const { data: featuredApts } = await db
    .from("apartments")
    .select("*")
    .eq("available", true)
    .order("price_per_night", { ascending: false })
    .limit(3);
  const apartments: Apartment[] = featuredApts ?? [];
  return (
    <div className="min-h-screen" style={{ background: "var(--ivory)" }} dir="rtl">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden" style={{ height: "100vh", minHeight: 680 }}>
        <img
          src="/hero-ski.jpg"
          alt="Val Thorens"
          className="absolute inset-0 w-full h-full object-cover object-center animate-kenburns"
          style={{ zIndex: 0 }}
        />
        <div className="absolute inset-0" style={{
          zIndex: 1,
          background: "linear-gradient(to bottom, rgba(11,15,20,0.72) 0%, rgba(11,15,20,0.28) 38%, rgba(11,15,20,0.32) 62%, rgba(11,15,20,0.88) 100%)"
        }} />
        <Snow />
        <div className="relative z-10 flex flex-col items-center gap-8 px-4 text-center w-full max-w-4xl mx-auto">
          <span className="eyebrow eyebrow-light animate-fade-up">Val Thorens · Trois Vallées, France</span>
          <h1 className="font-display text-6xl md:text-8xl font-medium leading-[1.05] animate-fade-up-delay-1" style={{ color: "var(--ivory)", textShadow: "0 4px 40px rgba(0,0,0,0.35)" }}>
            חופשת הסקי<br className="hidden md:block" /> שתמיד רצית
          </h1>
          <p className="text-lg md:text-xl font-light animate-fade-up-delay-2" style={{ color: "rgba(250,247,241,0.82)" }}>
            דירות נבחרות, סקי פס, הסעות וטיסות — הכל במקום אחד, בסטנדרט של קונסיירז׳ אלפיני
          </p>
          <div className="w-full animate-fade-up-delay-3">
            <SearchWidget />
          </div>
          <a href="/seasonaires" className="btn-ghost animate-fade-up-delay-3 px-6 py-3 text-sm" style={{ color: "var(--gold-light)", borderColor: "var(--gold-line)" }}>
            ❄ אזור הסיזיונרים ←
          </a>
        </div>
      </section>

      {/* ── STEPS ────────────────────────────────────────── */}
      <section className="py-20 md:py-32 px-5 md:px-6" style={{ background: "var(--paper)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 md:mb-20" dir="rtl">
            <span className="eyebrow">איך זה עובד</span>
            <h2 className="font-display text-3xl md:text-5xl font-medium mt-3" style={{ color: "var(--charcoal)" }}>בונים חבילה ב-4 שלבים</h2>
            <div className="hr-hairline w-24 mx-auto mt-6" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: "rgba(28,27,23,0.08)" }} dir="rtl">
            {steps.map((step, i) => (
              <a
                key={i}
                href={step.href}
                className="group flex flex-col gap-4 md:gap-7 p-5 md:p-9 transition-all duration-500 text-right"
                style={{ background: "var(--paper)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 md:w-14 md:h-14 flex items-center justify-center rounded-full border transition-colors duration-500 group-hover:border-[var(--gold)]"
                    style={{ borderColor: "var(--gold-line)", color: "var(--gold-deep)" }}>
                    {step.iconEl}
                  </div>
                  <span className="font-display text-2xl md:text-3xl" style={{ color: "rgba(28,27,23,0.14)" }}>{step.label}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg md:text-2xl font-medium leading-tight mb-1 md:mb-3" style={{ color: "var(--charcoal)" }}>{step.title}</h3>
                  <p className="hidden md:block text-sm leading-relaxed" style={{ color: "var(--stone)" }}>{step.desc}</p>
                </div>
                <span className="hidden md:flex items-center gap-2 text-sm font-semibold group-hover:gap-4 transition-all duration-500" style={{ color: "var(--gold-deep)" }}>
                  {step.cta} ←
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEASONAIRES ──────────────────────────────────── */}
      <section className="relative py-28 px-6 overflow-hidden">
        <img src="/view.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(11,15,20,0.94) 0%, rgba(11,15,20,0.78) 55%, rgba(11,15,20,0.55) 100%)" }} />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="max-w-2xl text-right">
            <span className="eyebrow eyebrow-light mb-5 block">❄ אזור הסיזיונרים</span>
            <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-6" style={{ color: "var(--ivory)" }}>
              עושים עונה שלמה על ההרים?
            </h2>
            <p className="text-base md:text-lg leading-relaxed mb-5 font-light" style={{ color: "rgba(250,247,241,0.75)" }}>
              הצטרפו לקהילת הסיזיונרים של SkiShare — אנשים שבאים לחיות עונת סקי מלאה ב-Val Thorens.
              דירות לטווח ארוך (חודשיים+).
            </p>
            <ul className="text-sm space-y-2 mb-9" style={{ color: "rgba(250,247,241,0.65)" }}>
              <li>🏔 לוח דירות לטווח ארוך — מתעדכן כל הזמן</li>
              <li>💬 קבוצת וואטסאפ של הקהילה</li>
              <li>🎿 סקי פס עונתי · עבודה על ההר · אירועים</li>
            </ul>
            <a href="/seasonaires" className="btn-gold px-8 py-4 text-base">
              לחצו כאן לקהילת הסיזיונרים ←
            </a>
          </div>
        </div>
      </section>

      {/* ── FLIGHTS ──────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "var(--ivory-deep)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="eyebrow">חיפוש טיסות</span>
            <h2 className="font-display text-3xl md:text-4xl font-medium mt-3 mb-2" style={{ color: "var(--charcoal)" }}>מצא טיסה ל-Val Thorens</h2>
            <p className="text-sm" style={{ color: "var(--stone)" }}>אנחנו מחפשים עבורך ב-Skyscanner</p>
          </div>
          <FlightSearch destination="Val Thorens" guests={2} />
        </div>
      </section>

      {/* ── APARTMENTS ───────────────────────────────────── */}
      <section className="py-24 md:py-28 px-6" style={{ background: "var(--paper)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-14">
            <div>
              <span className="eyebrow">לינה ב-Val Thorens</span>
              <h2 className="font-display text-3xl md:text-4xl font-medium mt-3" style={{ color: "var(--charcoal)" }}>דירות נבחרות</h2>
            </div>
            <a href="/apartments" className="text-sm font-semibold pb-0.5 transition-opacity hover:opacity-60 hidden md:block"
              style={{ color: "var(--gold-deep)", borderBottom: "1px solid var(--gold-line)" }}>
              כל הדירות ←
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {apartments.map((apt) => {
              const tag = aptTag(apartments, apt);
              return (
                <a key={apt.id} href={`/apartments/${apt.id}`}
                  className="card-luxury overflow-hidden group block">
                  <div className="relative h-56 overflow-hidden">
                    <img src={apt.images?.[0] ?? "/hero-ski.jpg"} alt={apt.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,15,20,0.45) 0%, transparent 55%)" }} />
                    <div className="absolute top-4 right-4 text-[11px] font-bold px-3 py-1 tracking-wide"
                      style={{ background: "rgba(11,15,20,0.7)", color: "var(--gold-light)", backdropFilter: "blur(6px)" }}>
                      {tag}
                    </div>
                    <div className="absolute bottom-4 left-4 text-sm font-bold px-3 py-1.5"
                      style={{ background: "rgba(11,15,20,0.7)", color: "var(--ivory)", backdropFilter: "blur(6px)" }}>
                      <span style={{ color: "var(--gold-light)" }}>€{Number(apt.price_per_night).toLocaleString()}</span> / לילה
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-display font-medium text-xl" style={{ color: "var(--charcoal)" }}>{apt.name}</h3>
                        <p className="text-sm mt-0.5" style={{ color: "var(--stone-soft)" }}>{apt.type}</p>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold" style={{ color: "var(--gold-deep)" }}>★ 4.9</div>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs py-3 mb-4" style={{ color: "var(--stone-soft)", borderTop: "1px solid rgba(28,27,23,0.08)" }}>
                      <span>{apt.beds} חדרים</span>
                      <span>·</span>
                      <span>{apt.baths} אמבטיות</span>
                      <span>·</span>
                      <span>{apt.sqm} מ״ר</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mb-5">
                      {apt.amenities?.slice(0, 4).map((a, j) => (
                        <span key={j} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--ivory-deep)", color: "var(--stone)" }}>{a}</span>
                      ))}
                    </div>
                    <div className="btn-dark w-full py-3 text-sm">
                      ← הזמן עכשיו
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative py-32 px-6 overflow-hidden">
        <img src="/hero-ski.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "rgba(11,15,20,0.82)" }} />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <span className="eyebrow eyebrow-light block mb-5">Val Thorens · Trois Vallées</span>
          <h2 className="font-display text-4xl md:text-5xl font-medium mb-5 leading-tight" style={{ color: "var(--ivory)" }}>מוכן לרוץ על השלג?</h2>
          <p className="text-base mb-11 font-light" style={{ color: "rgba(250,247,241,0.65)" }}>הזמן עכשיו לעונת 2025/26 — מחירי early bird זמינים לשבועות הקרובים בלבד</p>
          <a
            href="/apartments"
            className="btn-gold inline-flex px-10 py-4 text-base"
          >
            התחל לבנות את החבילה שלי ←
          </a>
          <p className="text-xs mt-8 tracking-wider uppercase" style={{ color: "rgba(250,247,241,0.4)" }}>ביטול חינם עד 30 יום לפני הגעה</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
