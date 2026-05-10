import Navbar from "@/components/Navbar";
import SearchWidget from "@/components/SearchWidget";
import Snow from "@/components/Snow";
import Footer from "@/components/Footer";

/* ─── Data ─────────────────────────────────────────────────── */

const steps = [
  {
    num: "01",
    icon: "🏠",
    color: "from-blue-500 to-blue-700",
    title: "בחר דירה",
    desc: "מגוון דירות מנוהלות ב-Val Thorens לכל גודל קבוצה ותקציב — עם תמונות אמיתיות ואמינות מלאה.",
  },
  {
    num: "02",
    icon: "🎿",
    color: "from-sky-400 to-blue-600",
    title: "הוסף סקי פס",
    desc: "סקי פס ל-Trois Vallées — הרשת הגדולה בעולם עם 600 ק״מ מסלולים. לבחירת ימים, תאריכים וסוג.",
  },
  {
    num: "03",
    icon: "🚌",
    color: "from-indigo-500 to-blue-700",
    title: "הוסף הסעה",
    desc: "העברה נוחה ומהירה משדה התעופה ישירות לאתר. שאטל פרטי או משותף לפי הצורך.",
  },
  {
    num: "04",
    icon: "✈️",
    color: "from-violet-500 to-blue-700",
    title: "הוסף טיסה",
    desc: "חיפוש טיסות ישיר דרך Skyscanner. בעתיד — גם טיסות פרטיות שלנו בלעדית.",
  },
];

const apartments = [
  {
    name: "Chalet Blanc",
    type: "שאלה פרטי",
    beds: 6,
    baths: 3,
    sqm: 180,
    price: 1200,
    rating: 4.97,
    reviews: 84,
    tag: "מומלץ ביותר",
    tagColor: "bg-amber-500",
    image: "/apt1.jpg",
    amenities: ["🛁", "🔥", "🏔️", "🍳", "📶"],
  },
  {
    name: "Studio Alpine",
    type: "סטודיו זוגי",
    beds: 1,
    baths: 1,
    sqm: 45,
    price: 320,
    rating: 4.91,
    reviews: 132,
    tag: "הזול ביותר",
    tagColor: "bg-green-500",
    image: "/apt2.jpg",
    amenities: ["🛁", "❄️", "🏔️", "📶"],
  },
  {
    name: "Penthouse Summit",
    type: "פנטהאוס",
    beds: 8,
    baths: 4,
    sqm: 280,
    price: 2100,
    rating: 5.0,
    reviews: 31,
    tag: "יוקרה",
    tagColor: "bg-purple-600",
    image: "/apt3.jpg",
    amenities: ["🛁", "🔥", "🏔️", "🍳", "🍷", "📶", "🚗"],
  },
];

const features = [
  { icon: "🏔️", title: "הנקודה הגבוהה ביותר", desc: "Val Thorens נמצאת ב-2,300 מ׳ — שלג מובטח מנובמבר עד מאי" },
  { icon: "🔧", title: "בניית חבילה מודולרית", desc: "הוסף ותסיר שירותים בדיוק לפי הצורך — משלמים רק על מה שרוצים" },
  { icon: "🛡️", title: "ביטוח מותאם אישית", desc: "ביטוח סקי, ביטוח נסיעות, ביטוח ביטול — עם או בלי נציג אישי" },
  { icon: "🇮🇱", title: "שירות בעברית", desc: "צוות ישראלי דובר עברית זמין לפני, במהלך, ואחרי החופשה" },
  { icon: "💳", title: "תשלום מאובטח", desc: "תשלום מאובטח בכרטיס אשראי, העברה בנקאית, או תשלומים" },
  { icon: "♻️", title: "ביטול גמיש", desc: "מדיניות ביטול שקופה ופשוטה — בלי הפתעות ברגע האחרון" },
];

const stats = [
  { num: "600 ק״מ", label: "מסלולי סקי" },
  { num: "180+", label: "ימי שלג בשנה" },
  { num: "2,300 מ׳", label: "גובה האתר" },
  { num: "4.9 ★", label: "דירוג ממוצע" },
];

/* ─── Mountain SVG ─────────────────────────────────────────── */
function Mountains() {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20" style={{ lineHeight: 0 }}>
      <svg viewBox="0 0 1440 380" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: "380px" }}>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2255a4" />
            <stop offset="100%" stopColor="#0d2248" />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#163875" />
            <stop offset="100%" stopColor="#091828" />
          </linearGradient>
          <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e2a56" />
            <stop offset="100%" stopColor="#060f1c" />
          </linearGradient>
          <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#080e1c" />
            <stop offset="100%" stopColor="#040a14" />
          </linearGradient>
          <linearGradient id="horizonGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a6aaa" stopOpacity="0" />
            <stop offset="50%" stopColor="#1a6aaa" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1a6aaa" stopOpacity="0" />
          </linearGradient>
          <filter id="softBlur">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Horizon atmospheric glow */}
        <rect x="0" y="80" width="1440" height="180" fill="url(#horizonGlow)" />

        {/* Layer 1 — most distant, lightest */}
        <path
          d="M0,320 L50,280 L100,300 L160,255 L220,285 L280,240 L350,268 L420,225 L480,255 L550,210 L620,248 L690,205 L760,242 L830,200 L900,238 L970,196 L1040,235 L1110,198 L1180,235 L1250,200 L1320,232 L1380,205 L1440,228 L1440,380 L0,380 Z"
          fill="url(#g1)" opacity="0.55"
        />
        {/* Snow caps layer 1 */}
        <path d="M280,240 L265,264 L295,264 Z" fill="white" opacity="0.5" />
        <path d="M420,225 L405,252 L435,252 Z" fill="white" opacity="0.5" />
        <path d="M550,210 L534,238 L566,238 Z" fill="white" opacity="0.55" />
        <path d="M690,205 L674,234 L706,234 Z" fill="white" opacity="0.55" />
        <path d="M830,200 L814,230 L846,230 Z" fill="white" opacity="0.6" />
        <path d="M970,196 L953,227 L987,227 Z" fill="white" opacity="0.55" />
        <path d="M1110,198 L1094,228 L1126,228 Z" fill="white" opacity="0.5" />
        <path d="M1250,200 L1233,230 L1267,230 Z" fill="white" opacity="0.5" />

        {/* Layer 2 — mid-distant */}
        <path
          d="M0,355 L60,308 L130,335 L210,282 L280,318 L360,265 L440,305 L530,255 L610,298 L700,245 L780,290 L860,240 L940,282 L1020,238 L1100,278 L1180,240 L1260,278 L1340,248 L1440,272 L1440,380 L0,380 Z"
          fill="url(#g2)" opacity="0.85"
        />
        {/* Snow caps layer 2 */}
        <path d="M210,282 L193,310 L227,310 Z" fill="white" opacity="0.65" />
        <path d="M360,265 L342,296 L378,296 Z" fill="white" opacity="0.7" />
        <path d="M530,255 L511,288 L549,288 Z" fill="white" opacity="0.75" />
        <path d="M700,245 L680,280 L720,280 Z" fill="white" opacity="0.78" />
        <path d="M860,240 L839,277 L881,277 Z" fill="white" opacity="0.75" />
        <path d="M1020,238 L999,275 L1041,275 Z" fill="white" opacity="0.72" />
        <path d="M1180,240 L1159,277 L1201,277 Z" fill="white" opacity="0.68" />
        <path d="M1340,248 L1320,283 L1360,283 Z" fill="white" opacity="0.65" />

        {/* Snow texture on caps layer 2 */}
        <path d="M360,280 L345,296 L375,296 Z" fill="white" opacity="0.3" />
        <path d="M700,264 L684,280 L716,280 Z" fill="white" opacity="0.3" />
        <path d="M860,259 L843,277 L877,277 Z" fill="white" opacity="0.3" />

        {/* Layer 3 — near mountains (main silhouette) */}
        <path
          d="M0,380 L0,348 L90,372 L180,325 L260,360 L350,308 L440,352 L530,295 L625,345 L720,288 L815,338 L900,285 L992,333 L1080,283 L1170,328 L1265,285 L1355,325 L1440,298 L1440,380 Z"
          fill="url(#g3)"
        />
        {/* Snow caps layer 3 */}
        <path d="M180,325 L160,355 L200,355 Z" fill="white" opacity="0.82" />
        <path d="M350,308 L328,341 L372,341 Z" fill="white" opacity="0.88" />
        <path d="M530,295 L506,332 L554,332 Z" fill="white" opacity="0.9" />
        <path d="M720,288 L694,328 L746,328 Z" fill="white" opacity="0.92" />
        <path d="M900,285 L874,326 L926,326 Z" fill="white" opacity="0.9" />
        <path d="M1080,283 L1054,325 L1106,325 Z" fill="white" opacity="0.88" />
        <path d="M1265,285 L1239,326 L1291,326 Z" fill="white" opacity="0.85" />
        {/* Extra snow spread */}
        <path d="M530,312 L510,332 L550,332 Z" fill="white" opacity="0.35" />
        <path d="M720,306 L698,328 L742,328 Z" fill="white" opacity="0.35" />
        <path d="M900,304 L877,326 L923,326 Z" fill="white" opacity="0.35" />

        {/* Layer 4 — dark foreground silhouette */}
        <path
          d="M0,380 L0,367 L100,380 L200,358 L295,376 L390,352 L475,372 L565,345 L655,368 L748,342 L838,366 L928,340 L1018,365 L1108,343 L1198,363 L1288,348 L1378,364 L1440,352 L1440,380 Z"
          fill="url(#g4)"
        />
      </svg>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center overflow-hidden"
        style={{ minHeight: "100vh" }}
      >
        {/* Real hero photo */}
        <img
          src="/hero-ski.jpg"
          alt="Val Thorens ski slopes"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 0 }}
        />

        {/* Dark overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 1,
            background: "linear-gradient(to bottom, rgba(2,8,20,0.55) 0%, rgba(4,12,28,0.45) 50%, rgba(2,8,16,0.85) 100%)",
          }}
        />

        <Snow />
        <Mountains />

        <div className="relative z-30 flex flex-col items-center gap-7 px-4 text-center pt-32 pb-[420px] max-w-5xl mx-auto w-full">
          {/* Badge */}
          <div
            className="text-white text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" style={{ boxShadow: "0 0 6px #4ade80" }} />
            עונת 2025/26 פתוחה להזמנות — מחירי early bird זמינים
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-[88px] font-black leading-[1.05] tracking-tight">
            <span
              style={{
                background: "linear-gradient(135deg, #fff 0%, #93c5fd 40%, #e0f2fe 70%, #fff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              חופשת סקי
            </span>
            <br />
            <span className="text-white">שתעשו אחרת</span>
          </h1>

          <p className="text-lg md:text-xl max-w-xl leading-relaxed" style={{ color: "rgba(147,197,253,0.75)" }}>
            Val Thorens — הגובה הגבוה ביותר באירופה. בנה את החבילה שלך שלב אחר שלב, בדיוק מה שרוצה.
          </p>

          {/* Search Widget */}
          <div className="w-full flex justify-center">
            <SearchWidget />
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            <span className="flex items-center gap-1.5">✅ ביטול חינם עד 30 יום</span>
            <span className="flex items-center gap-1.5">🔒 תשלום מאובטח</span>
            <span className="flex items-center gap-1.5">🇮🇱 שירות בעברית</span>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────── */}
      <section className="bg-blue-600 py-6">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-white">{s.num}</div>
              <div className="text-blue-200 text-sm mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-blue-600 font-bold text-sm tracking-widest uppercase">תהליך ההזמנה</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-3">
              בנה את החבילה שלך
            </h2>
            <p className="text-gray-500 text-lg mt-4 max-w-xl mx-auto">
              שלב אחר שלב — רק מה שרוצה, בלי תוספות מיותרות
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-14 right-[12.5%] left-[12.5%] h-px bg-gradient-to-l from-violet-200 via-blue-200 to-sky-200 z-0" />

            {steps.map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center text-4xl shadow-xl shadow-blue-200/50 group-hover:scale-110 transition-transform duration-300 mb-5`}>
                  {step.icon}
                </div>
                <div className="absolute -top-3 -right-1 w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Post-booking options */}
          <div className="mt-20 bg-gradient-to-br from-blue-50 to-sky-50 rounded-3xl p-8 md:p-10 border border-blue-100">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-gray-900">אחרי ההזמנה — עוד לא נגמר 😄</h3>
              <p className="text-gray-500 mt-2">הוסף שירותים נוספים לחופשה המושלמת</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "🛡️", title: "ביטוח סקי", sub: "עם/בלי" },
                { icon: "🧑‍💼", title: "נציג אישי", sub: "עם/בלי" },
                { icon: "🏥", title: "ביטוח רפואי", sub: "מורחב" },
                { icon: "🚁", title: "חילוץ", sub: "הר ושלג" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow border border-blue-100/50">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="font-bold text-gray-900 text-sm">{item.title}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── APARTMENTS PREVIEW ─────────────────────────────── */}
      <section id="apartments" className="py-28 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-14">
            <div>
              <span className="text-blue-600 font-bold text-sm tracking-widest uppercase">אחשק ב-Val Thorens</span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-3">דירות נבחרות</h2>
            </div>
            <a href="#" className="hidden md:flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all text-sm">
              כל הדירות ←
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apartments.map((apt, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                {/* Real image */}
                <div className="relative h-52 overflow-hidden">
                  <img src={apt.image} alt={apt.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
                  <div className={`absolute top-4 right-4 ${apt.tagColor} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}>
                    {apt.tag}
                  </div>
                  <div className="absolute bottom-4 left-4 text-white text-sm font-bold px-3 py-1.5 rounded-xl" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}>
                    €{apt.price.toLocaleString()} / לילה
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-black text-gray-900 text-lg">{apt.name}</h3>
                      <p className="text-gray-500 text-sm">{apt.type}</p>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900 text-sm">⭐ {apt.rating}</div>
                      <div className="text-gray-400 text-xs">{apt.reviews} ביקורות</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 border-t border-gray-100 pt-4">
                    <span>🛏️ {apt.beds} חד׳</span>
                    <span>🚿 {apt.baths} אמב׳</span>
                    <span>📐 {apt.sqm} מ״ר</span>
                  </div>

                  <div className="flex items-center gap-2 mb-5">
                    {apt.amenities.map((a, j) => (
                      <span key={j} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm border border-gray-100">{a}</span>
                    ))}
                  </div>

                  <button className="w-full bg-gray-900 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors text-sm group-hover:bg-blue-600">
                    בחר דירה זו
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ─────────────────────────────────────────── */}
      <section className="py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-bold text-sm tracking-widest uppercase">למה MySki</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-3">שקיפות מלאה. שירות אמיתי.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-7 rounded-3xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-2xl mb-5 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #0f3060 0%, #061228 40%, #020810 100%)" }}
      >
        <Snow />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            מוכן לרוץ על<br />
            <span style={{
              background: "linear-gradient(135deg, #fff 0%, #93c5fd 40%, #e0f2fe 70%, #fff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>השלג הטרי?</span>
          </h2>
          <p className="text-blue-200/80 text-lg mb-10 max-w-xl mx-auto">
            הזמן עכשיו לעונת 2025/26 ותיהנה מ-early bird — מחירים מיוחדים לשבועות הראשונים בלבד.
          </p>
          <a
            href="#search"
            className="inline-flex items-center gap-3 bg-white text-blue-700 font-black px-10 py-5 rounded-2xl text-lg hover:bg-blue-50 transition-colors shadow-2xl shadow-blue-900/50"
          >
            🎿 התחל לבנות את החבילה שלי
          </a>
          <p className="text-blue-400/60 text-sm mt-6">אפשר לבטל בחינם עד 30 יום לפני הגעה</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
