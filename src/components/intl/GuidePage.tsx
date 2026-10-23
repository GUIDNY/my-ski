import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { card, wrap } from "@/components/ui";
import GuideIcon from "@/app/guide/guide-icon";
import RichText from "@/app/guide/rich-text";
import Table from "@/app/guide/guide-table";
import LiveWeeks from "@/app/guide/live-weeks";
import { plainText, type GuideSection } from "@/lib/guides";
import { ORG_ID, SITE, VT_ID, WEBSITE_ID, breadcrumbLd, faqLd, ldJson } from "@/lib/site";
import { loadWeekPrices } from "@/lib/week-prices-server";
import { GUIDE_PAIRS, SITE_URL, guidePath, type Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import { monthName } from "@/lib/intl/format";
import { intlGuideBySlug, intlGuides, relatedIntlGuides } from "@/lib/intl/guides";
import { guideAlternates, pageMetadata } from "@/lib/intl/metadata";
import Crumbs from "./Crumbs";

/** The guides of this language, for generateStaticParams. */
export const guideParams = (lang: Lang) => intlGuides(lang).map(x => ({ slug: x.slug }));

/** <head>: title, description, canonical, hreflang to the same guide in the other languages. */
export function guideMetadata(lang: Lang, slug: string): Metadata {
  const guide = intlGuideBySlug(lang, slug);
  if (!guide) return {};
  return {
    ...pageMetadata(lang, `/guide/${guide.slug}`, {
      title: guide.metaTitle, description: guide.description, languages: guideAlternates(guide.pair), type: "article",
    }),
    keywords: guide.keywords,
  };
}

/*
 * One guide of /en/guide or /fr/guide: the same page as the Hebrew guide
 * (app/guide/[slug]/page.tsx), left to right. Static, regenerated every hour
 * (the live week table's prices in the HTML; it also refreshes in the browser).
 */

const fmtDate = (iso: string, lang: Lang) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return lang === "fr" ? `${d === 1 ? "1er" : d} ${monthName(m - 1, lang)} ${y}` : `${d} ${monthName(m - 1, lang)} ${y}`;
};
const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };

const sectionStrings = (s: GuideSection) => [
  s.heading, ...(s.paragraphs ?? []), ...(s.list ?? []),
  ...(s.table ? [s.table.caption ?? "", ...s.table.head, ...s.table.rows.flat()] : []),
  ...(s.after ?? []),
];

const paragraph = "text-[17px] leading-[1.75] text-body";

export default async function GuidePage({ lang, slug }: { lang: Lang; slug: string }) {
  const guide = intlGuideBySlug(lang, slug);
  if (!guide) notFound();
  const t = DICT[lang];
  const g = t.guides;
  const path = `/${lang}/guide/${guide.slug}`;
  const url = `${SITE_URL}${path}`;
  const related = relatedIntlGuides(lang, guide.key);
  const sources = guide.sources ?? [];
  const prices = GUIDE_PAIRS.find(p => p.key === "apartment-prices");
  const pricesHref = prices && prices.key !== guide.key ? guidePath(prices, lang) : null;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    inLanguage: lang,
    datePublished: guide.published,
    dateModified: guide.updated,
    image: [`${SITE}/og.jpg`],
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: url,
    about: { "@id": VT_ID },
    ...(sources.length ? { citation: sources.map(s => s.url) } : {}),
  };
  const guideFaqLd = guide.faqs.length ? faqLd(guide.faqs.map(f => ({ q: plainText(f.q), a: plainText(f.a) }))) : null;
  const crumbsLd = breadcrumbLd([[t.nav.home, `/${lang}`], [g.hubTitle, `/${lang}/guide`], [guide.title, path]]);

  const weekPrices = guide.sections.some(s => s.liveWeeks) ? await loadWeekPrices() : null;

  const words = [guide.intro, ...guide.sections.flatMap(sectionStrings), ...guide.faqs.flatMap(f => [f.q, f.a])]
    .map(plainText).join(" ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  const updated = fmtDate(guide.updated, lang);

  return (
    <div className="bg-white text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(articleLd) }} />
      {guideFaqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(guideFaqLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(crumbsLd) }} />

      <header className="bg-soft border-b border-line">
        <div className={`${wrap} pt-6 md:pt-8 pb-9 md:pb-12`}>
          <Crumbs lang={lang} items={[{ label: t.nav.home, href: `/${lang}` }, { label: g.hubTitle, href: `/${lang}/guide` }, { label: guide.title }]} />
          <div className="max-w-[820px] mt-5 md:mt-6 flex flex-col gap-4">
            <span className="w-14 h-14 rounded-2xl bg-white border border-line text-accent flex items-center justify-center"><GuideIcon emoji={guide.emoji} size={28} /></span>
            <h1 className="font-display font-extrabold text-[32px] leading-[1.12] md:text-[46px] md:leading-[1.08] tracking-tight text-ink" style={{ textWrap: "balance" }}>{guide.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] md:text-[15px] text-muted">
              {updated && <span>{g.updated(updated)}</span>}
              {updated && <span aria-hidden="true">·</span>}
              <span>{g.readTime(minutes)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className={`${wrap} py-10 md:py-14 flex flex-col lg:flex-row gap-10 lg:gap-14 items-start`}>
        {/* w-full: a table wider than a phone scrolls inside its own box, never the page */}
        <article className="w-full flex-1 min-w-0 max-w-[720px]">
          <p className="text-[18px] md:text-[20px] leading-[1.65] text-body"><RichText text={guide.intro} /></p>

          <div className="mt-10 flex flex-col gap-10">
            {guide.sections.map((s, i) => (
              <section key={i} id={`s-${i + 1}`} className="flex flex-col gap-3.5 scroll-mt-[96px]">
                <h2 className="font-display font-bold text-[24px] md:text-[28px] leading-snug tracking-tight text-ink"><RichText text={s.heading} /></h2>
                {s.paragraphs?.map((p, pi) => (
                  <p key={pi} className={paragraph}><RichText text={p} /></p>
                ))}
                {s.list && !s.ordered && (
                  <ul className="flex flex-col gap-2.5">
                    {s.list.map((item, li) => (
                      <li key={li} className="flex gap-3 text-[17px] leading-[1.7] text-body">
                        <span aria-hidden="true" className="mt-[11px] w-2 h-2 rounded-full bg-accent shrink-0" />
                        <span><RichText text={item} /></span>
                      </li>
                    ))}
                  </ul>
                )}
                {s.list && s.ordered && (
                  <ol className="flex flex-col gap-2.5">
                    {s.list.map((item, li) => (
                      <li key={li} className="flex gap-3 text-[17px] leading-[1.7] text-body">
                        <span className="mt-[2px] w-[26px] h-[26px] rounded-full bg-accent-soft text-accent text-[14px] font-bold flex items-center justify-center shrink-0 tabular-nums">{li + 1}</span>
                        <span><RichText text={item} /></span>
                      </li>
                    ))}
                  </ol>
                )}
                {s.table && <Table table={s.table} />}
                {s.liveWeeks && <LiveWeeks initial={weekPrices} {...s.liveWeeks} lang={lang} />}
                {s.after?.map((p, pi) => (
                  <p key={pi} className={paragraph}><RichText text={p} /></p>
                ))}
              </section>
            ))}
          </div>

          {guide.faqs.length > 0 && (
            <section id="faq" className="mt-14 scroll-mt-[96px]">
              <h2 className="font-display font-bold text-[24px] md:text-[28px] tracking-tight text-ink mb-4">{g.faq}</h2>
              <div className="flex flex-col border-t border-line">
                {guide.faqs.map((f, i) => (
                  <details key={i} open={i === 0} className="border-b border-line py-5 group">
                    <summary className="font-bold text-[17px] md:text-[18px] text-ink cursor-pointer list-none flex items-center justify-between gap-4 min-h-[32px]">
                      {f.q}
                      <span aria-hidden="true" className="text-muted text-xl transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-[16px] md:text-[17px] leading-[1.7] text-body"><RichText text={f.a} /></p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {sources.length > 0 && (
            <section id="sources" className="mt-14 scroll-mt-[96px]">
              <h2 className="font-display font-bold text-[24px] md:text-[28px] tracking-tight text-ink mb-4">{g.sources}</h2>
              <ul className="flex flex-col gap-2.5">
                {sources.map((s, i) => {
                  const own = s.url.startsWith(`${SITE}/`);
                  const cls = "text-accent hover:text-accent-hover underline underline-offset-2";
                  return (
                    <li key={i} className="flex gap-3 text-[15px] md:text-[16px] leading-relaxed text-body">
                      <span aria-hidden="true" className="mt-[10px] w-1.5 h-1.5 rounded-full bg-line-strong shrink-0" />
                      <span className="min-w-0">
                        {own
                          ? <Link href={s.url.slice(SITE.length)} className={cls}><RichText text={s.title} /></Link>
                          : <a href={s.url} rel="noopener" className={cls}><RichText text={s.title} /></a>}
                        {" "}<span className="text-muted wrap-anywhere">({hostOf(s.url)})</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="mt-14 rounded-card bg-ink text-white px-6 py-8 md:px-9 md:py-10 flex flex-col gap-5">
            <p className="font-display font-bold text-[24px] md:text-[28px] leading-tight">{g.ctaTitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/${lang}/apartments`} className="inline-flex items-center justify-center min-h-[52px] px-6 rounded-[14px] bg-white text-ink font-bold text-[16px] hover:bg-accent-soft transition-colors">
                {g.ctaApts}
              </Link>
              {pricesHref && (
                <Link href={pricesHref} className="inline-flex items-center justify-center min-h-[52px] px-6 rounded-[14px] border border-white/45 text-white font-bold text-[16px] hover:bg-white/10 transition-colors">
                  {g.ctaPrices}
                </Link>
              )}
            </div>
          </div>
        </article>

        {guide.sections.length > 1 && (
          <aside aria-label={g.inThisGuide} className="hidden lg:block w-[300px] shrink-0 sticky top-[96px]">
            <div className={`${card} p-5`}>
              <p className="font-bold text-[15px] text-ink mb-3">{g.inThisGuide}</p>
              <nav className="flex flex-col">
                {guide.sections.map((s, i) => (
                  <a key={i} href={`#s-${i + 1}`} className="py-2 text-[15px] leading-snug text-body hover:text-accent border-b border-line last:border-0 transition-colors">{plainText(s.heading)}</a>
                ))}
                {guide.faqs.length > 0 && (
                  <a href="#faq" className="py-2 text-[15px] text-body hover:text-accent border-b border-line last:border-0 transition-colors">{g.faq}</a>
                )}
                {sources.length > 0 && (
                  <a href="#sources" className="py-2 text-[15px] text-body hover:text-accent transition-colors">{g.sources}</a>
                )}
              </nav>
            </div>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section className="bg-soft border-t border-line">
          <div className={`${wrap} py-12 md:py-16`}>
            <h2 className="font-display font-bold text-[24px] md:text-[28px] tracking-tight text-ink mb-6">{g.more}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
              {related.map(r => (
                <Link key={r.key} href={`/${lang}/guide/${r.slug}`}
                  className={`group ${card} p-5 flex items-start gap-3.5 hover:border-line-strong transition-colors`}>
                  <span className="w-11 h-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0"><GuideIcon emoji={r.emoji} size={22} /></span>
                  <span className="flex flex-col gap-1.5">
                    <span className="font-bold text-[16px] leading-snug text-ink">{r.title}</span>
                    <span className="text-[14px] font-bold text-accent group-hover:text-accent-hover">{g.read} →</span>
                  </span>
                </Link>
              ))}
            </div>
            <Link href={`/${lang}/guide`} className="inline-flex items-center min-h-[44px] mt-6 font-bold text-[16px] text-accent hover:text-accent-hover">{g.all} →</Link>
          </div>
        </section>
      )}
    </div>
  );
}
