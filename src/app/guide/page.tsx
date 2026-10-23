import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { PageTop, wrap, card, btn } from "@/components/ui";
import GuideIcon from "./guide-icon";
import { pageMeta } from "@/lib/page-meta";
import { breadcrumbLd, ldJson, siteUrl } from "@/lib/site";
import { alternatesFor } from "@/lib/intl/metadata";

export const metadata = pageMeta({
  title: "מדריך ואל טורנס 2026/27: עונה, מחירים, הגעה ולינה | SkiShare",
  description: "מדריכים בעברית לחופשת סקי בואל טורנס: מתי לנסוע, איך מגיעים מישראל, כמה עולה סקי פס, איפה לישון ומה ההבדל ממריבל וקורשבל. מעודכן לעונת 2026/27.",
  path: "/guide",
  // the guides in English and French (hreflang)
  languages: alternatesFor("/guide"),
});

export default function GuideIndex() {
  const [main, ...rest] = GUIDES;
  // the list of guides, for search engines and AI answers
  const listLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "מדריך ואל טורנס",
    url: siteUrl("/guide"),
    inLanguage: "he-IL",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: GUIDES.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: siteUrl(`/guide/${g.slug}`), name: g.title })),
    },
  };
  return (
    <div className="bg-white text-ink" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(listLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([["דף הבית", "/"], ["מדריך ואל טורנס", "/guide"]])) }} />
      <PageTop soft
        crumbs={[{ label: "דף הבית", href: "/" }, { label: "מדריך ואל טורנס" }]}
        title="כל מה שצריך לדעת על ואל טורנס"
        sub={
          <span className="block max-w-[760px]">
            מדריכים לתכנון חופשת סקי בואל טורנס: מתי לנסוע, איך מגיעים מישראל, כמה עולה סקי פס,
            איפה לישון, מסלולים, משפחות ואפרה סקי. כל מספר עם מקור, מעודכן לעונת 2026/27.
          </span>
        }
      />

      <div className={`${wrap} py-10 md:py-14 flex flex-col gap-5 md:gap-6`}>
        {/* the full guide first, with a photo */}
        {main && (
          <Link href={encodeURI(`/guide/${main.slug}`)}
            className={`group ${card} overflow-hidden grid md:grid-cols-[1.1fr_1fr] hover:border-line-strong transition-colors`}>
            <div className="relative h-[220px] md:h-auto md:min-h-[300px] bg-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/view.jpg" alt="הכפר ואל טורנס בשלג מול ההרים" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="p-6 md:p-9 flex flex-col gap-3 justify-center">
              <span className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center"><GuideIcon emoji={main.emoji} /></span>
              <h2 className="font-display font-bold text-[24px] md:text-[30px] leading-tight text-ink">{main.title}</h2>
              <p className="text-[16px] md:text-[17px] leading-relaxed text-body line-clamp-4">{main.description}</p>
              <span className="mt-1 text-[16px] font-bold text-accent group-hover:text-accent-hover">לקריאה ←</span>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {rest.map(g => (
            <Link key={g.slug} href={encodeURI(`/guide/${g.slug}`)}
              className={`group ${card} p-6 flex flex-col gap-3 hover:border-line-strong transition-colors`}>
              <span className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center"><GuideIcon emoji={g.emoji} /></span>
              <h2 className="font-display font-bold text-[20px] leading-snug text-ink">{g.title}</h2>
              <p className="text-[15px] leading-relaxed text-muted line-clamp-3">{g.description}</p>
              <span className="mt-auto pt-1 text-[16px] font-bold text-accent group-hover:text-accent-hover">לקריאה ←</span>
            </Link>
          ))}
        </div>

        <div className="mt-6 md:mt-10 rounded-card bg-soft border border-line px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <p className="font-display font-bold text-[22px] md:text-[26px] text-ink">מוכנים לתכנן את החופשה?</p>
            <p className="text-[16px] text-muted mt-1">דירה, סקי פס, הסעה וציוד, בחבילה אחת.</p>
          </div>
          <Link href="/apartments" className={`${btn.primary} w-full md:w-auto`}>צפו בדירות בואל טורנס</Link>
        </div>
      </div>
    </div>
  );
}
