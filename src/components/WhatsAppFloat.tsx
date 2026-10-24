"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { helperWaHref } from "@/lib/helper-whatsapp";

/*
 * "דברו איתנו בוואטסאפ": a floating WhatsApp button on every Hebrew page,
 * bottom left (the site chat bubble is bottom right on the computer).
 * A few seconds in, once per visit, a small bubble says that we answer
 * right away; it can be closed. Phone: a round button only, and not on the
 * pages with a sticky price or pay bar at the bottom.
 */

const HIDE = ["/admin", "/quote/print", "/en", "/fr", "/auth"];
// pages with their own sticky bar at the bottom of a phone screen
const PHONE_HIDE = [/^\/apartments\/[^/]+/, /^\/pay\//, /^\/split\//, /^\/q\//, /^\/offer\//];
const SEEN_KEY = "skishare-wa-bubble";

const IcoWa = ({ size = 26 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);

export default function WhatsAppFloat() {
  const p = usePathname() || "/";
  const [bubble, setBubble] = useState(false);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch { /* no storage */ }
    if (seen) return;
    const t = setTimeout(() => setBubble(true), 9000);
    return () => clearTimeout(t);
  }, []);

  if (HIDE.some(h => p === h || p.startsWith(h + "/"))) return null;
  const phoneHidden = PHONE_HIDE.some(re => re.test(p));
  const close = () => {
    setBubble(false);
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* no storage */ }
  };
  const href = helperWaHref("היי, הגעתי מהאתר");

  return (
    <div dir="rtl" className={`${phoneHidden ? "hidden md:flex" : "flex"} fixed z-[55] bottom-4 left-4 md:bottom-6 md:left-6 flex-col items-start gap-2 pointer-events-none`}>
      {bubble && (
        <div className="pointer-events-auto relative max-w-[250px] rounded-2xl bg-white border border-line shadow-[0_8px_30px_rgba(15,23,42,0.16)] p-3.5 pe-8 text-[14px] leading-snug text-ink animate-[fadeUp_.35s_ease-out]">
          <b className="block mb-0.5">שאלה? דברו איתנו בוואטסאפ</b>
          <span className="text-body">עונים מיד, בעברית, ומכינים לכם הצעה מלאה תוך דקה.</span>
          <button type="button" onClick={close} aria-label="סגירה"
            className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full text-muted hover:bg-soft flex items-center justify-center text-[18px] leading-none">×</button>
        </div>
      )}
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={close}
        aria-label="דברו איתנו בוואטסאפ"
        className="pointer-events-auto group inline-flex items-center gap-2.5 h-[56px] md:h-[54px] w-[56px] md:w-auto justify-center md:px-5 rounded-full bg-[#25D366] hover:bg-[#1EBE5A] text-white font-bold text-[16px] shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-[transform,background-color] hover:scale-[1.03] active:scale-95">
        <IcoWa />
        <span className="hidden md:inline">דברו איתנו בוואטסאפ</span>
      </a>
    </div>
  );
}
