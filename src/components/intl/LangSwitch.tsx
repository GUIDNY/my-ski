"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pathInLang, type Lang, type SiteLang } from "@/lib/intl/config";
import { DICT, LANG_NAMES } from "@/lib/intl/dict";

/*
 * עברית / English / Français, keeping the same page (and its dates) when the
 * other language has it. Plain links: a language change is a full page load,
 * so every page starts with the right <html lang dir> and frame.
 */

const ORDER: SiteLang[] = ["he", "en", "fr"];

const Globe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
  </svg>
);
const Chevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    className={`transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
);

function Switch({ lang, search }: { lang: Lang; search: string }) {
  const pathname = usePathname() || `/${lang}`;
  const t = DICT[lang];
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  // Idan, 25.10: the English and French site shows no Hebrew option at all
  const items = ORDER.filter(code => code !== "he").map(code => ({ code, name: LANG_NAMES[code], href: pathInLang(pathname, search, code), current: code === lang }));

  return (
    <>
      {/* desktop: the three names */}
      <ul aria-label={t.nav.language} className="hidden md:flex items-center gap-0.5 ms-1">
        {items.map(i => (
          <li key={i.code}>
            <a href={i.href} hrefLang={i.code} lang={i.code} aria-current={i.current ? "true" : undefined}
              className={`inline-flex items-center min-h-[44px] px-3 rounded-lg text-[15px] transition-colors ${
                i.current ? "text-accent font-bold" : "text-ink font-medium hover:text-accent"}`}>
              {i.name}
            </a>
          </li>
        ))}
      </ul>

      {/* phone: a small menu */}
      <div ref={box} className="relative md:hidden">
        <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls="lang-menu"
          aria-label={`${t.nav.language}: ${LANG_NAMES[lang]}`}
          className="inline-flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-2.5 rounded-xl border border-line text-ink text-[15px] font-bold hover:border-line-strong transition-colors">
          {/* the globe and the chevron only where the header has room ("Appartements" is long) */}
          <span className="hidden min-[380px]:inline-flex"><Globe /></span>{lang.toUpperCase()}<span className="hidden min-[400px]:inline-flex"><Chevron open={open} /></span>
        </button>
        {open && (
          <ul id="lang-menu" className="absolute end-0 top-full mt-2 w-[180px] bg-white border border-line rounded-2xl shadow-pop p-1.5 z-[60]">
            {items.map(i => (
              <li key={i.code}>
                <a href={i.href} hrefLang={i.code} lang={i.code} aria-current={i.current ? "true" : undefined}
                  className={`flex items-center justify-between min-h-[48px] px-3.5 rounded-xl text-[16px] transition-colors ${
                    i.current ? "bg-accent-soft text-accent font-bold" : "text-ink font-medium hover:bg-soft"}`}>
                  {i.name}
                  {i.current && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l4 4 10-10" /></svg>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function WithSearch({ lang }: { lang: Lang }) {
  const sp = useSearchParams();
  return <Switch lang={lang} search={sp.toString()} />;
}

export default function LangSwitch({ lang }: { lang: Lang }) {
  // the query is read on the client only (static pages have none at build time)
  return (
    <Suspense fallback={<Switch lang={lang} search="" />}>
      <WithSearch lang={lang} />
    </Suspense>
  );
}
