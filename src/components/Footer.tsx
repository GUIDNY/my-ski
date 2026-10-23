import Logo from "@/components/Logo";
import OpenChatButton from "@/components/OpenChatButton";
import { helperWaHref } from "@/lib/helper-whatsapp";

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
                { label: "מדריך ואל טורנס", href: "/guide" },
                { label: "תקנון, הזמנות וביטולים", href: "/terms" },
                { label: "מצב חירום, מלחמה וכוח עליון", href: "/emergency-policy" },
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

          {/* Talk to us */}
          <div>
            <h5 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-6">דברו איתנו</h5>
            <ul className="flex flex-col gap-3.5">
              <li>
                <a href={helperWaHref()} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">וואטסאפ</a>
              </li>
              <li>
                <OpenChatButton className="text-sm text-gray-500 hover:text-gray-900 transition-colors">צ&apos;אט באתר</OpenChatButton>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold text-gray-400">© 2026 SkiShare. כל הזכויות שמורות.</span>
          <span className="text-xs text-gray-400">ישראל · צרפת</span>
        </div>
      </div>
    </footer>
  );
}
