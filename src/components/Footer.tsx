export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 pt-16 pb-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-lg">⛷</div>
              <span className="text-white text-xl font-black">MySki</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              חופשת הסקי המושלמת ב-Val Thorens — בנה את החבילה שלך בדיוק כמו שרצית.
            </p>
            <div className="flex gap-3 mt-5">
              {["📘", "📸", "💬"].map((icon, i) => (
                <button key={i} className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm transition-colors">
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Destination */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">יעד</h4>
            <ul className="space-y-2.5 text-sm">
              {["Val Thorens", "מפת האתר", "תנאי שלג", "רמות מסלולים", "מגבלות גיל"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">שירותים</h4>
            <ul className="space-y-2.5 text-sm">
              {["דירות", "סקי פס", "הסעות", "טיסות", "ביטוח נסיעות"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">תמיכה</h4>
            <ul className="space-y-2.5 text-sm">
              {["צור קשר", "שאלות נפוצות", "מדיניות ביטול", "תנאי שימוש", "פרטיות"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
            <div className="mt-5 p-3 rounded-xl bg-gray-900 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">שירות לקוחות</p>
              <p className="text-white font-bold text-sm">📞 +972-50-000-0000</p>
              <p className="text-gray-500 text-xs mt-0.5">א׳–ה׳ 9:00–18:00</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">© 2026 MySki. כל הזכויות שמורות.</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">תשלום מאובטח</span>
            {["💳", "🔒", "✅"].map((icon, i) => (
              <span key={i} className="text-sm">{icon}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
