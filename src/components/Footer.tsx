import Link from "next/link";
import OpenChatButton from "@/components/OpenChatButton";
import { Brand } from "@/components/SiteHeader";
import { helperWaHref } from "@/lib/helper-whatsapp";

const VACATION = [
  { label: "חבילות", href: "/search?deal=full" },
  { label: "דירות בואל טורנס", href: "/apartments" },
  { label: "דירות שבת עד שבת", href: "/weekly" },
  { label: "הסעות לואל טורנס", href: "/transfers" },
  { label: "סיזיונרים", href: "/seasonaires" },
];

// planning the trip: the guides people look for before booking
const PLAN = [
  { label: "המדריך לואל טורנס", href: "/guide" },
  { label: "סקי פס ואל טורנס: מחירים", href: "/guide/מחיר-סקי-פס-ואל-טורנס" },
  { label: "איך מגיעים לואל טורנס", href: "/guide/איך-מגיעים-לואל-טורנס-מישראל" },
  { label: "מתי לנסוע לואל טורנס", href: "/guide/מתי-לנסוע-לואל-טורנס" },
  { label: "ואל טורנס, מריבל או קורשבל", href: "/guide/ואל-טורנס-מול-קורשבל-ומריבל" },
];

const INFO = [
  { label: "תקנון, הזמנות וביטולים", href: "/terms" },
  { label: "מצב חירום, מלחמה וכוח עליון", href: "/emergency-policy" },
  { label: "מדיניות פרטיות", href: "/privacy" },
  { label: "מדיניות עוגיות", href: "/cookies" },
  { label: "הצהרת נגישות", href: "/accessibility" },
  { label: "מחיקת חשבון", href: "/delete-account" },
];

const linkCls = "text-[15px] text-body hover:text-ink transition-colors";

export default function Footer() {
  return (
    <footer className="bg-soft border-t border-line mt-auto" dir="rtl">
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 pt-12 md:pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-10">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <Link href="/" aria-label="SkiShare, לדף הבית" className="w-fit"><Brand small /></Link>
            <p className="text-[15px] leading-relaxed text-muted max-w-[300px]">
              חופשות סקי בואל טורנס: דירה, סקי פס, הסעה וציוד במקום אחד.
            </p>
          </div>

          <nav aria-label="חופשה" className="flex flex-col gap-2.5">
            <span className="font-bold text-[15px] text-ink mb-1">חופשה</span>
            {VACATION.map(i => <Link key={i.href} href={i.href} className={linkCls}>{i.label}</Link>)}
          </nav>

          <nav aria-label="תכנון החופשה" className="flex flex-col gap-2.5">
            <span className="font-bold text-[15px] text-ink mb-1">תכנון החופשה</span>
            {PLAN.map(i => <Link key={i.href} href={i.href} className={linkCls}>{i.label}</Link>)}
          </nav>

          <nav aria-label="מידע" className="flex flex-col gap-2.5">
            <span className="font-bold text-[15px] text-ink mb-1">מידע</span>
            {INFO.map(i => <Link key={i.href} href={i.href} className={linkCls}>{i.label}</Link>)}
          </nav>

          <div className="col-span-2 md:col-span-1 flex flex-col gap-2.5">
            <span className="font-bold text-[15px] text-ink mb-1">דברו איתנו</span>
            <a href={helperWaHref()} target="_blank" rel="noopener noreferrer" className={linkCls}>וואטסאפ</a>
            <OpenChatButton className={`${linkCls} text-start w-fit`}>צ&apos;אט באתר</OpenChatButton>
            <a href="mailto:skishareteam@gmail.com" className={linkCls}>skishareteam@gmail.com</a>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-line flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[14px] text-muted">
          <span>© 2026 SkiShare · סקי שר בע״מ</span>
          <span>ישראל · צרפת</span>
        </div>
      </div>
    </footer>
  );
}
