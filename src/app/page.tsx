import Navbar from "@/components/Navbar";
import SearchWidget from "@/components/SearchWidget";
import FlightSearch from "@/components/FlightSearch";
import Footer from "@/components/Footer";
import { IconMountain } from "@/components/Icons";
import { createServerClient } from "@/lib/supabase-server";
import type { Apartment } from "@/types";

/* ── Step icons ───────────────────────────────────────────── */
const IcoBed = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/>
    <path d="M2 14h20"/>
    <path d="M7 14v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
    <path d="M2 20h20"/>
    <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/>
  </svg>
);

const IcoTicket = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
    <line x1="9" y1="9" x2="9" y2="15" strokeDasharray="2 2"/>
    <line x1="15" y1="9" x2="15" y2="15" strokeDasharray="2 2"/>
  </svg>
);

const IcoVan = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h11l4 4v4a2 2 0 0 1-2 2h-1"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="15" cy="17" r="2"/>
    <path d="M9 11V7"/>
    <path d="M14 11V8l3 3"/>
  </svg>
);

const IcoPlane = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>
  </svg>
);

/* ── Data ─────────────────────────────────────────────────── */

const steps = [
  {
    iconEl: <IcoBed />,
    iconBg: "bg-gray-900",
    iconColor: "text-white",
    label: "שלב 01",
    title: "בחר דירה",
    desc: "דירות מנוהלות ב-Val Thorens לכל גודל קבוצה ותקציב.",
    cta: "המשך לבחירה",
    href: "/apartments",
  },
  {
    iconEl: <IcoTicket />,
    iconBg: "bg-blue-600",
    iconColor: "text-white",
    label: "שלב 02",
    title: "הוסף סקי פס",
    desc: "Trois Vallées — 600 ק״מ מסלולים, הרשת הגדולה בעולם.",
    cta: "הוסף לחבילה",
    href: "/apartments",
  },
  {
    iconEl: <IcoVan />,
    iconBg: "bg-amber-500",
    iconColor: "text-white",
    label: "שלב 03",
    title: "הוסף הסעה",
    desc: "שאטל ישיר משדה התעופה לאתר הסקי.",
    cta: "בחר הסעה",
    href: "/transfers",
  },
  {
    iconEl: <IcoPlane />,
    iconBg: "bg-indigo-600",
    iconColor: "text-white",
    label: "שלב 04",
    title: "הוסף טיסה",
    desc: "חיפוש טיסות דרך Skyscanner, ובעתיד — טיסות פרטיות שלנו.",
    cta: "חפש טיסה",
    href: "/search",
  },
];

/* apartments fetched server-side below */

/* ── Tag helper ───────────────────────────────────────────── */
function aptTag(apts: Apartment[], apt: Apartment): { label: string; color: string } {
  const prices = apts.map(a => Number(a.price_per_night));
  const p = Number(apt.price_per_night);
  if (p === Math.max(...prices)) return { label: "יוקרה",          color: "#8b5cf6" };
  if (p === Math.min(...prices)) return { label: "הכי משתלם",      color: "#10b981" };
  return                                { label: "מומלץ ביותר",    color: "#f59e0b" };
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
    <div className="min-h-screen" style={{ background: "#f7f9fb" }} dir="rtl">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center" style={{ height: "100vh", minHeight: 640 }}>
        <img
          src="/hero-ski.jpg"
          alt="Val Thorens"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 0 }}
        />
        <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1 }} aria-hidden="true">
          <div className="cloud-layer cloud-1" />
          <div className="cloud-layer cloud-2" />
          <div className="cloud-layer cloud-3" />
        </div>
        <div className="absolute inset-0" style={{
          zIndex: 2,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.55) 100%)"
        }} />
        <div className="relative z-10 flex flex-col items-center gap-7 px-4 text-center w-full max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
            Val Thorens
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-medium" style={{ textShadow: "0 1px 10px rgba(0,0,0,0.3)" }}>
            כל מה שאתה צריך נמצא כאן
          </p>
          <SearchWidget />
          <a href="/seasonaires" className="flex items-center gap-2.5 px-6 py-3 rounded-full text-white text-sm font-bold transition-all hover:bg-white/20" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
            ❄️ אזור הסיזיונרים ←
          </a>
        </div>
      </section>

      {/* ── STEPS ────────────────────────────────────────── */}
      <section className="py-12 md:py-28 px-5 md:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-7 md:mb-12" dir="rtl">
            <span className="text-xs font-bold tracking-widest uppercase text-blue-600">איך זה עובד</span>
            <h2 className="font-display text-2xl md:text-4xl font-black text-gray-900 mt-1">בונים חבילה ב-4 שלבים</h2>
            <p className="text-gray-500 text-sm mt-1">בוחרים דירה, מוסיפים מה שצריך — והכל מסודר 🎿</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6" dir="rtl">
            {steps.map((step, i) => (
              <a
                key={i}
                href={step.href}
                className="group flex flex-col gap-3 md:gap-6 p-4 md:p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-right"
              >
                <div className={`w-11 h-11 md:w-16 md:h-16 flex items-center justify-center rounded-xl md:rounded-full ${step.iconBg} ${step.iconColor} flex-shrink-0`}>
                  {step.iconEl}
                </div>
                <div className="flex-1">
                  <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1 md:mb-2">{step.label}</span>
                  <h3 className="font-display text-sm md:text-xl font-black text-gray-900 leading-tight md:mb-3">{step.title}</h3>
                  <p className="hidden md:block text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
                <span className="hidden md:flex items-center gap-2 text-gray-900 text-sm font-bold group-hover:gap-4 transition-all duration-300">
                  {step.cta} ←
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEASONAIRES ──────────────────────────────────── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <img src="/view.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(8,18,40,0.92) 0%, rgba(8,18,40,0.75) 55%, rgba(8,18,40,0.6) 100%)" }} />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="max-w-2xl text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold tracking-widest uppercase mb-5">
              ❄️ אזור הסיזיונרים
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              עושים עונה שלמה על ההרים?
            </h2>
            <p className="text-white/75 text-base md:text-lg leading-relaxed mb-4">
              הצטרפו לקהילת הסיזיונרים של SkiShare — אנשים שבאים לחיות עונת סקי מלאה ב-Val Thorens.
              דירות לטווח ארוך (חודשיים+).
            </p>
            <ul className="text-white/70 text-sm space-y-1.5 mb-8">
              <li>🏔️ לוח דירות לטווח ארוך — מתעדכן כל הזמן</li>
              <li>💬 קבוצת וואטסאפ של הקהילה</li>
              <li>🎿 סקי פס עונתי · עבודה על ההר · אירועים</li>
            </ul>
            <a href="/seasonaires"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-display font-black px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-blue-900/40">
              לחצו כאן לקהילת הסיזיונרים ←
            </a>
          </div>
        </div>
      </section>

      {/* ── FLIGHTS ──────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#f7f9fb", borderTop: "1px solid #e5e7eb" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-3">חיפוש טיסות</span>
            <h2 className="font-display text-3xl font-black text-gray-900 mb-2">מצא טיסה ל-Val Thorens</h2>
            <p className="text-gray-500 text-sm">אנחנו מחפשים עבורך ב-Skyscanner</p>
          </div>
          <FlightSearch destination="Val Thorens" guests={2} />
        </div>
      </section>

      {/* ── APARTMENTS ───────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-2">לינה ב-Val Thorens</span>
              <h2 className="font-display text-3xl md:text-4xl font-black text-gray-900">דירות נבחרות</h2>
            </div>
            <a href="/apartments" className="text-sm font-bold text-gray-900 border-b border-gray-900 pb-0.5 hover:opacity-50 transition-opacity hidden md:block">
              כל הדירות ←
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apartments.map((apt) => {
              const tag = aptTag(apartments, apt);
              return (
                <a key={apt.id} href={`/apartments/${apt.id}`}
                  className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group block">
                  <div className="relative h-52 overflow-hidden">
                    <img src={apt.images?.[0] ?? "/hero-ski.jpg"} alt={apt.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)" }} />
                    <div className="absolute top-3 right-3 text-white text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: tag.color }}>
                      {tag.label}
                    </div>
                    <div className="absolute bottom-3 left-3 text-white text-sm font-bold px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
                      €{Number(apt.price_per_night).toLocaleString()} / לילה
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-display font-black text-gray-900 text-lg">{apt.name}</h3>
                        <p className="text-gray-400 text-sm">{apt.type}</p>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-gray-900">★ 4.9</div>
                        <div className="text-xs text-gray-400">Val Thorens</div>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400 py-3 border-t border-gray-100 mb-4">
                      <span>{apt.beds} חדרים</span>
                      <span>·</span>
                      <span>{apt.baths} אמבטיות</span>
                      <span>·</span>
                      <span>{apt.sqm} מ״ר</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mb-4">
                      {apt.amenities?.slice(0, 4).map((a, j) => (
                        <span key={j} className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full border border-gray-100">{a}</span>
                      ))}
                    </div>
                    <div className="block w-full py-3 rounded-lg font-black text-sm text-white text-center transition-colors bg-gray-900 group-hover:bg-gray-700">
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
      <section className="relative py-28 px-6 overflow-hidden">
        <img src="/hero-ski.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "rgba(5,15,35,0.75)" }} />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-white/50 block mb-4">Val Thorens · Trois Vallées</span>
          <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4 leading-tight">מוכן לרוץ על השלג?</h2>
          <p className="text-white/60 text-base mb-10">הזמן עכשיו לעונת 2025/26 — מחירי early bird זמינים לשבועות הקרובים בלבד</p>
          <a
            href="/apartments"
            className="inline-block bg-white text-gray-900 font-black px-10 py-4 rounded-lg text-base hover:bg-gray-100 transition-colors"
          >
            התחל לבנות את החבילה שלי ←
          </a>
          <p className="text-white/30 text-xs mt-6 tracking-wider uppercase">ביטול חינם עד 30 יום לפני הגעה</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
