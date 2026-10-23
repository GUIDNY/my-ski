import Link from "next/link";
import { Brand } from "@/components/SiteHeader";
import { CONTACT_EMAIL, type Lang } from "@/lib/intl/config";
import { DICT, LANG_NAMES } from "@/lib/intl/dict";

const linkCls = "inline-flex items-center min-h-[44px] text-[15px] text-body hover:text-ink transition-colors";

/** The /en and /fr footer, like the Hebrew one (soft background, three columns). */
export default function IntlFooter({ lang }: { lang: Lang }) {
  const t = DICT[lang];
  const homes = [
    { code: "he", href: "/" },
    { code: "en", href: "/en" },
    { code: "fr", href: "/fr" },
  ] as const;
  return (
    <footer className="bg-soft border-t border-line mt-auto">
      <div className="max-w-[1240px] mx-auto px-4 md:px-6 pt-12 md:pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <Link href={`/${lang}`} aria-label={t.nav.homeAria} className="w-fit min-h-[44px] flex items-center"><Brand small /></Link>
            <p className="text-[15px] leading-relaxed text-muted max-w-[300px]">{t.footer.blurb}</p>
          </div>

          <nav aria-label={t.footer.book} className="flex flex-col">
            <span className="font-bold text-[15px] text-ink mb-1">{t.footer.book}</span>
            <Link href={`/${lang}/apartments`} className={linkCls}>{t.nav.apartments}</Link>
          </nav>

          <nav aria-label={t.footer.info} className="flex flex-col">
            <span className="font-bold text-[15px] text-ink mb-1">{t.footer.info}</span>
            <Link href={`/${lang}/terms`} className={linkCls}>{t.nav.terms}</Link>
            <Link href={`/${lang}/privacy`} className={linkCls}>{t.nav.privacy}</Link>
          </nav>

          <div className="col-span-2 md:col-span-1 flex flex-col">
            <span className="font-bold text-[15px] text-ink mb-1">{t.footer.contact}</span>
            <a href={`mailto:${CONTACT_EMAIL}`} className={`${linkCls} wrap-anywhere`}>{CONTACT_EMAIL}</a>
            <span className="font-bold text-[15px] text-ink mt-4 mb-1">{t.footer.languages}</span>
            <ul className="flex flex-wrap gap-x-4">
              {homes.map(h => (
                <li key={h.code}>
                  {/* a full page load: the other language has its own frame */}
                  <a href={h.href} hrefLang={h.code} lang={h.code} aria-current={h.code === lang ? "true" : undefined}
                    className={`${linkCls} ${h.code === lang ? "font-bold text-ink" : ""}`}>{LANG_NAMES[h.code]}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-line flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[14px] text-muted">
          <span>{t.footer.rights}</span>
          <span>{t.footer.countries}</span>
        </div>
      </div>
    </footer>
  );
}
