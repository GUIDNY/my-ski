import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100" dir="rtl">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo className="h-11 mb-4" />
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              מובילים את תרבות חופשות הסקי בישראל עם סטנדרטים בינלאומיים של שירות ואיכות.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h5 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-6">מידע ותקנון</h5>
            <ul className="flex flex-col gap-3.5">
              {[
                { label: "תקנון, הזמנות וביטולים", href: "/terms" },
                { label: "מדיניות פרטיות", href: "/privacy" },
                { label: "מדיניות עוגיות", href: "/cookies" },
                { label: "הצהרת נגישות", href: "/accessibility" },
                { label: "מחיקת חשבון", href: "/delete-account" },
                { label: "צור קשר", href: "mailto:skishareteam@gmail.com" },
              ].map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow */}
          <div>
            <h5 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-6">Follow Us</h5>
            <div className="flex gap-3">
              {[
                <svg key="w" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
                <svg key="y" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
                <svg key="i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
              ].map((icon, i) => (
                <button key={i} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white transition-all">
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400">
            © 2026 SKISHARE. ALL RIGHTS RESERVED.
          </span>
          <div className="flex gap-6">
            <span className="text-xs text-gray-400">Alpine Zen — Design System</span>
            <span className="text-xs text-gray-400">Israel | France | Switzerland</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
