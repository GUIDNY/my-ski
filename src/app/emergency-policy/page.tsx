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
              <span className="text-xs font-bold tracking-wide text-amber-700 uppercase mb-1 block">כנות ושקיפות מלאה</span>
              <h2 className="font-display text-lg font-black text-gray-900 mb-2">הבהרה חשובה בנוגע לאופי השירות ולמדיניות הספקים</h2>
              <div className="text-gray-600 text-sm sm:text-[15px] leading-relaxed space-y-2.5">
                <p>
                  חלק משמעותי משירותי החופשה מסופק באמצעות ספקים חיצוניים בחו&quot;ל, ובהם חברות תעופה,
                  בעלי דירות, חברות השכרת ציוד וספקי סקי פס. בהתאם לכך, במקרים של ביטול, שינוי או
                  אירוע חריג, אנו כפופים גם למדיניות הביטולים וההחזרים של אותם ספקים.
                </p>
                <p>
                  לאור אירועי העונה הקודמת, חלק מהספקים אף עדכנו והקשיחו את תנאי הביטול שלהם. לכן
                  חשוב לנו להציג מראש ובשקיפות מלאה כיצד אנו פועלים בכל אחד מהמקרים.
                </p>
              </div>
            </div>
          </div>
        </section>

        <PolicyCard icon={<IconPlane size={20} />} iconClass="bg-blue-50 text-blue-600"
          title="טיסות" badge="שקיפות מלאה בהחזר" badgeClass="bg-blue-50 text-blue-700 border-blue-100">
          <div className="space-y-2.5">
            <p>
              במקרה של ביטול טיסה או שינוי המזכה בהחזר מצד חברת התעופה, כל סכום שיוחזר אלינו על ידי
              חברת התעופה יועבר ללקוח בהתאם לסכום שהתקבל בפועל.
            </p>
            <p>
              במקרים שבהם ההחזר מתבצע ישירות על ידי חברת התעופה ללקוח, ההחזר יתקבל ישירות מול
              החברה ובהתאם למדיניותה.
            </p>
            <p>אנו כמובן נסייע ככל שניתן בהתנהלות מול חברת התעופה ובבירור סטטוס ההחזר.</p>
          </div>
        </PolicyCard>

        <PolicyCard icon={<IconHome size={20} />} iconClass="bg-sky-50 text-sky-600"
          title="דירות ואירוח" badge="עוזרים לצמצם נזק" badgeClass="bg-sky-50 text-sky-700 border-sky-100">
          <div className="space-y-2.5">
            <p>
              ברוב המקרים, לאחר ביצוע ואישור ההזמנה מול ספק הדירה, התשלום כפוף למדיניות הביטול של
              הספק ולעיתים אינו ניתן להחזר.
            </p>
            <p>
              במקרה שבו לא ניתן לקבל החזר, נעשה מאמץ לסייע בצמצום ההפסד. בין היתר, נוכל לסייע
              בפרסום הדירה בקבוצות ובערוצים רלוונטיים ולנסות לאתר אורחים חלופיים שיוכלו להשתמש
              בהזמנה.
            </p>
            <p>
              ככל שיתקבל תשלום כתוצאה מהעברת ההזמנה לאורחים אחרים, הסכום הרלוונטי יועבר ללקוח
              בהתאם למה שהתקבל בפועל.
            </p>
          </div>
        </PolicyCard>

        <PolicyCard icon={<IconSkis size={20} />} iconClass="bg-indigo-50 text-indigo-600"
          title="סקי פס" badge="לא חויבתם? לא שילמתם" badgeClass="bg-indigo-50 text-indigo-700 border-indigo-100">
          <div className="space-y-2.5">
            <p>כל עוד הסקי פס טרם הוזמן ושולם בפועל מול הספק, הלקוח לא יחויב בגינו.</p>
            <p>
              ככל האפשר, נעדכן אתכם מראש לפני ביצוע רכישת הסקי פס, כדי שתדעו מתי ההזמנה הופכת
              למחויבות מול הספק.
            </p>
            <p>לאחר ביצוע הרכישה, תנאי הביטול וההחזר יהיו בהתאם למדיניות חברת הסקי פס.</p>
          </div>
        </PolicyCard>

        <PolicyCard icon={<IconUsers size={20} />} iconClass="bg-amber-50 text-amber-700"
          title="מקרה שבו כבר נמצאים בחופשה" badge="לא עוזבים אתכם לבד" badgeClass="bg-amber-50 text-amber-800 border-amber-100">
          <div className="space-y-2.5">
            <p>
              אם במהלך החופשה מתרחש אירוע חריג, כגון ביטולי טיסות, סגירת נתיבי תחבורה או שינוי
              משמעותי אחר שמונע חזרה מתוכננת לישראל, נעשה ככל שביכולתנו לסייע במציאת פתרונות
              חלופיים.
            </p>
            <p>
              הסיוע יכול לכלול איתור מקום לינה נוסף, בדיקת אפשרויות לטיסות חלופיות וסיוע בהתנהלות
              מול ספקים רלוונטיים.
            </p>
            <p>
              חשוב להבהיר כי לא נוכל להתחייב לממן עלויות לינה, טיסות או הוצאות נוספות שנוצרו עקב
              אירוע שאינו בשליטתנו. עם זאת, נישאר זמינים ונעשה מאמץ אמיתי לסייע עד למציאת פתרון
              מתאים ככל האפשר.
            </p>
          </div>
        </PolicyCard>

        {/* Reassurance */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 sm:p-7 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <IconCheck size={20} />
          </div>
          <div className="text-sm sm:text-[15px] text-gray-700 leading-relaxed pt-1.5 space-y-2">
            <p><strong className="text-emerald-800 font-bold block mb-0.5">ניסיון מאירועים קודמים:</strong>
              גם במצבים חריגים שהתרחשו בעבר, נמצאו בתוך זמן קצר יחסית פתרונות תחבורה וטיסות חלופיות
              שאפשרו למרבית הנופשים לחזור לישראל בתוך מספר ימים.
            </p>
            <p>
              כמובן שכל אירוע נבחן בהתאם לנסיבותיו ואין באמור התחייבות לכך שכך יהיה גם בעתיד, אך
              מהניסיון שלנו חשוב לדעת שבדרך כלל קיימות מספר חלופות שניתן לבחון.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-900 text-white rounded-2xl p-6 sm:p-7 space-y-2.5">
          <p className="text-sm sm:text-[15px] leading-relaxed text-gray-200">
            <strong className="text-white font-bold">לסיכום:</strong> אין באפשרותנו לשלוט בהחלטות של חברות
            התעופה, בעלי הדירות, אתרי הסקי או יתר הספקים בחו&quot;ל.
          </p>
          <p className="text-sm sm:text-[15px] leading-relaxed text-gray-200">
            מה שאנחנו כן יכולים להתחייב אליו הוא לפעול בשקיפות מלאה, לעדכן אתכם בכל מידע מהותי,
            להעביר אליכם כל החזר שיתקבל עבורכם ולסייע ככל האפשר במציאת פתרונות במקרה של שינוי
            או אירוע בלתי צפוי.
          </p>
          <p className="text-sm sm:text-[15px] leading-relaxed text-gray-200">
            המטרה שלנו היא שתדעו מראש בדיוק מה תנאי ההזמנה, ושגם במקרה של מצב חריג יהיה לכם מול
            מי להתנהל ולקבל סיוע.
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
                <strong className="text-gray-900">לא תקבלו החזר כספי כלל</strong> במקרה של ביטול או מצב חריג.
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
