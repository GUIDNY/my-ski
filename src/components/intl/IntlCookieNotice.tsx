"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";

/*
 * The cookie notice of the /en and /fr pages: the same slim strip under the
 * header as the Hebrew one (components/CookieConsent.tsx, hidden here), with
 * the same storage key and event, so an answer in one language counts in all.
 * As there, moving on to another page counts as agreeing.
 */
const KEY = "skishare_cookie_consent";
const CHANGED = "skishare:cookie-consent";

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGED, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(CHANGED, cb); };
};
const notAnswered = () => { try { return !localStorage.getItem(KEY); } catch { return false; } };
const remember = () => {
  try { localStorage.setItem(KEY, "1"); } catch { /* private mode */ }
  window.dispatchEvent(new Event(CHANGED));
};

export default function IntlCookieNotice({ lang }: { lang: Lang }) {
  const show = useSyncExternalStore(subscribe, notAnswered, () => false);
  const pathname = usePathname();
  const first = useRef<string | null>(null);
  const t = DICT[lang].cookie;

  useEffect(() => {
    if (first.current === null) { first.current = pathname; return; }
    if (pathname !== first.current && notAnswered()) remember();
  }, [pathname]);

  if (!show) return null;

  const policy = `/${lang}/privacy#cookies`;
  return (
    <div role="region" aria-label={t.region}
      className="fixed inset-x-0 top-[60px] md:top-[76px] z-[45] bg-white/95 backdrop-blur border-b border-line"
      style={{ boxShadow: "0 8px 24px rgba(11,27,51,0.08)" }}>
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-2.5 flex items-center gap-3">
        <p className="flex-1 min-w-0 text-[13px] md:text-[14px] text-body leading-snug">
          <span className="md:hidden">{t.short} <Link href={policy} className="text-accent font-bold">{t.details}</Link></span>
          <span className="hidden md:inline">{t.long} <Link href={policy} className="text-accent font-bold">{t.policy}</Link>.</span>
        </p>
        <button type="button" onClick={remember}
          className="shrink-0 min-h-[44px] px-5 bg-accent hover:bg-accent-hover text-white text-[14px] font-bold rounded-xl transition-colors">
          {t.accept}
        </button>
      </div>
    </div>
  );
}
