"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/SiteHeader";
import { wrap } from "@/components/ui";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import LangSwitch from "./LangSwitch";

/** The /en and /fr header: white, sticky, the same height and look as the Hebrew one. */
export default function IntlHeader({ lang }: { lang: Lang }) {
  const pathname = usePathname() || `/${lang}`;
  const t = DICT[lang];
  // `display` is passed whole ("inline-flex", or "hidden lg:inline-flex"): two display classes would fight
  const link = (href: string, label: string, on: boolean, display = "inline-flex") => (
    <Link href={href} aria-current={on ? "page" : undefined}
      className={`${display} items-center min-h-[44px] px-2 md:px-3 rounded-lg text-[15px] md:text-[16px] whitespace-nowrap transition-colors ${
        on ? "text-accent font-bold" : "text-ink font-medium hover:text-accent"}`}>
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-line">
      <div className={`${wrap} h-[60px] md:h-[76px] flex items-center justify-between gap-2`}>
        <Link href={`/${lang}`} aria-label={t.nav.homeAria} className="shrink-0 flex items-center min-h-[44px]"><Brand /></Link>
        <div className="flex items-center gap-1 md:gap-2 min-w-0">
          <nav aria-label={t.nav.main} className="flex items-center gap-0.5 md:gap-1">
            {link(`/${lang}/apartments`, t.nav.apartments, pathname.startsWith(`/${lang}/apartments`))}
            {link(`/${lang}/guide`, t.guides.nav, pathname.startsWith(`/${lang}/guide`), "hidden md:inline-flex")}
            {link(`/${lang}/terms`, t.nav.terms, pathname === `/${lang}/terms`, "hidden lg:inline-flex")}
          </nav>
          <span aria-hidden="true" className="hidden md:block w-px h-6 bg-line mx-1" />
          <LangSwitch lang={lang} />
        </div>
      </div>
    </header>
  );
}
