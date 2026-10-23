"use client";
import { useState, useSyncExternalStore } from "react";

const APP_STORE_URL = "https://apps.apple.com/il/app/skishare/id6782095727?l=he";

// Promo banner on shared pages (a quote link opened in the phone's browser):
// "open in the app / download it". On iPhone the native Smart App Banner
// (apple-itunes-app meta, set on the quote pages) also shows OPEN when the
// app is installed; this banner is the cross-platform fallback.
const HIDDEN_EVT = "skishare:app-banner";
const subscribe = (cb: () => void) => { window.addEventListener(HIDDEN_EVT, cb); return () => window.removeEventListener(HIDDEN_EVT, cb); };
// never inside the app itself, and not after it was closed in this tab
const inApp = () => {
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return !!w.Capacitor?.isNativePlatform?.() || /skishare/i.test(navigator.userAgent);
};
const shouldShow = () => {
  if (inApp()) return false;
  try { return !sessionStorage.getItem("appBannerHidden"); } catch { return true; }
};

export default function OpenInAppBanner() {
  const show = useSyncExternalStore(subscribe, shouldShow, () => false);
  const [ask, setAsk] = useState(false);

  if (!show) return null;

  const hide = () => { try { sessionStorage.setItem("appBannerHidden", "1"); } catch {} window.dispatchEvent(new Event(HIDDEN_EVT)); };
  // Opens the installed app on this same page (skishare://open?path=...).
  // No automatic jump to the App Store: on iPhone the "open in SkiShare?"
  // question keeps the page visible, so a timer sent people who have the app
  // to the store. Without the app, "להורדה" is right next to it.
  const openApp = () => {
    const path = window.location.pathname + window.location.search;
    window.location.href = "skishare://open?path=" + encodeURIComponent(path);
  };

  return (
    <div dir="rtl" className="bg-soft border-b border-line md:hidden">
      <div className="max-w-[1240px] mx-auto px-4 py-2.5 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-512.png" alt="" className="w-9 h-9 rounded-xl shrink-0 border border-line" />
        {!ask ? (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-ink leading-tight">אפשר לראות את זה באפליקציה</p>
              <p className="text-[12px] text-muted leading-tight">SkiShare לאייפון</p>
            </div>
            <button onClick={() => setAsk(true)} className="shrink-0 min-h-[36px] bg-accent text-white font-bold text-[14px] px-4 rounded-full">לפתוח</button>
            <button onClick={hide} aria-label="סגירה" className="shrink-0 w-9 h-9 flex items-center justify-center text-muted text-xl leading-none">×</button>
          </>
        ) : (
          <>
            <p className="flex-1 min-w-0 text-[14px] font-bold text-ink">כבר יש לכם את האפליקציה?</p>
            <button onClick={openApp} className="shrink-0 min-h-[36px] bg-accent text-white font-bold text-[13px] px-3 rounded-full">כן, לפתוח</button>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center min-h-[36px] border border-line-strong text-ink font-bold text-[13px] px-3 rounded-full">להורדה</a>
            <button onClick={hide} aria-label="סגירה" className="shrink-0 w-9 h-9 flex items-center justify-center text-muted text-xl leading-none">×</button>
          </>
        )}
      </div>
    </div>
  );
}
