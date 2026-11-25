import { pageMeta } from "@/lib/page-meta";
import { wrap, h1, h2 } from "@/components/ui";
import { GEAR_SHOP } from "@/lib/gear";
import { IconSnowboard, IconBoot, IconPin, IconStar, IconSkiPair } from "@/components/GearIcons";
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
        <span className="sticker self-start text-[14px]">סקי או סנובורד? אנחנו לא שופטים</span>
        <h1 className={h1}>השכרת ציוד בואל טורנס</h1>
        <div className="flex items-center gap-3 text-[15px] text-muted">
          <span>בשיתוף</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/caron-skishop.svg" alt="Caron Skishop" width={200} height={40} className="h-[40px] w-auto" />
        </div>
        <div className="flex flex-wrap items-end gap-x-10 gap-y-5 mt-1">
          <p className="flex-[1_1_420px] text-[17px] md:text-[19px] text-body leading-relaxed">
            הציוד מחכה לכם על ההר. מזמינים פה, אוספים מוכן ב-Caron Skishop בכפר, מראים את מייל ההזמנה ויוצאים לגלוש. לא חייבים לגור אצלנו כדי ליהנות מהמחיר.
          </p>
          <div className="flex items-center gap-5 bg-white border border-line rounded-[20px] px-5 py-4 shadow-[0_10px_30px_rgba(11,27,51,0.06)]">
            <div>
              <div className="font-display font-extrabold text-[40px] leading-none text-ink">€120</div>
              <div className="text-[14px] text-muted mt-1">ל-6 ימי גלישה, לגולש</div>
            </div>
            <ul className="flex flex-col gap-1 text-[14px] text-ink">
              <li>✓ נעליים כלולות</li>
              <li>✓ מזמינים מראש, אוספים בכפר</li>
              <li>✓ אפשר לשלם אחר כך</li>
            </ul>
          </div>
        </div>
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
              <li className="flex items-center gap-2"><IconStar /> 4.7 בגוגל, יותר מ-160 ביקורות</li>
              <li className="flex items-center gap-2"><IconPin size={18} className="text-muted shrink-0" /> <span dir="ltr">{GEAR_SHOP.address}</span></li>
              <li className="flex items-center gap-2"><IconSkiPair size={18} className="text-muted shrink-0" /> סקי, סנובורד, נעליים וקסדות</li>
            </ul>
            <a href={GEAR_SHOP.maps} target="_blank" rel="noopener noreferrer" className="font-bold text-accent hover:text-accent-hover self-start">לחנות במפה ←</a>
          </div>
          <div className="flex flex-col gap-5">
            <div className="polaroid tilt-r flex flex-col gap-3 py-5 px-4">
              {["ski-head-primal.jpg", "ski-head-rev.jpg", "ski-premium.jpg", "ski-rossignol-pursuit.jpg", "ski-rossignol-unique.jpg"].map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f} src={`/caron/${f}`} alt="מגלשיים להשכרה ב-Caron Skishop" loading="lazy" className="w-full h-auto transition-transform duration-500 hover:translate-x-2" style={{ transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)` }} />
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 md:gap-8 opacity-70">
              {["volkl.png", "faction.png", "nitro.png"].map(f => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f} src={`/caron/${f}`} alt={f.replace(".png", "")} loading="lazy" className="h-6 md:h-7 w-auto" />
              ))}
            </div>
          </div>
        </div>

        {/* more of the shop's gear: snowboards and boots */}
        <div className={`${wrap} pb-14 md:pb-20 flex flex-col gap-8`}>
          <div className="flex flex-col gap-3">
            <h3 className="font-display font-bold text-[20px] md:text-[22px] text-ink flex items-center gap-2"><IconSnowboard size={24} className="text-accent" /> סנובורדים</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {["board-classic-2.jpg", "board-classic-3.jpg", "board-classic-4.jpg", "board-premium-1.jpg", "board-premium-2.jpg", "board-premium-3.jpg"].map((f, i) => (
                <div key={f} className="bg-white rounded-[16px] border border-line p-3 shadow-[0_8px_24px_rgba(11,27,51,0.06)] transition-transform duration-300 hover:-translate-y-1 hover:rotate-[-1deg]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/caron/${f}`} alt={i < 3 ? "סנובורד קלאסי להשכרה" : "סנובורד פרימיום להשכרה"} loading="lazy" className="w-full h-auto" />
                  <div className="text-[13px] font-bold text-muted mt-1.5">{i < 3 ? "קלאסי" : "פרימיום"}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-display font-bold text-[20px] md:text-[22px] text-ink flex items-center gap-2"><IconBoot size={24} className="text-accent" /> נעליים, כלולות במחיר</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {["boots-premium.jpg", "boots-edge.jpg"].map(f => (
                <div key={f} className="bg-white rounded-[16px] border border-line p-4 flex items-center justify-center shadow-[0_8px_24px_rgba(11,27,51,0.06)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/caron/${f}`} alt="נעלי סקי להשכרה ב-Caron Skishop" loading="lazy" className="max-h-[170px] w-auto" />
                </div>
              ))}
            </div>
          </div>
          <p className="text-[12px] text-muted">דוגמאות מהציוד בחנות. התמונות להמחשה, והציוד בפועל לפי המלאי והמידות שלכם.</p>
        </div>
      </section>
    </div>
  );
}
