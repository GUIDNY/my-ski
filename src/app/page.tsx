import Navbar from "@/components/Navbar";
import SearchWidget from "@/components/SearchWidget";
import FlightSearch from "@/components/FlightSearch";
import Footer from "@/components/Footer";

/* ─── Data ─────────────────────────────────────────────────── */

const steps = [
  { icon: "🏠", title: "בחר דירה", desc: "דירות מנוהלות ב-Val Thorens לכל גודל קבוצה ותקציב." },
  { icon: "🎿", title: "הוסף סקי פס", desc: "Trois Vallées — 600 ק״מ מסלולים, הרשת הגדולה בעולם." },
  { icon: "🚌", title: "הוסף הסעה", desc: "שאטל ישיר משדה התעופה לאתר הסקי." },
  { icon: "✈️", title: "הוסף טיסה", desc: "חיפוש טיסות דרך Skyscanner, ובעתיד — טיסות פרטיות שלנו." },
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

const features = [
  { icon: "🏔️", title: "הנקודה הגבוהה ביותר", desc: "2,300 מ׳ — שלג מובטח מנובמבר עד מאי" },
  { icon: "🧩", title: "חבילה מודולרית", desc: "שלם רק על מה שרוצה, הוסף ותסיר בקלות" },
  { icon: "🛡️", title: "ביטוח מותאם", desc: "סקי, ביטול, רפואי — עם או בלי נציג" },
  { icon: "🇮🇱", title: "שירות בעברית", desc: "צוות ישראלי זמין לפני, במהלך ואחרי" },
  { icon: "💳", title: "תשלום גמיש", desc: "כרטיס, העברה, או תשלומים ללא ריבית" },
  { icon: "♻️", title: "ביטול חינם", desc: "מדיניות ביטול שקופה עד 30 יום לפני" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden" style={{ height: "100vh", minHeight: "640px" }}>

        {/* Photo */}
        <img
          src="/hero-ski.jpg"
          alt="Val Thorens"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 0 }}
        />

        {/* Gradient overlay — light at center, darker at top and bottom */}
        <div className="absolute inset-0" style={{
          zIndex: 1,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.55) 100%)"
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-7 px-4 text-center w-full max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
            חופשות סקי ללא הגבלה
            <br />
            מחירים שלא מתחרים
          </h1>

          <SearchWidget />

          {/* AI / extra action */}
          <button className="flex items-center gap-2.5 px-6 py-3 rounded-full text-white text-sm font-medium transition-all hover:bg-white/20" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
            ✨ תכנון חכם — בנה את החבילה שלך →
          </button>
        </div>

        {/* Trustpilot bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="bg-white/95 backdrop-blur-sm py-4 px-6 flex items-center justify-center gap-3">
            <span className="text-gray-700 font-semibold text-sm">מצוין</span>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#00b67a">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
            <span className="text-gray-500 text-sm">4,162 ביקורות ב-Trustpilot</span>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-3">תהליך ההזמנה</p>
            <h2 className="text-4xl font-black text-gray-900">בנה את החבילה שלך שלב אחר שלב</h2>
            <p className="text-gray-500 mt-3 text-lg">רק מה שרוצה, בלי תוספות מיותרות</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-10 right-[12%] left-[12%] h-px bg-gradient-to-l from-blue-100 via-blue-200 to-blue-100" />
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-4 relative">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl shadow-sm hover:shadow-md hover:scale-105 transition-all">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">{i + 1}</div>
                <h3 className="font-bold text-gray-900 text-lg">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Add-ons after booking */}
          <div className="mt-16 rounded-2xl p-8 border border-blue-100 bg-blue-50/50">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">אחרי ההזמנה — הוסף גם:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: "🛡️", label: "ביטוח סקי" },
                { icon: "🧑‍💼", label: "נציג אישי" },
                { icon: "🏥", label: "ביטוח רפואי" },
                { icon: "🚁", label: "חילוץ הר" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-sm font-semibold text-gray-800">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FLIGHTS ──────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-2">חיפוש טיסות</p>
            <h2 className="text-3xl font-black text-gray-900">מצא טיסה ל-Val Thorens</h2>
            <p className="text-gray-500 mt-2">אנחנו מחפשים עבורך ב-Google Flights ו-Skyscanner</p>
          </div>
          <FlightSearch destination="Val Thorens" guests={2} />
        </div>
      </section>

      {/* ── APARTMENTS ───────────────────────────────────── */}
      <section id="apartments" className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-2">אכשנ ב-Val Thorens</p>
              <h2 className="text-4xl font-black text-gray-900">דירות נבחרות</h2>
            </div>
            <a href="#" className="text-blue-600 font-semibold text-sm hover:underline hidden md:block">כל הדירות →</a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apartments.map((apt, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <div className="relative h-52 overflow-hidden">
                  <img src={apt.image} alt={apt.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)" }} />
                  <div className="absolute top-3 right-3 text-white text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: apt.tagColor }}>
                    {apt.tag}
                  </div>
                  <div className="absolute bottom-3 left-3 text-white text-sm font-bold px-3 py-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
                    €{apt.price.toLocaleString()} / לילה
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-black text-gray-900 text-lg">{apt.name}</h3>
                      <p className="text-gray-400 text-sm">{apt.type}</p>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-gray-900">⭐ {apt.rating}</div>
                      <div className="text-xs text-gray-400">{apt.reviews} ביקורות</div>
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm text-gray-500 py-3 border-t border-gray-100 mb-4">
                    <span>🛏 {apt.beds} חד׳</span>
                    <span>🚿 {apt.baths} אמב׳</span>
                    <span>📐 {apt.sqm} מ״ר</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-4">
                    {apt.amenities.map((a, j) => (
                      <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{a}</span>
                    ))}
                  </div>
                  <button className="w-full py-3 rounded-xl font-bold text-sm transition-colors bg-gray-900 text-white hover:bg-blue-600">
                    בחר דירה זו
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ───────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-2">למה MySki</p>
            <h2 className="text-4xl font-black text-gray-900">שקיפות מלאה. שירות אמיתי.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <img src="/hero-ski.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "rgba(5,15,35,0.72)" }} />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">מוכן לרוץ על השלג?</h2>
          <p className="text-blue-200 text-lg mb-8">הזמן עכשיו לעונת 2025/26 — מחירי early bird זמינים לשבועות הקרובים בלבד</p>
          <a href="#" className="inline-block bg-white text-blue-700 font-black px-10 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors">
            התחל לבנות את החבילה שלי
          </a>
          <p className="text-white/40 text-sm mt-5">ביטול חינם עד 30 יום לפני הגעה</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
