import type { Metadata } from "next";
import Link from "next/link";
import { buildWaHref } from "@/lib/whatsapp";
import { wrap, card, btn, Crumbs } from "@/components/ui";

export const metadata: Metadata = {
  title: "מצב חירום, מלחמה וכוח עליון — SkiShare",
  description: "מה קורה אם יש מצב חריג — טיסות, דירות, סקי פס וגם אם אתם כבר בחופשה. שקוף ומראש, בלי הפתעות.",
};

/* ── Icons (stroke, follow the text color) ─────────────────── */
const ico = (path: React.ReactNode, size = 22) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const IcoShield = ({ size = 26 }: { size?: number }) => ico(<><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></>, size);
const IcoInfo = () => ico(<><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></>);
const IcoPlane = () => ico(<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />);
const IcoHome = () => ico(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>);
const IcoTicket = () => ico(<><path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2z" /><path d="M12 7v2M12 11v2M12 15v2" /></>);
const IcoUsers = () => ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></>);
const IcoCheck = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l4 4 10-10" /></svg>
);
const IcoWhatsApp = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);

const TOPICS = [
  { id: "flights", title: "טיסות" },
  { id: "stay", title: "דירות ואירוח" },
  { id: "pass", title: "סקי פס" },
  { id: "during", title: "מקרה שבו כבר נמצאים בחופשה" },
  { id: "insurance", title: "ביטוח ביטול" },
];

function PolicyCard({ id, icon, title, badge, children }: { id: string; icon: React.ReactNode; title: string; badge: string; children: React.ReactNode }) {
  return (
    <article id={id} className={`${card} p-5 sm:p-7`}>
      <div className="flex items-start gap-4 sm:gap-5">
        <span className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-display text-[21px] md:text-[23px] font-bold text-ink">{title}</h2>
            <span className="px-3 py-1 rounded-full text-[13px] font-bold bg-soft border border-line text-ink">{badge}</span>
          </div>
          <div className="text-body text-[16px] md:text-[17px] leading-[1.75] flex flex-col gap-3">{children}</div>
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
    <div className="bg-white text-ink" dir="rtl">
      {/* Title */}
      <header className="bg-soft border-b border-line">
        <div className={`${wrap} pt-6 md:pt-8 pb-9 md:pb-12`}>
          <Crumbs items={[{ label: "דף הבית", href: "/" }, { label: "מצב חירום וכוח עליון" }]} />
          <div className="max-w-[820px] mt-5 md:mt-6 flex flex-col gap-4">
            <span className="w-14 h-14 rounded-2xl bg-white border border-line text-accent flex items-center justify-center"><IcoShield /></span>
            <h1 className="font-display font-extrabold text-[32px] leading-[1.12] md:text-[46px] md:leading-[1.08] tracking-tight text-ink">
              מצב חירום, מלחמה וכוח עליון
            </h1>
            <p className="text-[17px] md:text-[19px] leading-relaxed text-body">
              יודעים שזה מלחיץ. הנה בדיוק מה קורה איתכם — עם הכסף שלכם, הטיסה, הדירה והסקי פס —
              אם יקרה שוב מצב חריג כמו שהיה עם איראן.
            </p>
            <ul className="flex flex-wrap gap-2 mt-1">
              {["מענה אישי וזמין", "עזרה מיידית במציאת פתרונות", "החזר בהתאם למה שמתקבל"].map(t => (
                <li key={t} className="inline-flex items-center gap-2 bg-white border border-line rounded-full px-3.5 py-1.5 text-[14px] md:text-[15px] font-medium text-ink">
                  <span className="text-ok"><IcoCheck size={16} /></span>{t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <div className={`${wrap} py-10 md:py-14 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start`}>
        <main className="flex-1 min-w-0 max-w-[820px] flex flex-col gap-5">
          {/* Disclaimer */}
          <section className="rounded-card border border-warn/25 bg-warn-soft p-5 sm:p-7">
            <div className="flex items-start gap-4 sm:gap-5">
              <span className="w-12 h-12 rounded-2xl bg-white text-warn shrink-0 flex items-center justify-center"><IcoInfo /></span>
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-bold text-warn mb-1 block">כנות ושקיפות מלאה</span>
                <h2 className="font-display text-[21px] md:text-[23px] font-bold text-ink mb-3">הבהרה חשובה בנוגע לאופי השירות ולמדיניות הספקים</h2>
                <div className="text-body text-[16px] md:text-[17px] leading-[1.75] flex flex-col gap-3">
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

          <PolicyCard id="flights" icon={<IcoPlane />} title="טיסות" badge="שקיפות מלאה בהחזר">
            <p>
              במקרה של ביטול טיסה או שינוי המזכה בהחזר מצד חברת התעופה, כל סכום שיוחזר אלינו על ידי
              חברת התעופה יועבר ללקוח בהתאם לסכום שהתקבל בפועל.
            </p>
            <p>
              במקרים שבהם ההחזר מתבצע ישירות על ידי חברת התעופה ללקוח, ההחזר יתקבל ישירות מול
              החברה ובהתאם למדיניותה.
            </p>
            <p>אנו כמובן נסייע ככל שניתן בהתנהלות מול חברת התעופה ובבירור סטטוס ההחזר.</p>
          </PolicyCard>

          <PolicyCard id="stay" icon={<IcoHome />} title="דירות ואירוח" badge="עוזרים לצמצם נזק">
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
          </PolicyCard>

          <PolicyCard id="pass" icon={<IcoTicket />} title="סקי פס" badge="לא חויבתם? לא שילמתם">
            <p>כל עוד הסקי פס טרם הוזמן ושולם בפועל מול הספק, הלקוח לא יחויב בגינו.</p>
            <p>
              ככל האפשר, נעדכן אתכם מראש לפני ביצוע רכישת הסקי פס, כדי שתדעו מתי ההזמנה הופכת
              למחויבות מול הספק.
            </p>
            <p>לאחר ביצוע הרכישה, תנאי הביטול וההחזר יהיו בהתאם למדיניות חברת הסקי פס.</p>
          </PolicyCard>

          <PolicyCard id="during" icon={<IcoUsers />} title="מקרה שבו כבר נמצאים בחופשה" badge="לא עוזבים אתכם לבד">
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
          </PolicyCard>

          {/* Reassurance */}
          <div className="rounded-card bg-ok-soft border border-ok/20 p-5 sm:p-7 flex items-start gap-4 sm:gap-5">
            <span className="w-12 h-12 rounded-2xl bg-white text-ok flex items-center justify-center shrink-0"><IcoCheck size={22} /></span>
            <div className="text-[16px] md:text-[17px] text-body leading-[1.75] flex flex-col gap-3">
              <p><strong className="text-ok-text font-bold block mb-0.5">ניסיון מאירועים קודמים:</strong>
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
          <div className="bg-ink text-white rounded-card p-6 sm:p-8 flex flex-col gap-3 text-[16px] md:text-[17px] leading-[1.75]">
            <p className="text-[#D6DEEA]">
              <strong className="text-white font-bold">לסיכום:</strong>{" "}אין באפשרותנו לשלוט בהחלטות של חברות
              התעופה, בעלי הדירות, אתרי הסקי או יתר הספקים בחו&quot;ל.
            </p>
            <p className="text-[#D6DEEA]">
              מה שאנחנו כן יכולים להתחייב אליו הוא לפעול בשקיפות מלאה, לעדכן אתכם בכל מידע מהותי,
              להעביר אליכם כל החזר שיתקבל עבורכם ולסייע ככל האפשר במציאת פתרונות במקרה של שינוי
              או אירוע בלתי צפוי.
            </p>
            <p className="text-[#D6DEEA]">
              המטרה שלנו היא שתדעו מראש בדיוק מה תנאי ההזמנה, ושגם במקרה של מצב חריג יהיה לכם מול
              מי להתנהל ולקבל סיוע.
            </p>
          </div>

          {/* Insurance comparison */}
          <section id="insurance" className={`${card} p-5 sm:p-8`}>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-accent"><IcoShield size={22} /></span>
              <h2 className="font-display text-[21px] md:text-[23px] font-bold text-ink">רוצים שקט נפשי מוחלט?</h2>
            </div>
            <p className="text-[16px] text-muted mb-5">אפשר לבחור את זה בשלב ההזמנה.</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-[18px] border border-line p-5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-ink text-[16px]">ללא ביטוח ביטול</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-soft text-muted text-[13px] font-bold">ברירת מחדל</span>
                </div>
                <div className="font-display text-[28px] font-extrabold text-ink"><span dir="ltr">−€50</span> <span className="text-[14px] font-medium text-muted">חיסכון</span></div>
                <p className="text-[15px] text-body leading-relaxed">
                  <strong className="text-ink">לא תקבלו החזר כספי כלל</strong> במקרה של ביטול או מצב חריג.
                </p>
              </div>

              <div className="rounded-[18px] border-2 border-accent bg-accent-soft/40 p-5 flex flex-col gap-2 relative">
                <span className="absolute -top-3 right-4 bg-accent text-white text-[12px] font-bold px-3 py-1 rounded-full">מומלץ</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink text-[16px]">עם ביטוח ביטול</span>
                  <span className="text-ok"><IcoCheck size={16} /></span>
                </div>
                <div className="font-display text-[28px] font-extrabold text-accent"><span dir="ltr">+€100</span> <span className="text-[14px] font-medium text-muted">לאדם</span></div>
                <p className="text-[15px] text-body leading-relaxed">
                  <strong className="text-ink">החזר מלא מובטח</strong>{" "}במקרה של מצב חריג — גם אם הספקים בחו&quot;ל לא יחזירו.
                </p>
              </div>
            </div>
            <p className="text-[14px] text-muted mt-4">אם לא בטוחים מה מתאים לכם, פשוט תשאלו אותנו.</p>
          </section>

          {/* CTA */}
          <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${btn.primaryLg} w-full`}>
            <IcoWhatsApp /> יש לי שאלה — דברו איתנו
          </a>

          <p className="text-[14px] text-muted text-center pt-1 leading-relaxed">
            העמוד הזה משלים את <Link href="/terms" className="text-accent font-bold hover:text-accent-hover">התקנון ומדיניות הביטולים</Link> הרגילה,
            ומתייחס במיוחד למקרים חריגים של מלחמה, ביטולי טיסות המוניים או כוח עליון.
          </p>
        </main>

        {/* On this page (desktop) */}
        <aside aria-label="בעמוד הזה" className="hidden lg:block w-[300px] shrink-0 sticky top-[96px]">
          <div className={`${card} p-5 flex flex-col gap-4`}>
            <div>
              <p className="font-bold text-[15px] text-ink mb-2">בעמוד הזה</p>
              <nav className="flex flex-col">
                {TOPICS.map(t => (
                  <a key={t.id} href={`#${t.id}`} className="py-2 text-[15px] text-body hover:text-accent border-b border-line last:border-0 transition-colors">{t.title}</a>
                ))}
              </nav>
            </div>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${btn.outline} w-full`}>
              <span className="text-[#128C4B]"><IcoWhatsApp size={18} /></span> שאלה? וואטסאפ
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
