import { pageMeta } from "@/lib/page-meta";
import { wrap, h1, h2 } from "@/components/ui";
import { GEAR_SHOP } from "@/lib/gear";
import EquipmentClient from "./EquipmentClient";

export const metadata = pageMeta({
  title: "השכרת ציוד סקי וסנובורד בואל טורנס | SkiShare",
  description: "סקי או סנובורד כולל נעליים בואל טורנס: €30 ליום, €120 לשבוע. מזמינים באתר, והציוד מחכה לכם מוכן ב-Caron Skishop.",
  path: "/equipment",
});

/* Equipment rental on its own, open to anyone in Val Thorens (EquipmentClient) */
export default function EquipmentPage() {
  return (
    <div dir="rtl" className="bg-[#F7FAFD] min-h-screen">
      <header className={`${wrap} pt-10 md:pt-14 pb-8 md:pb-10 flex flex-col gap-3`}>
        <span className="sticker self-start text-[14px]">🏂 סקי או סנובורד? אנחנו לא שופטים</span>
        <h1 className={h1}>השכרת ציוד בואל טורנס</h1>
        <div className="flex items-center gap-3 text-[15px] text-muted">
          <span>בשיתוף</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/caron-skishop.svg" alt="Caron Skishop" width={200} height={40} className="h-[40px] w-auto" />
        </div>
        <p className="text-[17px] md:text-[19px] text-body max-w-[720px] leading-relaxed">
          מגלשיים או סנובורד, כולל נעליים. מזמינים פה, והציוד מחכה לכם מוכן ב-Caron Skishop בכפר. מגיעים, מראים את מייל ההזמנה, ויוצאים לגלוש. פתוח לכל מי שבואל טורנס, גם אם אתם לא גרים אצלנו.
        </p>
      </header>
      <EquipmentClient />

      {/* the shop we work with, in its own words and photos (Caron are our partners) */}
      <section className="bg-peaks">
        <div className={`${wrap} py-12 md:py-16 grid md:grid-cols-[1fr_1fr] gap-8 md:gap-12 items-center`}>
          <div className="flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/caron-skishop.svg" alt="Caron Skishop" width={220} height={44} className="h-[44px] w-auto self-start" />
            <h2 className={h2}>החנות שלנו בכפר</h2>
            <p className="text-[16px] md:text-[17px] leading-[1.7] text-body">
              Caron Skishop היא חנות עצמאית בלב ואל טורנס, שמתמחה בפרירייד ופריסטייל. ציוד איכותי במחיר טוב, בחבילות הפרימיום מגלשיים וסנובורדים חדשים מהעונה, וצוות שבאמת עוזר לבחור. אנחנו עובדים איתם בשותפות, וכל מה שהזמנתם אצלנו מחכה לכם שם מוכן.
            </p>
            <ul className="flex flex-col gap-1.5 text-[15px] text-ink">
              <li>⭐ 4.7 בגוגל, יותר מ-160 ביקורות</li>
              <li>📍 <span dir="ltr">{GEAR_SHOP.address}</span></li>
              <li>🎿 סקי, סנובורד, נעליים וקסדות</li>
            </ul>
            <a href={GEAR_SHOP.maps} target="_blank" rel="noopener noreferrer" className="font-bold text-accent hover:text-accent-hover self-start">לחנות במפה ←</a>
          </div>
          <div className="flex flex-col gap-5">
            <div className="polaroid tilt-r flex flex-col gap-3 py-5 px-4">
              {["ski-head-primal.jpg", "ski-head-rev.jpg", "ski-premium.jpg", "ski-rossignol-pursuit.jpg", "ski-rossignol-unique.jpg"].map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f} src={`/caron/${f}`} alt="מגלשיים להשכרה ב-Caron Skishop" loading="lazy" className="w-full h-auto transition-transform duration-500 hover:translate-x-2" style={{ transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }} />
              ))}
              <p className="text-[12px] text-muted text-center">דוגמאות מהציוד בחנות. התמונות להמחשה.</p>
            </div>
            <div className="flex items-center justify-center gap-6 md:gap-8 opacity-70">
              {["volkl.png", "faction.png", "nitro.png"].map(f => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f} src={`/caron/${f}`} alt={f.replace(".png", "")} loading="lazy" className="h-6 md:h-7 w-auto" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
