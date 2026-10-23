import type { ReactNode } from "react";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import HtmlLang from "./HtmlLang";
import IntlHeader from "./IntlHeader";
import IntlFooter from "./IntlFooter";
import IntlCookieNotice from "./IntlCookieNotice";

/*
 * The frame of every /en and /fr page (their layouts). The root layout stays
 * the Hebrew site's: it renders <html lang="he" dir="rtl"> and the Hebrew
 * header, footer, chat and cookie strip, which hide themselves under /en and
 * /fr. This frame brings the left-to-right header, footer and cookie notice,
 * and fixes <html lang dir> before the first paint with the small inline
 * script below (the root <html> has suppressHydrationWarning for it), then
 * on client navigations with <HtmlLang>.
 */
export default function IntlShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const t = DICT[lang];
  // A browser's page translation (Chrome's Google Translate) moves the page's
  // text into its own <font> elements. React then removes or inserts next to
  // nodes that are no longer where it left them, and the page crashed ("An
  // error has occurred" when choosing dates on an apartment page). Ignore
  // those two calls instead of throwing, the usual guard for this.
  const setHtml = `(function(h){h.lang=${JSON.stringify(lang)};h.dir="ltr";`
    + `var N=window.Node&&Node.prototype;if(N&&!N.__gt){N.__gt=1;var r=N.removeChild,i=N.insertBefore;`
    + `N.removeChild=function(c){return c&&c.parentNode!==this?c:r.apply(this,arguments)};`
    + `N.insertBefore=function(n,f){return f&&f.parentNode!==this?n:i.apply(this,arguments)}}})(document.documentElement)`;
  return (
    <div lang={lang} dir="ltr" className="flex-1 flex flex-col bg-white text-ink">
      <script dangerouslySetInnerHTML={{ __html: setHtml }} />
      <HtmlLang lang={lang} />
      <a href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:bg-white focus:text-ink focus:font-bold focus:px-4 focus:py-3 focus:rounded-xl focus:shadow-pop">
        {t.nav.skip}
      </a>
      <IntlHeader lang={lang} />
      <main id="main" className="flex-1 flex flex-col">{children}</main>
      <IntlFooter lang={lang} />
      <IntlCookieNotice lang={lang} />
    </div>
  );
}
