import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import SnowCanvas from "@/components/SnowCanvas";
import { IconWhatsApp } from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "מצב חירום, מלחמה וכוח עליון — SkiShare",
  description: "מה קורה אם יש מצב חריג — טיסות, דירות, סקי פס וגם אם אתם כבר בחופשה. שקוף ומראש, בלי הפתעות.",
};

function PolicyCard({
  emoji, gradient, ring, title, badge, badgeClass, children,
}: {
  emoji: string; gradient: string; ring: string; title: string;
  badge: string; badgeClass: string; children: React.ReactNode;
}) {
  return (
    <article className={`interactive-card bg-white rounded-3xl p-6 sm:p-8 shadow-soft border ${ring}`}>
      <div className="flex items-start gap-4 sm:gap-5">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${gradient} text-white shadow-lg flex items-center justify-center shrink-0 text-2xl`}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>{badge}</span>
          </div>
          <div className="text-slate-600 text-sm sm:text-base leading-relaxed">{children}</div>
        </div>
      </div>
    </article>
  );
}

export default function EmergencyPolicyPage() {
  const waHref = buildWaHref({
    intro: "היי! 👋 יש לי שאלה לגבי מדיניות מצב חירום/כוח עליון:",
    lines: ["רציתי לשאול לגבי..."],
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-blue-50/40" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/"><Logo className="h-8" /></a>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              תמיכה זמינה
            </span>
            <a href="/" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">→ חזרה לאתר</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative aurora-gradient text-white pt-14 pb-28 overflow-hidden">
        <SnowCanvas />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-400/25 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-[34rem] h-[34rem] bg-indigo-500/20 rounded-full blur-3xl animate-float-slow pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-5 text-center z-20">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-xl border border-white/30 text-xs sm:text-sm font-bold mb-6">
            <span className="animate-bounce-gentle">🛡️⛷️</span>
            שקיפות מלאה, בלי הפתעות — אתם בידיים הכי בטוחות
          </span>

          <div className="mx-auto relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-white/20 via-sky-300/30 to-white/10 border-2 border-white/40 backdrop-blur-2xl flex items-center justify-center mb-7 shadow-2xl animate-float-slow">
            <span className="text-4xl">🏔️✨</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-5">
            מצב חירום, מלחמה<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-white to-blue-200">וכוח עליון — אנחנו הגב שלכם</span>
          </h1>
          <p className="text-blue-100 text-[15px] sm:text-lg leading-relaxed max-w-xl mx-auto">
            יודעים שזה מלחיץ. הנה בדיוק מה קורה איתכם ועם הכסף שלכם — עם הטיסה, הדירה והסקי פס —
            אם יקרה שוב מצב חריג כמו שהיה עם איראן.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-sky-100">
            <span className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-md">
              <span className="text-emerald-300">✓</span> מענה אישי וזמין
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-md">
              <span className="text-emerald-300">✓</span> עזרה מיידית במציאת פתרונות
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-md">
              <span className="text-emerald-300">✓</span> החזר בהתאם למה שמתקבל
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-5 -mt-16 relative z-20 pb-16">
        {/* Disclaimer */}
        <section className="interactive-card bg-white rounded-3xl p-6 sm:p-8 shadow-elevated border-2 border-amber-200/90 mb-6 relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-md shrink-0 flex items-center justify-center text-white text-2xl animate-bounce-gentle">⚠️</div>
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold mb-2">כנות ושקיפות מלאה</span>
              <h2 className="font-display text-lg sm:text-xl font-black text-slate-900 mb-2">הבהרה חשובה לגבי אופי השירות והספקים</h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                חשוב להבין שרוב העבודה שלנו היא מול ספקים חיצוניים בחו&quot;ל, ולכן גם אנחנו כפופים למדיניות
                הביטולים וההחזרים שלהם. אחרי מה שהיה בשנה שעברה, חלק מהספקים אפילו החמירו את התנאים.
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-5 mb-8">
          <PolicyCard emoji="✈️" gradient="from-blue-600 to-sky-400" ring="border-blue-100 hover:border-blue-300"
            title="בטיסות" badge="שקיפות מלאה בהחזר" badgeClass="bg-blue-50 text-blue-700 border-blue-100">
            <p>
              אם חברת התעופה תאשר החזר, אנחנו נעביר לכם את ההחזר בהתאם למה שיתקבל ממנה. אם הכסף
              ייכנס אלינו — נעביר אותו אליכם, ואם ההחזר מתבצע ישירות אליכם, כמובן שהוא יגיע ישר אליכם.
            </p>
          </PolicyCard>

          <PolicyCard emoji="🏠" gradient="from-cyan-600 to-teal-400" ring="border-cyan-100 hover:border-cyan-300"
            title="בדירות" badge="עוזרים לצמצם נזק" badgeClass="bg-cyan-50 text-cyan-700 border-cyan-100">
            <p>
              לצערנו, במקרה כזה בדרך כלל אין לנו אפשרות לקבל החזר מהספק של הדירה. מה שכן — נעזור לכם
              בכל מה שאפשר כדי לנסות לצמצם את הנזק. למשל, אם יש ישראלים שכבר נמצאים באזור וצריכים
              מקום, נוכל לעזור לפרסם בקבוצות וברשתות ולנסות להעביר אליהם את הדירה. כל כסף שייכנס
              כתוצאה מזה, כמובן, יגיע אליכם.
            </p>
          </PolicyCard>

          <PolicyCard emoji="🎿" gradient="from-indigo-600 to-purple-500" ring="border-indigo-100 hover:border-indigo-300"
            title="בסקי פס" badge="לא חויבתם? לא שילמתם" badgeClass="bg-indigo-50 text-indigo-700 border-indigo-100">
            <p>
              כל עוד אנחנו עדיין לא בדקה ה-90 ולא רכשנו ושילמנו על הסקי פס, כמובן שלא תחויבו עליו.
              אנחנו גם נעדכן אתכם כמה ימים לפני שאנחנו מבצעים את הרכישה.
            </p>
          </PolicyCard>

          {/* Stuck-on-vacation */}
          <article className="interactive-card bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white border-2 border-amber-300/80 rounded-3xl p-6 sm:p-8 shadow-soft">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-lg shrink-0 flex items-center justify-center text-2xl animate-pulse">🤝</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">ואם אתם כבר בחופשה ונתקעים?</h3>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">לא עוזבים אתכם לבד</span>
                </div>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                  בתרחיש ההפוך — אם חלילה אתם כבר בחופשה ונתקעים שם בגלל ביטולי טיסות או מצב חריג —
                  אנחנו נעזור לכם למצוא מקום להישאר בו ולטפל בטיסה חזרה. לא נוכל לממן שהייה מלאה
                  מקצה לקצה, אבל כן נעשה הכול כדי שלא תישארו בלי פתרון, ונשתדל מאוד לבוא לקראתכם
                  בכל מה שאפשר.
                </p>
              </div>
            </div>
          </article>

          {/* Reassurance */}
          <aside className="interactive-card bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border-2 border-emerald-300 rounded-3xl p-5 sm:p-7 flex items-center gap-5 shadow-soft">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 text-2xl shadow-md">💪</div>
            <p className="text-sm sm:text-base font-medium leading-relaxed text-emerald-950">
              <strong className="text-emerald-800 font-extrabold block mb-0.5">ניסיון מהשטח שמרגיע לדעת:</strong>
              בשנה שעברה, כשהיה מצב דומה, יצאו טיסות חילוץ די מהר — ותוך כמה ימים רוב האנשים כבר
              הצליחו לרדת מההר ולחזור הביתה.
            </p>
          </aside>
        </div>

        {/* Summary */}
        <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-blue-900 to-slate-900 text-white rounded-3xl p-7 sm:p-9 shadow-2xl mb-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right border border-white/10">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 text-cyan-300 text-2xl">🏂</div>
          <p className="text-[15px] sm:text-lg font-medium text-slate-100 leading-relaxed">
            <strong className="text-sky-300 font-extrabold ml-1.5">בקיצור:</strong>
            אנחנו לא יכולים לשלוט בהחלטות של חברות התעופה והספקים בחו&quot;ל, אבל בכל מצב כזה
            נהיה זמינים עבורכם ונעזור עד כמה שאפשר למצוא את הפתרון הכי טוב.
          </p>
        </section>

        {/* Insurance comparison */}
        <section className="relative bg-white rounded-3xl p-6 sm:p-10 shadow-vip border border-slate-200/90 overflow-hidden mb-10">
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400" />
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs sm:text-sm font-black mb-3">
              🛡️ שקט נפשי בהזמנה
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">רוצים שקט נפשי מוחלט?</h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2">בוחרים בשלב ההזמנה — בלי סיבוכים.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 items-stretch">
            <div className="interactive-card rounded-3xl border-2 border-slate-200 bg-slate-50/60 p-6 flex flex-col justify-between hover:border-slate-300">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-slate-800">ללא ביטוח ביטול</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold">ברירת מחדל</span>
                </div>
                <div className="mb-4 bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm">
                  <div className="font-display text-2xl font-black text-slate-900">−€50 <span className="text-xs font-semibold text-slate-500">חיסכון</span></div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  במקרה ביטול — כפוף למדיניות הספקים שמוסברת למעלה. אין החזר מובטח מעבר לזה.
                </p>
              </div>
            </div>

            <div className="interactive-card vip-border-glow rounded-3xl bg-gradient-to-br from-blue-50/60 via-sky-50/40 to-indigo-50/30 p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
              <span className="absolute -top-1 left-6 bg-gradient-to-r from-blue-600 to-sky-500 text-white text-[11px] font-black uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md">
                מומלץ ★
              </span>
              <div>
                <div className="flex items-center gap-2 mb-4 pt-2">
                  <span className="text-lg font-black text-blue-900">עם ביטוח ביטול</span>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold">✓</span>
                </div>
                <div className="mb-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-blue-200/80 shadow-md">
                  <div className="font-display text-3xl font-black text-blue-600">+€100 <span className="text-xs font-bold text-slate-600">לאדם</span></div>
                </div>
                <p className="text-slate-800 text-sm leading-relaxed">
                  <strong className="text-blue-900 font-extrabold">החזר מלא מובטח</strong> במקרה של מצב חריג — גם אם
                  הספקים בחו&quot;ל לא יחזירו.
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-6 text-center">אפשר לבחור את זה בשלב ההזמנה — אם לא בטוחים מה מתאים לכם, פשוט תשאלו אותנו.</p>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4">
          <a href={waHref} target="_blank" rel="noopener noreferrer"
            className="btn-shimmer inline-flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95">
            <IconWhatsApp size={22} /> יש לי שאלה — דברו איתנו
          </a>
          <p className="text-xs text-gray-400">
            העמוד הזה משלים את <a href="/terms" className="text-blue-600 hover:underline">התקנון ומדיניות הביטולים</a> הרגילה,
            ומתייחס במיוחד למקרים חריגים של מלחמה, ביטולי טיסות המוניים או כוח עליון.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}
