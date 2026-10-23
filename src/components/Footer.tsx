import Link from "next/link";
import OpenChatButton from "@/components/OpenChatButton";
import { Brand } from "@/components/SiteHeader";
import { helperWaHref } from "@/lib/helper-whatsapp";
import FooterLangLinks from "@/components/FooterLangLinks";
import { SOCIAL } from "@/lib/site";

const VACATION = [
  { label: "חבילות סקי לואל טורנס", href: "/packages" },
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
  { label: "מזג אוויר ושלג בואל טורנס", href: "/guide/מזג-אוויר-ושלג-בואל-טורנס" },
  { label: "סקי בחנוכה", href: "/guide/חופשת-סקי-בחנוכה" },
  { label: "סקי בפסח", href: "/guide/חופשת-סקי-בפסח" },
  { label: "חופשת סקי לקבוצות", href: "/guide/חופשת-סקי-לקבוצות-בואל-טורנס" },
  { label: "חופשת סקי זולה", href: "/guide/חופשת-סקי-זולה" },
  { label: "איפה לגור בואל טורנס", href: "/guide/איפה-לגור-בואל-טורנס" },
  { label: "חופשת סקי ראשונה", href: "/guide/חופשת-סקי-ראשונה" },
  { label: "מה לארוז לחופשת סקי", href: "/guide/מה-לארוז-לחופשת-סקי" },
  { label: "ואל טורנס, מריבל או קורשבל", href: "/guide/ואל-טורנס-מול-קורשבל-ומריבל" },
];

const INFO = [
  { label: "אודות SkiShare", href: "/about" },
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
            {/* Hebrew addresses percent-encoded, as Google recommends for links */}
            {PLAN.map(i => <Link key={i.href} href={encodeURI(i.href)} className={linkCls}>{i.label}</Link>)}
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
            <a href={SOCIAL.instagram} target="_blank" rel="noopener me" className={linkCls}>אינסטגרם</a>
            <a href={SOCIAL.facebook} target="_blank" rel="noopener me" className={linkCls}>פייסבוק</a>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-line flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[14px] text-muted">
          <span>© 2026 SkiShare · סקי שר בע״מ</span>
          <span className="flex flex-wrap items-center gap-x-4">
            <span>ישראל · צרפת</span>
            {/* the English and French site: plain links (a full page load), it has its own frame */}
            <FooterLangLinks />
          </span>
        </div>
      </div>
    </footer>
  );
}
