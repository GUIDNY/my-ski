import Navbar from "@/components/Navbar";
import SearchWidget from "@/components/SearchWidget";
import FlightSearch from "@/components/FlightSearch";
import Footer from "@/components/Footer";
import { IconMountain, IconSnowflake } from "@/components/Icons";
import { createServerClient } from "@/lib/supabase-server";
import type { Apartment, SkiPass } from "@/types";

// This page queries live inventory/availability (which apartment is
// cheapest right now, which La Cime weeks are still open) — it must never
// be statically pre-rendered at build time, or it'll keep serving whatever
// the DB looked like at the moment of the last deploy. Confirmed this was
// actually happening: the La Cime package cards worked in every local test
// (same live DB) but silently rendered as zero cards in production despite
// no runtime error, which points squarely at a build-time static snapshot.
export const dynamic = "force-dynamic";

const TRANSFER_PRICE = 180;  // matches the flat per-person add-on used everywhere else on the site
const FLIGHT_ESTIMATE = 350; // rough per-person flight estimate for the homepage teaser cards, set by the business
const LA_CIME_NIGHTS = 7;    // every La Cime week is a fixed Saturday-to-Saturday stay
const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => { const d = new Date(s + "T12:00:00"); return `${d.getDate()} ב${HE_MONTHS[d.getMonth()]}`; };

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
  const { data: featuredApts } = await db.from("apartments").select("*").eq("available", true).order("price_per_night", { ascending: false }).limit(3);
  const apartments: Apartment[] = featuredApts ?? [];

  // Real bundled-package pricing for the teaser cards below — apartment
  // nightly rate + an actual Trois Vallées ski pass tier + the flat
  // transfer fee, all sourced from the same data/prices used everywhere
  // else on the site (never invented numbers). A representative week and a
  // 2-guest split, since there's no real customer date/guest count yet on
  // the homepage — clicking through lets them pick their own real dates.
  const { data: passOptions } = await db.from("ski_passes").select("*")
    .eq("available", true).eq("type", "adult").eq("area", "trois_vallees")
    .order("duration_days", { ascending: true });
  const skiDays = LA_CIME_NIGHTS - 1;
  const passes = (passOptions as SkiPass[] | null) ?? [];
  const skiTier = passes.length ? (passes.find(p => p.duration_days >= skiDays) ?? passes[passes.length - 1]) : null;
  const skiPassPerPerson = skiTier ? (skiDays > skiTier.duration_days ? Math.round((skiTier.price / skiTier.duration_days) * skiDays) : skiTier.price) : 0;

  // La Cime ("שבת עד שבת") weeks are real, fixed-price inventory — no
  // estimate needed, so these packages show the actual next available week
  // and its actual price instead of a representative 7-night guess. A rough
  // flight estimate (~€350/person, set by the business, not scraped — a
  // real live lookup per homepage card would be too slow) is folded in so
  // the headline price isn't misleadingly flight-less; still framed as
  // "מ-" (starting from) since it's an estimate, not a quote.
  const { data: laCimeApts } = await db.from("apartments").select("*").eq("available", true).eq("source", "la_cime");
  const today = new Date().toISOString().slice(0, 10);
  const packages = ((laCimeApts as Apartment[] | null) ?? [])
    .map(apt => {
      const nextWeek = (apt.available_weeks ?? []).filter(w => w.week >= today).sort((a, b) => a.week.localeCompare(b.week))[0];
      return nextWeek ? { apt, week: nextWeek } : null;
    })
    .filter((x): x is { apt: Apartment; week: { week: string; price: number } } => !!x)
    .slice(0, 3)
    .map(({ apt, week }) => {
      const guests = Math.min(apt.max_guests || 4, 4) || 4;
      const checkinD = new Date(week.week + "T12:00:00");
      const checkoutD = new Date(checkinD); checkoutD.setDate(checkoutD.getDate() + 7);
      const grandTotal = week.price + skiPassPerPerson * guests + TRANSFER_PRICE * guests + FLIGHT_ESTIMATE * guests;
      return {
        apt, guests, perPerson: Math.round(grandTotal / guests),
        checkin: checkinD.toISOString().slice(0, 10), checkout: checkoutD.toISOString().slice(0, 10),
      };
    });
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
        <div className="absolute inset-0" style={{
          zIndex: 1,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.55) 100%)"
        }} />
        <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 2 }} aria-hidden="true">
          <div className="cloud-layer cloud-1" />
          <div className="cloud-layer cloud-2" />
          <div className="cloud-layer cloud-3" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-7 px-4 text-center w-full max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)", textWrap: "balance" }}>
            Val Thorens
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-medium" style={{ textShadow: "0 1px 10px rgba(0,0,0,0.3)" }}>
            דירות, סקי פס, ציוד והסעות — חופשת הסקי שלך במקום אחד
          </p>
          <SearchWidget />
          <a href="/seasonaires" className="flex items-center gap-2.5 px-6 py-3 rounded-full text-white text-sm font-bold transition-all hover:bg-white/20" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
            <IconSnowflake size={16} /> אזור הסיזיונרים ←
          </a>
        </div>
      </section>

      {/* ── Trust row ────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 py-4 px-5 md:px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs md:text-sm font-bold text-gray-500">
          <span className="flex items-center gap-1.5">💶 מחיר שקוף מראש</span>
          <span className="flex items-center gap-1.5">🇮🇱 שירות בעברית</span>
          <span className="flex items-center gap-1.5">🏠 דירות שבדקנו בעצמנו</span>
          <span className="flex items-center gap-1.5">🔒 תשלום מאובטח</span>
        </div>
      </div>

      {/* ── חבילות מומלצות ───────────────────────────────── */}
      {packages.length > 0 && (
        <section className="py-12 md:py-20 px-5 md:px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <span className="text-xs font-bold tracking-widest uppercase text-blue-600">שבת עד שבת · מחיר אחד, הכל כלול</span>
              <h2 className="font-display text-2xl md:text-4xl font-black text-gray-900 mt-1">חבילות מומלצות</h2>
              <p className="text-gray-500 text-sm mt-1">דירה + סקי פס לשלושת העמקים + הסעה + טיסה (הערכה) — שבועות אמיתיים שזמינים עכשיו</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map(({ apt, guests, perPerson, checkin, checkout }) => (
                <a key={apt.id} href="/weekly?deal=full"
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block">
                  <div className="relative h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={apt.images?.[0] ?? "/hero-ski.jpg"} alt={apt.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 55%)" }} />
                    <div className="absolute top-3 right-3 text-white text-xs font-black px-3 py-1 rounded-full bg-blue-600">✨ שבת עד שבת</div>
                    <div className="absolute bottom-3 right-3 text-white text-xs font-semibold">
                      {apt.name} · {guests} אנשים · {fmtDate(checkin)} — {fmtDate(checkout)}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold">🏠 דירה</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold">⛷️ סקי פס Trois Vallées</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold">🚐 הסעה הלוך-חזור</span>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold">✈️ טיסה (הערכה)</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-black text-gray-900">מ-€{perPerson.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">לאדם · שבוע קבוע, זמין עכשיו</div>
                      </div>
                      <span className="text-sm font-black text-blue-600 group-hover:gap-3 flex items-center gap-1.5 transition-all">
                        לכל הדילים ←
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Resort stats ─────────────────────────────────── */}
      <div className="bg-gray-900 py-8 px-5 md:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl md:text-4xl font-black text-white">600 ק"מ</div>
            <div className="text-xs md:text-sm text-white/50 mt-1">מסלולי סקי</div>
          </div>
          <div>
            <div className="text-2xl md:text-4xl font-black text-white">150+</div>
            <div className="text-xs md:text-sm text-white/50 mt-1">מעליות</div>
          </div>
          <div>
            <div className="text-2xl md:text-4xl font-black text-white">2,300-3,230מ'</div>
            <div className="text-xs md:text-sm text-white/50 mt-1">גובה פסגות</div>
          </div>
        </div>
      </div>

      {/* ── שבת עד שבת ───────────────────────────────────── */}
      <section className="py-12 md:py-20 px-5 md:px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden md:flex">
            <div className="relative h-44 md:h-auto md:w-2/5 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/view.jpg" alt="Val Thorens" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-black/50 to-transparent" />
            </div>
            <div className="p-6 md:p-10 flex-1">
              <span className="text-xs font-bold tracking-widest uppercase text-blue-600">הכי נוח לדיל שלם</span>
              <h2 className="font-display text-2xl md:text-3xl font-black text-gray-900 mt-2 mb-3">דירות שבת עד שבת</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                הדירות הכי זולות ונוחות לשבוע שלם בואל טורנס — ואפשר גם לשלב טיסות והסעות.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="/weekly" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors">
                  לכל הדירות הזמינות ←
                </a>
                <a href="https://www.skyscanner.co.il/transport/flights/tlv/gva/" target="_blank" rel="noopener noreferrer"
                  className="border border-gray-200 hover:border-blue-300 text-gray-700 text-sm font-bold px-5 py-3 rounded-xl transition-colors">
                  חיפוש טיסות ←
                </a>
              </div>
            </div>
          </div>
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
