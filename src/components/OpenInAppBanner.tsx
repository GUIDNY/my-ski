"use client";
import { useEffect, useState } from "react";

const APP_STORE_URL = "https://apps.apple.com/il/app/skishare/id6782095727?l=he";

// Promo banner on shared pages: "open in app / download it".
// On iOS the native Smart App Banner (apple-itunes-app meta) also appears and
// shows OPEN when the app is installed — this banner is the cross-platform fallback.
export default function OpenInAppBanner() {
  const [show, setShow] = useState(false);
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    // don't show inside the app's own webview (Capacitor) or after dismissal
    const inApp = typeof navigator !== "undefined" && /skishare/i.test(navigator.userAgent);
    const dismissed = typeof sessionStorage !== "undefined" && sessionStorage.getItem("appBannerHidden");
    if (!inApp && !dismissed) setShow(true);
  }, []);

  if (!show) return null;

  const hide = () => { setShow(false); try { sessionStorage.setItem("appBannerHidden", "1"); } catch {} };
  const openApp = () => { window.location.href = window.location.href; setTimeout(() => { window.location.href = APP_STORE_URL; }, 1200); };

  return (
    <div dir="rtl" className="sticky top-0 z-[60] bg-gradient-to-l from-blue-600 to-blue-500 text-white">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <img src="/icon-512.png" alt="SkiShare" className="w-9 h-9 rounded-xl flex-shrink-0 shadow" />
        {!ask ? (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">צפה/י באפליקציית SkiShare</p>
              <p className="text-[11px] opacity-90 leading-tight">חוויה מהירה ונוחה יותר</p>
            </div>
            <button onClick={() => setAsk(true)} className="flex-shrink-0 bg-white text-blue-700 font-black text-sm px-4 py-1.5 rounded-full">פתח/י</button>
            <button onClick={hide} aria-label="סגור" className="flex-shrink-0 text-white/80 text-xl leading-none px-1">×</button>
          </>
        ) : (
          <>
            <p className="flex-1 min-w-0 text-sm font-bold">כבר הורדת את האפליקציה?</p>
            <button onClick={openApp} className="flex-shrink-0 bg-white text-blue-700 font-black text-xs px-3 py-1.5 rounded-full">כן, פתח/י</button>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 bg-blue-800/40 text-white font-black text-xs px-3 py-1.5 rounded-full">הורד/י</a>
            <button onClick={hide} aria-label="סגור" className="flex-shrink-0 text-white/80 text-xl leading-none px-1">×</button>
          </>
        )}
      </div>
    </div>
  );
}
