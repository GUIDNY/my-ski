"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";

const KEY = "skishare_cookie_consent";
const CHANGED = "skishare:cookie-consent";

// Read from localStorage only in the browser (the server renders nothing).
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGED, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(CHANGED, cb); };
};
const notAnswered = () => { try { return !localStorage.getItem(KEY); } catch { return false; } };

export default function CookieConsent() {
  const show = useSyncExternalStore(subscribe, notAnswered, () => false);

  const accept = () => {
    try { localStorage.setItem(KEY, "1"); } catch {}
    window.dispatchEvent(new Event(CHANGED));
  };

  if (!show) return null;

  return (
    <div dir="rtl" role="region" aria-label="עוגיות"
      className="fixed inset-x-3 bottom-3 md:inset-x-auto md:left-6 md:bottom-6 md:max-w-[380px] z-[65]
                 bg-white rounded-2xl border border-line p-4 md:p-5"
      style={{ boxShadow: "0 16px 40px rgba(11,27,51,0.16)" }}>
      <p className="text-[14px] md:text-[15px] text-body leading-relaxed">
        אנחנו משתמשים בעוגיות (Cookies) כדי שהאתר יעבוד וכדי לשפר אותו.
        בהמשך השימוש באתר אתם מסכימים ל<Link href="/cookies" className="text-accent font-bold">מדיניות העוגיות</Link>.
      </p>
      <div className="flex gap-2 mt-3">
        <button onClick={accept}
          className="flex-1 min-h-[44px] bg-accent hover:bg-accent-hover text-white text-[15px] font-bold rounded-xl transition-colors">
          מאשרים
        </button>
        <Link href="/privacy"
          className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl border border-line-strong text-ink text-[15px] font-bold hover:border-ink transition-colors">
          פרטים
        </Link>
      </div>
    </div>
  );
}
