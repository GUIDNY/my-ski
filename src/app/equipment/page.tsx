import { pageMeta } from "@/lib/page-meta";
import { wrap, h1 } from "@/components/ui";
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
        <p className="text-[17px] md:text-[19px] text-body max-w-[720px] leading-relaxed">
          מגלשיים או סנובורד, כולל נעליים. מזמינים פה, והציוד מחכה לכם מוכן ב-Caron Skishop בכפר. מגיעים, מראים את מייל ההזמנה, ויוצאים לגלוש. פתוח לכל מי שבואל טורנס, גם אם אתם לא גרים אצלנו.
        </p>
      </header>
      <EquipmentClient />
    </div>
  );
}
