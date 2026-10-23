import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuideBySlug } from "@/lib/guides";
import { wrap, card, btn, Crumbs } from "@/components/ui";
import GuideIcon from "../guide-icon";
import { pageMeta } from "@/lib/page-meta";
import { ORG_ID, WEBSITE_ID, VAL_THORENS, breadcrumbLd, faqLd, ldJson, siteUrl } from "@/lib/site";

const SITE_URL = "https://skisharebook.com";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtUpdated = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  return isNaN(d.getTime()) ? "" : `${d.getDate()} ב${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// only the guides that exist: any other address is a real 404 (not a page that streams "not found" with a 200)
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map(g => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  return {
    ...pageMeta({ title: guide.metaTitle, description: guide.description, path: `/guide/${guide.slug}`, type: "article", imageAlt: guide.title }),
    keywords: guide.keywords,
  };
}

export default async function GuideArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const url = siteUrl(`/guide/${guide.slug}`);
  const related = GUIDES.filter(g => g.slug !== guide.slug).slice(0, 3);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    inLanguage: "he-IL",
    dateModified: guide.updated,
    image: [`${SITE_URL}/og.jpg`],
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: url,
    about: VAL_THORENS,
  };
  const guideFaqLd = guide.faqs.length ? faqLd(guide.faqs) : null;
  const crumbsLd = breadcrumbLd([["דף הבית", "/"], ["מדריך ואל טורנס", "/guide"], [guide.title, `/guide/${guide.slug}`]]);

  // about 200 words a minute
  const words = [guide.intro, ...guide.sections.flatMap(s => [s.heading, ...(s.paragraphs ?? []), ...(s.list ?? [])]), ...guide.faqs.flatMap(f => [f.q, f.a])]
    .join(" ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  const updated = fmtUpdated(guide.updated);

  return (
    <div className="bg-white text-ink" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(articleLd) }} />
      {guideFaqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(guideFaqLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(crumbsLd) }} />

      {/* Title */}
      <header className="bg-soft border-b border-line">
        <div className={`${wrap} pt-6 md:pt-8 pb-9 md:pb-12`}>
          <Crumbs items={[{ label: "דף הבית", href: "/" }, { label: "מדריך ואל טורנס", href: "/guide" }, { label: guide.title }]} />
          <div className="max-w-[820px] mt-5 md:mt-6 flex flex-col gap-4">
            <span className="w-14 h-14 rounded-2xl bg-white border border-line text-accent flex items-center justify-center"><GuideIcon emoji={guide.emoji} size={28} /></span>
            <h1 className="font-display font-extrabold text-[32px] leading-[1.12] md:text-[46px] md:leading-[1.08] tracking-tight text-ink">{guide.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] md:text-[15px] text-muted">
              {updated && <span>עודכן ב-{updated}</span>}
              {updated && <span aria-hidden="true">·</span>}
              <span>קריאה של כ-{minutes} דקות</span>
            </div>
          </div>
        </div>
      </header>

      <div className={`${wrap} py-10 md:py-14 flex flex-col lg:flex-row gap-10 lg:gap-14 items-start`}>
        {/* Article */}
        <article className="flex-1 min-w-0 max-w-[720px]">
          <p className="text-[18px] md:text-[20px] leading-[1.7] text-body">{guide.intro}</p>

          <div className="mt-10 flex flex-col gap-10">
            {guide.sections.map((s, i) => (
              <section key={i} id={`s-${i + 1}`} className="flex flex-col gap-3.5">
                <h2 className="font-display font-bold text-[24px] md:text-[28px] leading-snug tracking-tight text-ink">{s.heading}</h2>
                {s.paragraphs?.map((p, pi) => (
                  <p key={pi} className="text-[17px] leading-[1.8] text-body">{p}</p>
                ))}
                {s.list && (
                  <ul className="flex flex-col gap-2.5">
                    {s.list.map((item, li) => (
                      <li key={li} className="flex gap-3 text-[17px] leading-[1.75] text-body">
                        <span aria-hidden="true" className="mt-[11px] w-2 h-2 rounded-full bg-accent shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {guide.faqs.length > 0 && (
            <section id="faq" className="mt-14">
              <h2 className="font-display font-bold text-[24px] md:text-[28px] tracking-tight text-ink mb-4">שאלות נפוצות</h2>
              <div className="flex flex-col border-t border-line">
                {guide.faqs.map((f, i) => (
                  <details key={i} open={i === 0} className="border-b border-line py-5 group">
                    <summary className="font-bold text-[17px] md:text-[18px] text-ink cursor-pointer list-none flex items-center justify-between gap-4 min-h-[32px]">
                      {f.q}
                      <span aria-hidden="true" className="text-muted text-xl transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-[16px] md:text-[17px] leading-[1.7] text-body">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <div className="mt-14 rounded-card bg-ink text-white px-6 py-8 md:px-9 md:py-10 flex flex-col gap-5">
            <p className="font-display font-bold text-[24px] md:text-[28px] leading-tight">מתכננים חופשת סקי בואל טורנס?</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/apartments" className="inline-flex items-center justify-center min-h-[52px] px-6 rounded-[14px] bg-white text-ink font-bold text-[16px] hover:bg-accent-soft transition-colors">
                דירות בואל טורנס
              </Link>
              <Link href="/weekly" className="inline-flex items-center justify-center min-h-[52px] px-6 rounded-[14px] border border-white/45 text-white font-bold text-[16px] hover:bg-white/10 transition-colors">
                מחיר לכל שבוע בעונה
              </Link>
            </div>
          </div>
        </article>

        {/* In this guide (desktop) */}
        {guide.sections.length > 1 && (
          <aside aria-label="בכתבה הזאת" className="hidden lg:block w-[300px] shrink-0 sticky top-[96px]">
            <div className={`${card} p-5`}>
              <p className="font-bold text-[15px] text-ink mb-3">בכתבה הזאת</p>
              <nav className="flex flex-col">
                {guide.sections.map((s, i) => (
                  <a key={i} href={`#s-${i + 1}`} className="py-2 text-[15px] leading-snug text-body hover:text-accent border-b border-line last:border-0 transition-colors">{s.heading}</a>
                ))}
                {guide.faqs.length > 0 && (
                  <a href="#faq" className="py-2 text-[15px] text-body hover:text-accent transition-colors">שאלות נפוצות</a>
                )}
              </nav>
            </div>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section className="bg-soft border-t border-line">
          <div className={`${wrap} py-12 md:py-16`}>
            <h2 className="font-display font-bold text-[24px] md:text-[28px] tracking-tight text-ink mb-6">עוד מדריכים על ואל טורנס</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
              {related.map(g => (
                <Link key={g.slug} href={`/guide/${g.slug}`}
                  className={`group ${card} p-5 flex items-start gap-3.5 hover:border-line-strong transition-colors`}>
                  <span className="w-11 h-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0"><GuideIcon emoji={g.emoji} size={22} /></span>
                  <span className="flex flex-col gap-1.5">
                    <span className="font-bold text-[16px] leading-snug text-ink">{g.title}</span>
                    <span className="text-[14px] font-bold text-accent group-hover:text-accent-hover">לקריאה ←</span>
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/guide" className={`${btn.link} mt-6 min-h-[44px]`}>לכל המדריכים ←</Link>
          </div>
        </section>
      )}
    </div>
  );
}
