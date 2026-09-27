import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import { IconShield, IconCheck, IconWhatsApp } from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "מצב חירום, מלחמה וכוח עליון — SkiShare",
  description: "מה קורה אם יש מצב חריג — טיסות, דירות, סקי פס וגם אם אתם כבר בחופשה. שקוף ומראש, בלי הפתעות.",
};

function ScenarioCard({
  emoji, title, color, children,
}: { emoji: string; title: string; color: "blue" | "amber" | "sky"; children: React.ReactNode }) {
  const styles = {
    blue: "border-blue-100 bg-blue-50/60",
    sky: "border-sky-100 bg-sky-50/60",
    amber: "border-amber-100 bg-amber-50/60",
  }[color];
  return (
    <div className={`rounded-2xl border p-6 md:p-7 ${styles}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{emoji}</span>
        <h3 className="font-display text-lg font-black text-gray-900">{title}</h3>
      </div>
      <div className="text-[15px] text-gray-700 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function EmergencyPolicyPage() {
  const waHref = buildWaHref({
    intro: "היי! 👋 יש לי שאלה לגבי מדיניות מצב חירום/כוח עליון:",
    lines: ["רציתי לשאול לגבי..."],
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb]" dir="rtl">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-900 transition">→ חזרה לאתר</a>
          <a href="/"><Logo className="h-8" /></a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white">
        <div className="max-w-3xl mx-auto px-5 pt-14 pb-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-5">
            <IconShield size={30} className="text-white" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black leading-tight mb-3">
            מצב חירום, מלחמה וכוח עליון
          </h1>
          <p className="text-blue-100 text-[15px] md:text-base leading-relaxed max-w-xl mx-auto">
            יודעים שזה מלחיץ. הנה בדיוק מה קורה איתכם — עם הכסף שלכם, הטיסה, הדירה והסקי פס —
            אם יקרה שוב מצב חריג כמו שהיה עם איראן. בלי הפתעות, שקוף מראש.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-6">
        {/* Intro */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-7 text-[15px] text-gray-700 leading-relaxed space-y-3">
          <p>
            חשוב להבין שרוב העבודה שלנו היא מול ספקים חיצוניים בחו&quot;ל, ולכן גם אנחנו כפופים למדיניות
            הביטולים וההחזרים שלהם. אחרי מה שהיה בשנה שעברה, חלק מהספקים אפילו החמירו את התנאים.
          </p>
        </div>

        <ScenarioCard emoji="✈️" title="בטיסות" color="blue">
          <p>
            אם חברת התעופה תאשר החזר, אנחנו נעביר לכם את ההחזר בהתאם למה שיתקבל ממנה. אם הכסף
            ייכנס אלינו — נעביר אותו אליכם, ואם ההחזר מתבצע ישירות אליכם, כמובן שהוא יגיע ישר אליכם.
          </p>
        </ScenarioCard>

        <ScenarioCard emoji="🏠" title="בדירות" color="blue">
          <p>
            לצערנו, במקרה כזה בדרך כלל אין לנו אפשרות לקבל החזר מהספק של הדירה. מה שכן — נעזור לכם
            בכל מה שאפשר כדי לנסות לצמצם את הנזק. למשל, אם יש ישראלים שכבר נמצאים באזור וצריכים
            מקום, נוכל לעזור לפרסם בקבוצות וברשתות ולנסות להעביר אליהם את הדירה. כל כסף שייכנס
            כתוצאה מזה, כמובן, יגיע אליכם.
          </p>
        </ScenarioCard>

        <ScenarioCard emoji="🎿" title="בסקי פס" color="blue">
          <p>
            כל עוד אנחנו עדיין לא בדקה ה-90 ולא רכשנו ושילמנו על הסקי פס, כמובן שלא תחויבו עליו.
            אנחנו גם נעדכן אתכם כמה ימים לפני שאנחנו מבצעים את הרכישה.
          </p>
        </ScenarioCard>

        <ScenarioCard emoji="🔄" title="ואם אתם כבר בחופשה ונתקעים" color="amber">
          <p>
            בתרחיש ההפוך — אם חלילה אתם כבר בחופשה ונתקעים שם בגלל ביטולי טיסות או מצב חריג —
            אנחנו נעזור לכם למצוא מקום להישאר בו ולטפל בטיסה חזרה. לא נוכל לממן שהייה מלאה
            מקצה לקצה, אבל כן נעשה הכול כדי שלא תישארו בלי פתרון, ונשתדל מאוד לבוא לקראתכם
            בכל מה שאפשר.
          </p>
        </ScenarioCard>

        {/* Reassurance callout */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 md:p-7 flex gap-4">
          <span className="text-2xl shrink-0">💪</span>
          <p className="text-[15px] text-gray-700 leading-relaxed">
            בשנה שעברה, כשהיה מצב דומה, יצאו טיסות חילוץ די מהר — ותוך כמה ימים רוב האנשים כבר
            הצליחו לרדת מההר ולחזור הביתה.
          </p>
        </div>

        {/* Closing summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-7">
          <p className="text-[15px] text-gray-700 leading-relaxed">
            בקיצור: אנחנו לא יכולים לשלוט בהחלטות של חברות התעופה והספקים בחו&quot;ל, אבל בכל מצב כזה
            נהיה זמינים עבורכם ונעזור עד כמה שאפשר למצוא את הפתרון הכי טוב.
          </p>
        </div>

        {/* Insurance option */}
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white p-6 md:p-7">
          <div className="flex items-center gap-2 mb-3">
            <IconShield size={20} className="text-blue-600" />
            <h3 className="font-display text-lg font-black text-gray-900">רוצים שקט נפשי מוחלט?</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-blue-100 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <IconCheck size={16} className="text-emerald-600" />
                <span className="font-bold text-gray-900 text-sm">עם ביטוח ביטול</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                מוסיפים <b>€100 לאדם</b> ומקבלים ביטוח שמבטיח החזר מלא במקרה של מצב חריג — גם אם
                הספקים בחו&quot;ל לא יחזירו.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-gray-400 text-base leading-none">−</span>
                <span className="font-bold text-gray-900 text-sm">בלי ביטוח ביטול</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                חוסכים <b>€50</b> מהמחיר, אבל במקרה כזה פועלים לפי המדיניות שמוסברת למעלה — ללא
                החזר מובטח מעבר לזה.
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">אפשר לבחור את זה בשלב ההזמנה — אם לא בטוחים מה מתאים לכם, פשוט תשאלו אותנו.</p>
        </div>

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
