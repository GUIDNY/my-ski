import Navbar from "@/components/Navbar";
import SearchWidget from "@/components/SearchWidget";
import FlightSearch from "@/components/FlightSearch";
import Footer from "@/components/Footer";
import { IconHome, IconSkis, IconBus, IconPlane, IconShield, IconUser, IconMountain } from "@/components/Icons";

/* ── Data ─────────────────────────────────────────────────── */

const steps = [
  {
    iconEl: <IconHome size={26} className="text-white" />,
    iconBg: "bg-gray-900",
    label: "שלב 01",
    title: "בחר דירה",
    desc: "דירות מנוהלות ב-Val Thorens לכל גודל קבוצה ותקציב.",
    cta: "המשך לבחירה",
    href: "/apartments",
  },
  {
    iconEl: <IconSkis size={26} className="text-blue-800" />,
    iconBg: "bg-blue-100",
    label: "שלב 02",
    title: "הוסף סקי פס",
    desc: "Trois Vallées — 600 ק״מ מסלולים, הרשת הגדולה בעולם.",
    cta: "הוסף לחבילה",
    href: "/apartments",
  },
  {
    iconEl: <IconBus size={26} className="text-amber-700" />,
    iconBg: "bg-amber-100",
    label: "שלב 03",
    title: "הוסף הסעה",
    desc: "שאטל ישיר משדה התעופה לאתר הסקי.",
    cta: "בחר הסעה",
    href: "/apartments",
  },
  {
    iconEl: <IconPlane size={26} className="text-white" />,
    iconBg: "bg-indigo-900",
    label: "שלב 04",
    title: "הוסף טיסה",
    desc: "חיפוש טיסות דרך Skyscanner, ובעתיד — טיסות פרטיות שלנו.",
    cta: "חפש טיסה",
    href: "/search",
  },
];

const addOns = [
  {
    iconEl: <IconShield size={32} className="text-gray-900" />,
    title: "ביטוח סקי",
    desc: "כיסוי ייעודי לסקי וסנובורד כולל ציוד וביטול נסיעה.",
  },
  {
    iconEl: <IconUser size={32} className="text-gray-900" />,
    title: "נציג אישי",
    desc: "ליווי צמוד מהנחיתה ועד ההמראה, לכל שאלה או בקשה.",
  },
  {
    iconEl: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
        <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" />
        <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: "ביטוח רפואי",
    desc: 'כיסוי רפואי רחב בחו"ל עם הטסה רפואית במידת הצורך.',
  },
  {
    iconEl: <IconMountain size={32} className="text-gray-900" />,
    title: "חילוץ הר",
    desc: "שירות חילוץ וסיוע ופינוי מהיר מכל נקודה באתר הסקי.",
  },
];

const features = [
  { title: "הנקודה הגבוהה ביותר", desc: "2,300 מ׳ — שלג מובטח מנובמבר עד מאי" },
  { title: "חבילה מודולרית", desc: "שלם רק על מה שרוצה, הוסף ותסיר בקלות" },
  { title: "ביטוח מותאם", desc: "סקי, ביטול, רפואי — עם או בלי נציג" },
  { title: "שירות בעברית", desc: "צוות ישראלי זמין לפני, במהלך ואחרי" },
  { title: "תשלום גמיש", desc: "כרטיס, העברה, או תשלומים ללא ריבית" },
  { title: "ביטול חינם", desc: "מדיניות ביטול שקופה עד 30 יום לפני" },
];

const apartments = [
  {
    name: "Chalet Blanc",
    type: "שאלה פרטי",
    beds: 6, baths: 3, sqm: 180,
    price: 1200, rating: 4.97, reviews: 84,
    tag: "מומלץ ביותר", tagColor: "#f59e0b",
    image: "/apt1.jpg",
    amenities: ["ג'קוזי", "אח", "נוף להרים", "מטבח"],
  },
  {
    name: "Studio Alpine",
    type: "סטודיו זוגי",
    beds: 1, baths: 1, sqm: 45,
    price: 320, rating: 4.91, reviews: 132,
    tag: "הכי משתלם", tagColor: "#10b981",
    image: "/apt2.jpg",
    amenities: ["מרפסת", "WiFi", "נוף להרים"],
  },
  {
    name: "Penthouse Summit",
    type: "פנטהאוס יוקרה",
    beds: 8, baths: 4, sqm: 280,
    price: 2100, rating: 5.0, reviews: 31,
    tag: "יוקרה", tagColor: "#8b5cf6",
    image: "/apt3.jpg",
    amenities: ["ג'קוזי", "אח", "גג פנורמי", "חניה"],
  },
];

/* ── Page ─────────────────────────────────────────────────── */

export default function Home() {
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
        <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center w-full max-w-4xl mx-auto">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}>
            סקי מתי שרוצים,<br />במחירים נוחים
          </h1>
          <p className="text-base md:text-xl text-white/90 font-medium max-w-2xl leading-relaxed" style={{ textShadow: "0 1px 10px rgba(0,0,0,0.4)" }}>
            אצלנו דואגים לך גם לתאריכים שיתאימו לך וגם לנוחות המרבית באתר Val Thorens
          </p>
          <p className="text-sm md:text-base text-white/70 font-medium" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
            תוכל להחליט בעצמך מה לסגור דרכינו ומה לסגור עצמאית
          </p>
          <SearchWidget />
          <button className="flex items-center gap-2.5 px-6 py-3 rounded-full text-white text-sm font-medium transition-all hover:bg-white/20" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
            ✨ תכנון חכם — בנה את החבילה שלך ←
          </button>
        </div>
      </section>

      {/* ── STEPS ────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="group flex flex-col gap-6 p-8 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500"
              >
                <div className={`w-16 h-16 flex items-center justify-center rounded-full ${step.iconBg}`}>
                  {step.iconEl}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-2">{step.label}</span>
                  <h3 className="font-display text-xl font-black text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
                <a
                  href={step.href}
                  className="flex items-center gap-2 text-gray-900 text-sm font-bold group-hover:gap-4 transition-all duration-300"
                >
                  <span>{step.cta}</span>
                  <span>←</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LUXURY MID-PAGE ──────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#f7f9fb" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 items-center">
          <div className="w-full md:w-3/5 rounded-xl overflow-hidden shadow-2xl">
            <img
              src="/chalet-interior.jpg"
              alt="יוקרה בכל פרט"
              className="w-full h-[500px] object-cover hover:scale-[1.03] transition-transform duration-700"
            />
          </div>
          <div className="w-full md:w-2/5 md:pr-10">
            <h2 className="font-display text-3xl md:text-4xl font-black text-gray-900 mb-6">
              יוקרה בכל פרט
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              אנחנו ב-MY-SKI מאמינים שחופשת הסקי שלכם צריכה להיות מושלמת. החל מהדירות המפוארות ביותר ועד לשירותי קרקע שחוסכים לכם כל דאגה.
            </p>
            <div className="flex items-center gap-4 py-4 border-t border-b border-gray-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-xs font-bold tracking-widest uppercase text-gray-900">בלעדיות מובטחת ב-Val Thorens</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── ADD-ONS ──────────────────────────────────────── */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-black text-gray-900 mb-3">
                אחרי ההזמנה — הוסף גם:
              </h2>
              <p className="text-gray-500 max-w-xl text-base leading-relaxed">
                השלימו את החוויה עם שירותי הפרימיום המשלימים שלנו לביטחון מקסימלי על ההר.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button className="w-11 h-11 border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors text-lg">←</button>
              <button className="w-11 h-11 border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors text-lg">→</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {addOns.map((item, i) => (
              <div
                key={i}
                className="flex flex-col p-8 border border-gray-100 rounded-xl bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="mb-5">{item.iconEl}</div>
                <h4 className="font-display text-lg font-black text-gray-900 mb-2">{item.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">{item.desc}</p>
                <button className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-900 pb-0.5 self-start hover:opacity-50 transition-opacity">
                  הוסף כעת
                </button>
              </div>
            ))}
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
            {apartments.map((apt, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="relative h-52 overflow-hidden">
                  <img src={apt.image} alt={apt.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)" }} />
                  <div
                    className="absolute top-3 right-3 text-white text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: apt.tagColor }}
                  >
                    {apt.tag}
                  </div>
                  <div className="absolute bottom-3 left-3 text-white text-sm font-bold px-3 py-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
                    €{apt.price.toLocaleString()} / לילה
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-display font-black text-gray-900 text-lg">{apt.name}</h3>
                      <p className="text-gray-400 text-sm">{apt.type}</p>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-gray-900">★ {apt.rating}</div>
                      <div className="text-xs text-gray-400">{apt.reviews} ביקורות</div>
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
                    {apt.amenities.map((a, j) => (
                      <span key={j} className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full border border-gray-100">{a}</span>
                    ))}
                  </div>
                  <a
                    href={`/book?apartment=${apt.name}`}
                    className="block w-full py-3 rounded-lg font-black text-sm text-white text-center transition-colors bg-gray-900 hover:bg-gray-700"
                  >
                    ← הזמן עכשיו
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ───────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#f7f9fb" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-3">למה MY-SKI</span>
            <h2 className="font-display text-3xl md:text-4xl font-black text-gray-900">שקיפות מלאה. שירות אמיתי.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="p-8 rounded-xl bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mb-5">
                  <span className="text-white text-sm font-black">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="font-display font-black text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
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
