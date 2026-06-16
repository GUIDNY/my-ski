export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-sm text-blue-600 hover:underline">→ חזור לעמוד הבית</a>

        <h1 className="text-3xl font-black text-gray-900 mt-6 mb-2">מדיניות ביטול</h1>
        <p className="text-gray-500 mb-10">עדכון אחרון: ינואר 2026</p>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-3">מדיניות לא ניתן לביטול</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-red-400 font-bold mt-0.5">✗</span>אין החזר כספי בכל מקרה לאחר ביצוע ההזמנה</li>
              <li className="flex gap-2"><span className="text-red-400 font-bold mt-0.5">✗</span>לא ניתן לשנות תאריכים לאחר ההזמנה</li>
              <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span>מחיר מוזל — ללא תוספת ביטול</li>
              <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span>בכוח עליון (מלחמה, אסון טבע) — בחינה פרטנית</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-black text-gray-900">מדיניות גמישה</h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">+€100/אדם</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span>ביטול עד 48 שעות לפני הגעה — 80% החזר</li>
              <li className="flex gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span>שינוי תאריכים בתשלום הפרש מחיר בלבד</li>
              <li className="flex gap-2"><span className="text-red-400 font-bold mt-0.5">✗</span>ביטול פחות מ-48 שעות לפני — אין החזר</li>
              <li className="flex gap-2"><span className="text-red-400 font-bold mt-0.5">✗</span>לא ניתן לשלב עם שירות AI בלבד</li>
            </ul>
          </div>

          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 text-sm text-amber-800">
            <div className="font-bold mb-1">הערה חשובה</div>
            מדיניות ביטול גמישה כוללת שירות אנושי מלא — לא ניתן לשלבה עם שירות AI בלבד. לשאלות נוספות: skishareteam@gmail.com
          </div>
        </div>
      </div>
    </div>
  );
}
