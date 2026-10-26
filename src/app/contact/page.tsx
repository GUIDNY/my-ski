import LegalShell, { H2 } from "@/components/LegalShell";
import { pageMeta } from "@/lib/page-meta";

export const metadata = pageMeta({
  title: "צור קשר | SkiShare",
  description: "יצירת קשר עם SkiShare (סקי שר בע״מ): טלפון, וואטסאפ ודוא״ל, וכתובת המשרד בקיסריה.",
  path: "/contact",
});

const row = "flex flex-col gap-0.5 rounded-2xl border border-line bg-white p-4 md:p-5";

export default function ContactPage() {
  return (
    <LegalShell title="צור קשר" updated="אוקטובר 2026">
      <p>
        SkiShare (סקי שר בע״מ) היא חברה ישראלית להשכרת דירות וחופשות סקי בואל טורנס, צרפת. אפשר לפנות אלינו
        בכל שאלה על הזמנה, תשלום, ביטול או החופשה עצמה, באחת הדרכים האלה:
      </p>
      <div className="grid gap-3 sm:grid-cols-2 not-prose">
        <div className={row}>
          <span className="text-[14px] text-muted">טלפון</span>
          <a href="tel:+972547701899" dir="ltr" className="text-[18px] self-start">054-7701899</a>
        </div>
        <div className={row}>
          <span className="text-[14px] text-muted">וואטסאפ</span>
          <a href="https://wa.me/972555174903" target="_blank" rel="noopener noreferrer" dir="ltr" className="text-[18px] self-start">055-517-4903</a>
        </div>
        <div className={row}>
          <span className="text-[14px] text-muted">דוא״ל</span>
          <a href="mailto:skishareteam@gmail.com" className="text-[18px] self-start">skishareteam@gmail.com</a>
        </div>
        <div className={row}>
          <span className="text-[14px] text-muted">כתובת</span>
          <span className="text-[18px] text-ink font-bold">הזוהר 12, קיסריה</span>
        </div>
      </div>

      <H2>פניות בנושא הזמנה קיימת</H2>
      <p>כדי שנוכל לעזור מהר, ציינו את מספר ההזמנה או את השם שעליו ההזמנה. לביטול הזמנה אפשר לפנות בוואטסאפ או בדוא״ל, ופרטי הביטול וההחזר מופיעים ב<a href="/terms">תקנון</a>.</p>
      <p>בצ׳אט ובוואטסאפ עונה גם עוזר דיגיטלי (AI), ובכל רגע אפשר לבקש לדבר עם נציג.</p>
    </LegalShell>
  );
}
