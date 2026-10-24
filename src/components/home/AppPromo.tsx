"use client";
import { useSyncExternalStore } from "react";
import { Qr } from "@/components/ProposalDocument";

/*
 * "יש לנו אפליקציה": on the home page of the website only. Never inside the
 * app itself. On a computer: a QR code to scan with the iPhone; on an
 * iPhone: the App Store button; on other phones: nothing (iPhone app only).
 */
const APP_STORE_URL = "https://apps.apple.com/il/app/skishare/id6782095727?l=he";
type Mode = "none" | "desktop" | "iphone";
const noop = () => () => {};
const modeNow = (): Mode => {
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  const ua = navigator.userAgent;
  if (w.Capacitor?.isNativePlatform?.() || /skishare/i.test(ua)) return "none";
  if (/iPhone|iPod/.test(ua)) return "iphone";
  if (/Android|iPad|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))) return "none";
  return "desktop";
};

export default function AppPromo() {
  const mode = useSyncExternalStore(noop, modeNow, () => "none" as Mode);
  if (mode === "none") return null;
  return (
    <section aria-label="האפליקציה של SkiShare" className="max-w-[1240px] mx-auto px-5 md:px-6 pt-14 md:pt-20">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-l from-[#1652F0] to-[#0B1B33] text-white px-6 py-8 md:px-12 md:py-11 flex flex-wrap items-center gap-8 md:gap-12">
        <div aria-hidden="true" className="absolute -left-16 -top-24 w-72 h-72 rounded-full bg-white/10" />
        <div className="relative flex-[1_1_420px] min-w-0 flex flex-col gap-3">
          <span className="self-start text-[13px] font-bold bg-white/15 border border-white/25 rounded-full px-3 py-1">חדש · לאייפון</span>
          <h2 className="font-display text-[28px] md:text-[38px] font-bold leading-tight">SkiShare באפליקציה</h2>
          <p className="text-[16px] md:text-[18px] leading-relaxed text-[#D6DEEA]">ההצעות, ההזמנה והתשלום שלכם בטלפון, עם הדירה, הסקי פס וההסעה במקום אחד.</p>
          {mode === "iphone" && (
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer"
              className="self-start mt-2 inline-flex items-center gap-2.5 bg-white text-[#0B1B33] rounded-[14px] px-6 min-h-[52px] font-bold text-[16px]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.9-1.1-2.9-4.2ZM13.9 5.2c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5Z" /></svg>
              להורדה ב-App Store
            </a>
          )}
        </div>
        {mode === "desktop" && (
          <div className="relative flex items-center gap-5">
            <div className="w-[132px] h-[132px] rounded-2xl bg-white p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"><Qr text={APP_STORE_URL} /></div>
            <div className="flex flex-col gap-1.5 max-w-[190px]">
              <b className="text-[17px]">סורקים עם האייפון</b>
              <span className="text-[14px] text-[#D6DEEA] leading-snug">פותחים את המצלמה, מכוונים לקוד, והאפליקציה ב-App Store.</span>
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="text-[14px] font-bold underline underline-offset-4 mt-1">או לפתוח ב-App Store ←</a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
