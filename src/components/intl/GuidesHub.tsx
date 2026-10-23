import Link from "next/link";
import { card, wrap } from "@/components/ui";
import GuideIcon from "@/app/guide/guide-icon";
import { breadcrumbLd, ldJson } from "@/lib/site";
import { SITE_URL, type Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import { intlGuides } from "@/lib/intl/guides";
import Crumbs from "./Crumbs";

/** /en/guide, /fr/guide: every guide of that language, like the Hebrew /guide. */
export default function GuidesHub({ lang }: { lang: Lang }) {
  const t = DICT[lang];
  const g = t.guides;
  const guides = intlGuides(lang);
  const listLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: g.hubTitle,
    url: `${SITE_URL}/${lang}/guide`,
    inLanguage: lang,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: guides.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/${lang}/guide/${x.slug}`, name: x.title })),
    },
  };
  return (
    <div className="bg-white text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(listLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([[t.nav.home, `/${lang}`], [g.hubTitle, `/${lang}/guide`]])) }} />
      <header className="bg-soft border-b border-line">
        <div className={`${wrap} pt-6 md:pt-8 pb-9 md:pb-12`}>
          <Crumbs lang={lang} items={[{ label: t.nav.home, href: `/${lang}` }, { label: g.hubTitle }]} />
          <div className="max-w-[820px] mt-5 md:mt-6 flex flex-col gap-3">
            <h1 className="font-display font-extrabold text-[32px] leading-[1.1] md:text-[46px] md:leading-[1.08] tracking-tight text-ink">{g.hubTitle}</h1>
            <p className="text-[17px] md:text-[19px] leading-relaxed text-body">{g.hubSub}</p>
          </div>
        </div>
      </header>

      <div className={`${wrap} py-10 md:py-14 flex flex-col gap-8`}>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {guides.map(x => (
            <li key={x.key} className="flex">
              <Link href={`/${lang}/guide/${x.slug}`}
                className={`group ${card} p-6 flex flex-col gap-3 w-full hover:border-line-strong transition-colors`}>
                <span className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center"><GuideIcon emoji={x.emoji} /></span>
                <h2 className="font-display font-bold text-[20px] leading-snug text-ink">{x.title}</h2>
                <p className="text-[15px] leading-relaxed text-muted">{x.description}</p>
                <span className="mt-auto pt-1 text-[16px] font-bold text-accent group-hover:text-accent-hover">{g.read} →</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="rounded-card bg-soft border border-line px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <p className="font-display font-bold text-[22px] md:text-[26px] text-ink">{g.ctaTitle}</p>
          <Link href={`/${lang}/apartments`}
            className="inline-flex items-center justify-center gap-2 font-bold bg-accent hover:bg-accent-hover text-white rounded-[14px] min-h-[48px] px-6 text-[16px] transition-colors w-full md:w-auto">
            {g.ctaApts}
          </Link>
        </div>
      </div>
    </div>
  );
}
