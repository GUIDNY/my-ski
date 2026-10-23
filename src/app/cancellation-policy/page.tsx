import LegalShell from "@/components/LegalShell";

export const metadata = { title: "מדיניות ביטול — SkiShare" };

const Yes = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F7A4F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-label="כן" role="img" className="shrink-0 mt-[5px]"><path d="M5 12l4 4 10-10" /></svg>
);
const No = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B42318" strokeWidth="2.4" strokeLinecap="round" aria-label="לא" role="img" className="shrink-0 mt-[5px]"><path d="M6 6l12 12M18 6L6 18" /></svg>
);

function Item({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <li className="flex gap-2.5">{ok ? <Yes /> : <No />}<span>{children}</span></li>;
}

export default function CancellationPolicy() {
  return (
    <LegalShell title="מדיניות ביטול" updated="ינואר 2026">
      <div className="flex flex-col gap-5">
        <section className="rounded-card border border-line bg-white p-5 md:p-6">
          <h2 className="font-display text-[21px] md:text-[23px] font-bold text-ink mb-3">מדיניות לא ניתן לביטול</h2>
          <ul className="flex flex-col gap-2 text-[16px] text-body">
            <Item ok={false}>אין החזר כספי בכל מקרה לאחר ביצוע ההזמנה</Item>
            <Item ok={false}>לא ניתן לשנות תאריכים לאחר ההזמנה</Item>
            <Item ok>מחיר מוזל — ללא תוספת ביטול</Item>
            <Item ok>בכוח עליון (מלחמה, אסון טבע) — בחינה פרטנית</Item>
          </ul>
        </section>

        <section className="rounded-card border-2 border-ok/40 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h2 className="font-display text-[21px] md:text-[23px] font-bold text-ink">מדיניות גמישה</h2>
            <span className="text-[13px] bg-ok-soft text-ok-text px-2.5 py-0.5 rounded-full font-bold"><span dir="ltr">+€100</span>/אדם</span>
          </div>
          <ul className="flex flex-col gap-2 text-[16px] text-body">
            <Item ok>ביטול עד 48 שעות לפני הגעה — 80% החזר</Item>
            <Item ok>שינוי תאריכים בתשלום הפרש מחיר בלבד</Item>
            <Item ok={false}>ביטול פחות מ-48 שעות לפני — אין החזר</Item>
            <Item ok={false}>לא ניתן לשלב עם שירות AI בלבד</Item>
          </ul>
        </section>

        <div className="rounded-card bg-warn-soft border border-warn/25 p-5 text-[15px] md:text-[16px] text-body">
          <div className="font-bold text-warn mb-1">הערה חשובה</div>
          מדיניות ביטול גמישה כוללת שירות אנושי מלא — לא ניתן לשלבה עם שירות AI בלבד. לשאלות נוספות: <a href="mailto:skishareteam@gmail.com">skishareteam@gmail.com</a>
        </div>
      </div>
    </LegalShell>
  );
}
