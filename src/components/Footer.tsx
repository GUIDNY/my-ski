import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer style={{ background: "var(--ink)", color: "var(--ivory)" }} dir="rtl">
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo className="h-10 mb-5" white />
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--stone-soft)" }}>
              מובילים את תרבות חופשות הסקי בישראל עם סטנדרטים בינלאומיים של שירות ואיכות.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h5 className="eyebrow eyebrow-light mb-6">מידע ותקנון</h5>
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
                  <a href={item.href} className="text-sm transition-colors hover:text-[var(--gold-light)]" style={{ color: "rgba(250,247,241,0.65)" }}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow */}
          <div>
            <h5 className="eyebrow eyebrow-light mb-6">Follow Us</h5>
            <div className="flex gap-3">
              {[
                <svg key="w" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
                <svg key="y" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
                <svg key="i" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
              ].map((icon, i) => (
                <button key={i} className="footer-social-btn">
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid var(--ink-line)" }}>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--stone-soft)" }}>
            © 2026 SKISHARE. ALL RIGHTS RESERVED.
          </span>
          <div className="flex gap-6">
            <span className="text-xs" style={{ color: "var(--stone-soft)" }}>Val Thorens · Alpine Concierge</span>
            <span className="text-xs" style={{ color: "var(--stone-soft)" }}>Israel | France | Switzerland</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
