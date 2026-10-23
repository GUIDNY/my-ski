"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const KEY = "skishare_cookie_consent";
const CHANGED = "skishare:cookie-consent";

// Read from localStorage only in the browser (the server renders nothing).
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGED, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(CHANGED, cb); };
};
const notAnswered = () => { try { return !localStorage.getItem(KEY); } catch { return false; } };
const remember = () => {
  try { localStorage.setItem(KEY, "1"); } catch {}
  window.dispatchEvent(new Event(CHANGED));
};

/*
 * A slim strip under the site header (not at the bottom, where it covered the
 * phone booking bars and the price summaries). The notice says that using the
 * site means agreeing, so moving on to another page counts as agreeing and
 * the strip goes away.
 */
export default function CookieConsent() {
  const show = useSyncExternalStore(subscribe, notAnswered, () => false);
  const pathname = usePathname();
  const first = useRef<string | null>(null);

  useEffect(() => {
    if (first.current === null) { first.current = pathname; return; }
    if (pathname !== first.current && notAnswered()) remember();
  }, [pathname]);

  // /en and /fr show their own notice (components/intl/IntlCookieNotice.tsx)
  if (!show || ["/admin", "/en", "/fr"].some(h => pathname === h || pathname?.startsWith(h + "/"))) return null;

  return (
    <div dir="rtl" role="region" aria-label="עוגיות"
      className="fixed inset-x-0 top-[60px] md:top-[76px] z-[45] bg-white/95 backdrop-blur border-b border-line"
      style={{ boxShadow: "0 8px 24px rgba(11,27,51,0.08)" }}>
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-2.5 flex items-center gap-3">
        <p className="flex-1 min-w-0 text-[13px] md:text-[14px] text-body leading-snug">
          <span className="md:hidden">האתר משתמש בעוגיות. <Link href="/cookies" className="text-accent font-bold">פרטים</Link></span>
          <span className="hidden md:inline">אנחנו משתמשים בעוגיות כדי שהאתר יעבוד. בהמשך השימוש אתם מסכימים ל<Link href="/cookies" className="text-accent font-bold">מדיניות העוגיות</Link>.</span>
        </p>
        <button onClick={remember}
          className="shrink-0 min-h-[40px] px-4 bg-accent hover:bg-accent-hover text-white text-[14px] font-bold rounded-xl transition-colors">
          מאשרים
        </button>
      </div>
    </div>
  );
}
