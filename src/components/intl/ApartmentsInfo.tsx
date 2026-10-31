import Link from "next/link";
import { wrap } from "@/components/ui";
import LiveWeeks from "@/app/guide/live-weeks";
import GuideIcon from "@/app/guide/guide-icon";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import { intlGuides } from "@/lib/intl/guides";
import type { WeekPrices } from "@/lib/week-prices";
import { ORG_ID, SITE, VT_ID, WEBSITE_ID, breadcrumbLd, faqLd, ldJson } from "@/lib/site";

/*
 * Under the apartments list (/en/apartments, /fr/apartments): how the prices
 * work, the cheapest apartment of every Saturday (the live table of the
 * guides, with the same holiday notes as the apartment prices guide), and
 * the guides to read before booking. Server-rendered, so search engines get
 * real text on the page that answers "apartments in Val Thorens".
 */
export default function ApartmentsInfo({ lang, weekPrices, apartments }: {
  lang: Lang; weekPrices: WeekPrices | null; apartments: { id: string; name: string }[];
}) {
  const d = DICT[lang];
  const t = d.guides;
  // who rents, the list and the questions shown below, for search engines and AI answers (same text as on the page)
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${SITE}/${lang}/apartments#page`,
      url: `${SITE}/${lang}/apartments`,
      name: d.list.title,
      description: d.list.intro,
      inLanguage: lang,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": VT_ID },
      provider: { "@id": ORG_ID },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: apartments.length,
        itemListElement: apartments.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/${lang}/apartments/${a.id}`, name: a.name })),
      },
    },
    faqLd(t.aptsFaq),
    breadcrumbLd([[d.nav.home, `/${lang}`], [d.nav.apartments, `/${lang}/apartments`]]),
  ];
  const guides = intlGuides(lang);
  const notes = guides.find(g => g.key === "apartment-prices")?.sections.find(s => s.liveWeeks)?.liveWeeks?.notes ?? {};
  return (
    <section aria-labelledby="apts-info" className="bg-soft border-t border-line">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <div className={`${wrap} py-12 md:py-16 flex flex-col lg:flex-row gap-10 lg:gap-14 items-start`}>
        <div className="w-full flex-1 min-w-0 max-w-[760px] flex flex-col gap-4">
          <h2 id="apts-info" className="font-display font-bold text-[24px] md:text-[30px] leading-tight tracking-tight text-ink">{t.aptsTitle}</h2>
          <p className="text-[16px] md:text-[17px] leading-[1.7] text-body">{t.aptsText}</p>
          <LiveWeeks initial={weekPrices} notes={notes} count lang={lang} />
          <h2 id="apts-faq" className="mt-8 font-display font-bold text-[22px] md:text-[26px] leading-tight tracking-tight text-ink">{t.aptsFaqTitle}</h2>
          <dl className="flex flex-col gap-5">
            {t.aptsFaq.map(f => (
              <div key={f.q}>
                <dt className="font-bold text-[16px] md:text-[17px] text-ink">{f.q}</dt>
                <dd className="mt-1 text-[16px] md:text-[17px] leading-[1.7] text-body">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
        {guides.length > 0 && (
          <nav aria-labelledby="apts-guides" className="w-full lg:w-[320px] shrink-0">
            <h2 id="apts-guides" className="font-bold text-[17px] text-ink mb-3">{t.aptsGuides}</h2>
            <ul className="flex flex-col gap-2.5">
              {guides.map(x => (
                <li key={x.key}>
                  <Link href={`/${lang}/guide/${x.slug}`}
                    className="group flex items-center gap-3 bg-white border border-line rounded-2xl px-4 py-3 min-h-[56px] hover:border-line-strong transition-colors">
                    <span className="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0"><GuideIcon emoji={x.emoji} size={18} /></span>
                    <span className="font-bold text-[15px] leading-snug text-ink group-hover:text-accent">{t.short[x.key] ?? x.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </section>
  );
}
