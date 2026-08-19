export default function CancellationPolicy() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "var(--ivory)" }} dir="rtl">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-sm transition-colors hover:text-[var(--gold-deep)]" style={{ color: "var(--stone)" }}>→ חזור לעמוד הבית</a>

        <span className="eyebrow block mt-8 mb-3">מסמך משפטי</span>
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2" style={{ color: "var(--charcoal)" }}>מדיניות ביטול</h1>
        <p className="mb-10" style={{ color: "var(--stone-soft)" }}>עדכון אחרון: ינואר 2026</p>

        <div className="space-y-6">
          <div className="card-luxury p-6">
            <h2 className="font-display text-lg font-medium mb-3" style={{ color: "var(--charcoal)" }}>מדיניות לא ניתן לביטול</h2>
            <ul className="space-y-2 text-sm" style={{ color: "var(--stone)" }}>
              <li className="flex gap-2"><span className="font-bold mt-0.5" style={{ color: "#b0463c" }}>✗</span>אין החזר כספי בכל מקרה לאחר ביצוע ההזמנה</li>
              <li className="flex gap-2"><span className="font-bold mt-0.5" style={{ color: "#b0463c" }}>✗</span>לא ניתן לשנות תאריכים לאחר ההזמנה</li>
              <li className="flex gap-2"><span className="font-bold mt-0.5" style={{ color: "#6b8f5e" }}>✓</span>מחיר מוזל — ללא תוספת ביטול</li>
              <li className="flex gap-2"><span className="font-bold mt-0.5" style={{ color: "#6b8f5e" }}>✓</span>בכוח עליון (מלחמה, אסון טבע) — בחינה פרטנית</li>
            </ul>
          </div>

          <div className="card-luxury p-6" style={{ borderColor: "var(--gold-line)" }}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-display text-lg font-medium" style={{ color: "var(--charcoal)" }}>מדיניות גמישה</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "var(--gold-wash)", color: "var(--gold-deep)" }}>+€100/אדם</span>
            </div>
            <ul className="space-y-2 text-sm" style={{ color: "var(--stone)" }}>
              <li className="flex gap-2"><span className="font-bold mt-0.5" style={{ color: "#6b8f5e" }}>✓</span>ביטול עד 48 שעות לפני הגעה — 80% החזר</li>
              <li className="flex gap-2"><span className="font-bold mt-0.5" style={{ color: "#6b8f5e" }}>✓</span>שינוי תאריכים בתשלום הפרש מחיר בלבד</li>
              <li className="flex gap-2"><span className="font-bold mt-0.5" style={{ color: "#b0463c" }}>✗</span>ביטול פחות מ-48 שעות לפני — אין החזר</li>
              <li className="flex gap-2"><span className="font-bold mt-0.5" style={{ color: "#b0463c" }}>✗</span>לא ניתן לשלב עם שירות AI בלבד</li>
            </ul>
          </div>

          <div className="rounded p-5 text-sm" style={{ background: "var(--gold-wash)", border: "1px solid var(--gold-line)", color: "var(--charcoal)" }}>
            <div className="font-bold mb-1">הערה חשובה</div>
            מדיניות ביטול גמישה כוללת שירות אנושי מלא — לא ניתן לשלבה עם שירות AI בלבד. לשאלות נוספות: skishareteam@gmail.com
          </div>
        </div>
      </div>
    </div>
  );
}
