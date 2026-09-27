import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { IconWhatsApp, IconShield, IconInfo, IconPlane, IconHome, IconSkis, IconUsers, IconCheck } from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "מצב חירום, מלחמה וכוח עליון — SkiShare",
  description: "מה קורה אם יש מצב חריג — טיסות, דירות, סקי פס וגם אם אתם כבר בחופשה. שקוף ומראש, בלי הפתעות.",
};

function PolicyCard({
  icon, iconClass, title, badge, badgeClass, children,
}: {
  icon: React.ReactNode; iconClass: string; title: string;
  badge: string; badgeClass: string; children: React.ReactNode;
}) {
  return (
    <article className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-gray-100">
      <div className="flex items-start gap-4 sm:gap-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className="font-display text-lg font-black text-gray-900">{title}</h3>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}>{badge}</span>
          </div>
          <div className="text-gray-600 text-sm sm:text-[15px] leading-relaxed">{children}</div>
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
    <div className="min-h-screen bg-[#f7f9fb]" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/"><Logo className="h-8" /></a>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-900 transition">→ חזרה לאתר</a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-800 to-blue-700 text-white">
        <div className="max-w-3xl mx-auto px-5 pt-14 pb-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-5">
            <IconShield size={26} className="text-white" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black leading-tight mb-4">
            מצב חירום, מלחמה וכוח עליון
          </h1>
          <p className="text-blue-100 text-[15px] md:text-base leading-relaxed max-w-xl mx-auto">
            יודעים שזה מלחיץ. הנה בדיוק מה קורה איתכם — עם הכסף שלכם, הטיסה, הדירה והסקי פס —
            אם יקרה שוב מצב חריג כמו שהיה עם איראן.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-blue-50">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
              <IconCheck size={13} className="text-emerald-300" /> מענה אישי וזמין
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
              <IconCheck size={13} className="text-emerald-300" /> עזרה מיידית במציאת פתרונות
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
              <IconCheck size={13} className="text-emerald-300" /> החזר בהתאם למה שמתקבל
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-5">
        {/* Disclaimer */}
        <section className="bg-white rounded-2xl p-6 sm:p-7 border border-amber-200 shadow-sm">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 shrink-0 flex items-center justify-center">
              <IconInfo size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-gray-900 mb-1.5">הבהרה חשובה לגבי אופי השירות והספקים</h2>
              <p className="text-gray-600 text-sm sm:text-[15px] leading-relaxed">
                חשוב להבין שרוב העבודה שלנו היא מול ספקים חיצוניים בחו&quot;ל, ולכן גם אנחנו כפופים למדיניות
                הביטולים וההחזרים שלהם. אחרי מה שהיה בשנה שעברה, חלק מהספקים אפילו החמירו את התנאים.
              </p>
            </div>
          </div>
        </section>

        <PolicyCard icon={<IconPlane size={20} />} iconClass="bg-blue-50 text-blue-600"
          title="בטיסות" badge="שקיפות מלאה בהחזר" badgeClass="bg-blue-50 text-blue-700 border-blue-100">
          <p>
            אם חברת התעופה תאשר החזר, אנחנו נעביר לכם את ההחזר בהתאם למה שיתקבל ממנה. אם הכסף
            ייכנס אלינו — נעביר אותו אליכם, ואם ההחזר מתבצע ישירות אליכם, כמובן שהוא יגיע ישר אליכם.
          </p>
        </PolicyCard>

        <PolicyCard icon={<IconHome size={20} />} iconClass="bg-sky-50 text-sky-600"
          title="בדירות" badge="עוזרים לצמצם נזק" badgeClass="bg-sky-50 text-sky-700 border-sky-100">
          <p>
            לצערנו, במקרה כזה בדרך כלל אין לנו אפשרות לקבל החזר מהספק של הדירה. מה שכן — נעזור לכם
            בכל מה שאפשר כדי לנסות לצמצם את הנזק. למשל, אם יש ישראלים שכבר נמצאים באזור וצריכים
            מקום, נוכל לעזור לפרסם בקבוצות וברשתות ולנסות להעביר אליהם את הדירה. כל כסף שייכנס
            כתוצאה מזה, כמובן, יגיע אליכם.
          </p>
        </PolicyCard>

        <PolicyCard icon={<IconSkis size={20} />} iconClass="bg-indigo-50 text-indigo-600"
          title="בסקי פס" badge="לא חויבתם? לא שילמתם" badgeClass="bg-indigo-50 text-indigo-700 border-indigo-100">
          <p>
            כל עוד אנחנו עדיין לא בדקה ה-90 ולא רכשנו ושילמנו על הסקי פס, כמובן שלא תחויבו עליו.
            אנחנו גם נעדכן אתכם כמה ימים לפני שאנחנו מבצעים את הרכישה.
          </p>
        </PolicyCard>

        <PolicyCard icon={<IconUsers size={20} />} iconClass="bg-amber-50 text-amber-700"
          title="ואם אתם כבר בחופשה ונתקעים?" badge="לא עוזבים אתכם לבד" badgeClass="bg-amber-50 text-amber-800 border-amber-100">
          <p>
            בתרחיש ההפוך — אם חלילה אתם כבר בחופשה ונתקעים שם בגלל ביטולי טיסות או מצב חריג —
            אנחנו נעזור לכם למצוא מקום להישאר בו ולטפל בטיסה חזרה. לא נוכל לממן שהייה מלאה
            מקצה לקצה, אבל כן נעשה הכול כדי שלא תישארו בלי פתרון, ונשתדל מאוד לבוא לקראתכם
            בכל מה שאפשר.
          </p>
        </PolicyCard>

        {/* Reassurance */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 sm:p-7 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <IconCheck size={20} />
          </div>
          <p className="text-sm sm:text-[15px] text-gray-700 leading-relaxed pt-1.5">
            <strong className="text-emerald-800 font-bold block mb-0.5">ניסיון מהשטח:</strong>
            בשנה שעברה, כשהיה מצב דומה, יצאו טיסות חילוץ די מהר — ותוך כמה ימים רוב האנשים כבר
            הצליחו לרדת מההר ולחזור הביתה.
          </p>
        </div>

        {/* Summary */}
        <div className="bg-gray-900 text-white rounded-2xl p-6 sm:p-7">
          <p className="text-sm sm:text-[15px] leading-relaxed text-gray-200">
            <strong className="text-white font-bold">בקיצור:</strong> אנחנו לא יכולים לשלוט בהחלטות של חברות
            התעופה והספקים בחו&quot;ל, אבל בכל מצב כזה נהיה זמינים עבורכם ונעזור עד כמה שאפשר למצוא את
            הפתרון הכי טוב.
          </p>
        </div>

        {/* Insurance comparison */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <IconShield size={18} className="text-blue-600" />
            <h2 className="font-display text-lg font-black text-gray-900">רוצים שקט נפשי מוחלט?</h2>
          </div>
          <p className="text-gray-500 text-sm mb-5">אפשר לבחור את זה בשלב ההזמנה.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-900 text-sm">ללא ביטוח ביטול</span>
                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold">ברירת מחדל</span>
              </div>
              <div className="font-display text-2xl font-black text-gray-800 mb-2">−€50 <span className="text-xs font-semibold text-gray-400">חיסכון</span></div>
              <p className="text-sm text-gray-600 leading-relaxed">
                במקרה ביטול — כפוף למדיניות הספקים שמוסברת למעלה. אין החזר מובטח מעבר לזה.
              </p>
            </div>

            <div className="rounded-xl border-2 border-blue-500 p-5 relative">
              <span className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">מומלץ</span>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-gray-900 text-sm">עם ביטוח ביטול</span>
                <IconCheck size={15} className="text-emerald-600" />
              </div>
              <div className="font-display text-2xl font-black text-blue-600 mb-2">+€100 <span className="text-xs font-semibold text-gray-400">לאדם</span></div>
              <p className="text-sm text-gray-600 leading-relaxed">
                <strong className="text-gray-900">החזר מלא מובטח</strong> במקרה של מצב חריג — גם אם הספקים בחו&quot;ל לא יחזירו.
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">אם לא בטוחים מה מתאים לכם, פשוט תשאלו אותנו.</p>
        </section>

        {/* CTA */}
        <a href={waHref} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold py-3.5 rounded-xl transition">
          <IconWhatsApp size={20} /> יש לי שאלה — דברו איתנו
        </a>

        <p className="text-xs text-gray-400 text-center pt-2">
          העמוד הזה משלים את <a href="/terms" className="text-blue-600 hover:underline">התקנון ומדיניות הביטולים</a> הרגילה,
          ומתייחס במיוחד למקרים חריגים של מלחמה, ביטולי טיסות המוניים או כוח עליון.
        </p>
      </main>

      <Footer />
    </div>
  );
}
