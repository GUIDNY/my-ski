import { SITE, ORG_ID, VAL_THORENS, ldJson } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Check, chip, h1, h2, wrap } from "@/components/ui";
import type { PricingRule } from "@/lib/pricing";
import { aptText, amenitiesOf, isAgency, typeWorthShowing } from "@/lib/intl/apartment-text";
import { GUIDE_PAIRS, MAX_SEARCH_GUESTS, type Lang } from "@/lib/intl/config";
import { getApartment, getRules, todayIso } from "@/lib/intl/data";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";
import { fromNight, fromWeek, upcomingWeeks } from "@/lib/intl/pricing-view";
import { parseSearch } from "@/lib/intl/search";
import Crumbs from "../Crumbs";
import BookingPanel, { BookingFromUrl, type PanelProps } from "./BookingPanel";
import Photos from "./Photos";
import ReadMore from "./ReadMore";

/*
 * /en/apartments/[id], /fr/apartments/[id]: a static page per apartment
 * (regenerated every few minutes). The apartment and its pricing rules
 * (rulesWithAirbnb) are read here, so the HTML already has the title,
 * description, facts, photos and the price from the season's lowest; the
 * booking card gets the rules as props and prices the URL's dates in the
 * browser. An unknown id is notFound(), in the metadata too.
 */

const FALLBACK_IMAGES = ["/apt1.jpg", "/apt2.jpg", "/apt3.jpg"];

export async function apartmentMetadata(lang: Lang, id: string): Promise<Metadata> {
  const apt = await getApartment(id);
  if (!apt) notFound();
  const t = DICT[lang];
  const text = aptText(apt, lang);
  const facts = [
    typeWorthShowing(text) ?? "",
    apt.max_guests ? t.common.upTo(Number(apt.max_guests)).toLowerCase() : "",
    apt.sqm ? t.common.sqm(Number(apt.sqm)) : "",
    isAgency(apt) ? t.common.agencyApt.toLowerCase() : t.common.ourApt.toLowerCase(),
  ].filter(Boolean).join(", ");
  return pageMetadata(lang, `/apartments/${apt.id}`, {
    title: t.meta.aptTitle(`${text.name}${text.code ? ` (${text.code})` : ""}`),
    description: t.meta.aptDesc(text.name, facts),
    image: apt.images?.[0] ?? null,
  });
}

export default async function ApartmentPage({ lang, id }: { lang: Lang; id: string }) {
  const apt = await getApartment(id);
  if (!apt) notFound();

  const t = DICT[lang];
  const today = todayIso();
  const agency = isAgency(apt);
  const text = aptText(apt, lang);
  const weeks = upcomingWeeks(apt, today);

  const rulesMap: Record<string, PricingRule[]> | null = agency ? {} : await getRules([apt.id]);
  const rulesOk = agency || !!rulesMap;
  const rules = rulesMap?.[apt.id] ?? [];
  const fromPrice = agency ? fromWeek(apt, today) : rulesOk ? fromNight(apt, rules, today) : null;

  const images = apt.images?.length ? apt.images : FALLBACK_IMAGES;
  const amenities = amenitiesOf(apt, lang);
  const meta = [
    t.common.valThorens,
    typeWorthShowing(text),
    apt.max_guests ? t.common.upTo(Number(apt.max_guests)) : "",
    apt.sqm ? t.common.sqm(Number(apt.sqm)) : "",
    agency ? t.common.agencyApt : t.common.ourApt,
  ].filter(Boolean).join(" · ");
  // guests, type, bathrooms, m² (never `beds`: see lib/intl/apartment-text.ts)
  const facts = [
    apt.max_guests ? { v: t.apt.upToShort(Number(apt.max_guests)), l: t.apt.facts.guests } : null,
    text.type ? { v: text.type, l: t.apt.facts.type } : null,
    apt.baths ? { v: String(apt.baths), l: t.apt.facts.bathrooms } : null,
    apt.sqm ? { v: t.common.sqm(Number(apt.sqm)), l: t.apt.facts.size } : null,
  ].filter((f): f is { v: string; l: string } => !!f);

  const mapEmbed = apt.map_url?.match(/src="(https:\/\/www\.google\.com\/maps\/embed\?[^"]+)"/)?.[1] ?? null;
  const mapLink = apt.map_url && !apt.map_url.includes("<") && /^https?:\/\//.test(apt.map_url.trim()) ? apt.map_url.trim() : null;

  const panel: PanelProps = {
    lang, todayIso: today, rules, rulesOk, fromPrice,
    apt: {
      id: apt.id, orderName: apt.name, name: text.name, source: apt.source ?? null,
      price_per_night: Number(apt.price_per_night) || 0, weeks, maxGuests: Number(apt.max_guests) || MAX_SEARCH_GUESTS,
    },
  };
  const plain = parseSearch({}, today);

  // what the page is about, for search engines and AI answers: only facts shown on the page
  const url = `${SITE}/${lang}/apartments/${apt.id}`;
  const prices = agency ? weeks.map(w => w.price) : [];
  const ld = [{
    "@context": "https://schema.org",
    "@type": "Apartment",
    "@id": `${url}#apartment`,
    name: text.name,
    url,
    inLanguage: lang,
    description: text.description.replace(/\s+/g, " ").trim().slice(0, 600),
    ...(apt.images?.length ? { image: apt.images.slice(0, 10) } : {}),
    ...(apt.baths ? { numberOfBathroomsTotal: Number(apt.baths) } : {}),
    ...(apt.sqm ? { floorSize: { "@type": "QuantitativeValue", value: Number(apt.sqm), unitCode: "MTK" } } : {}),
    ...(apt.max_guests ? { occupancy: { "@type": "QuantitativeValue", maxValue: Number(apt.max_guests) } } : {}),
    address: { "@type": "PostalAddress", addressLocality: "Val Thorens", postalCode: "73440", addressRegion: "Savoie", addressCountry: "FR" },
    containedInPlace: VAL_THORENS,
  },
  ...(prices.length ? [{
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    url,
    itemOffered: { "@id": `${url}#apartment` },
    seller: { "@id": ORG_ID },
    priceCurrency: "EUR",
    lowPrice: Math.min(...prices),
    highPrice: Math.max(...prices),
    offerCount: prices.length,
    availability: "https://schema.org/InStock",
  }] : []),
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.nav.home, item: `${SITE}/${lang}` },
      { "@type": "ListItem", position: 2, name: t.nav.apartments, item: `${SITE}/${lang}/apartments` },
      { "@type": "ListItem", position: 3, name: text.name, item: url },
    ],
  }];

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <div className={`${wrap} pt-5 md:pt-7`}>
        <Crumbs lang={lang} className="mb-3 md:mb-4" items={[
          { label: t.nav.home, href: `/${lang}` },
          { label: t.nav.apartments, href: `/${lang}/apartments` },
          { label: text.name },
        ]} />
        <div className="flex flex-col gap-2 mb-5 md:mb-6 min-w-0">
          <h1 className={h1}>{text.name}</h1>
          <p className="text-[15px] md:text-[17px] text-muted">{meta}</p>
        </div>
        <Photos lang={lang} images={images} name={text.name} />
      </div>

      <div className={`${wrap} pt-7 md:pt-9 pb-12 md:pb-24 flex flex-col lg:flex-row gap-10 lg:gap-12 items-start`}>
        <div className="flex-1 min-w-0 w-full flex flex-col gap-10 md:gap-12">
          <section aria-labelledby="about" className="flex flex-col gap-4">
            <h2 id="about" className={h2}>{t.apt.about}</h2>
            <ReadMore lang={lang} text={text.description} />
            {facts.length > 0 && (
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {facts.map(f => (
                  <div key={f.l} className="rounded-2xl border border-line p-3.5 md:p-4 flex flex-col-reverse justify-end">
                    <dt className="text-[14px] text-muted">{f.l}</dt>
                    <dd className="font-display font-bold text-[18px] md:text-[20px] text-ink leading-snug">{f.v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {amenities.length > 0 && (
            <section aria-labelledby="amenities" className="flex flex-col gap-3">
              <h2 id="amenities" className="font-display font-bold text-[21px] md:text-[23px] text-ink">{t.apt.amenities}</h2>
              <ul className="flex flex-wrap gap-2">
                {amenities.map(a => <li key={a} className={chip}><Check size={15} />{a}</li>)}
              </ul>
            </section>
          )}

          <section aria-labelledby="where" className="flex flex-col gap-3">
            <h2 id="where" className="font-display font-bold text-[21px] md:text-[23px] text-ink">{t.apt.where}</h2>
            {mapEmbed && (
              <iframe src={mapEmbed} title={t.apt.mapTitle(text.name)} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
                className="w-full h-[260px] md:h-[320px] rounded-[18px] border border-line bg-soft" />
            )}
            <div className="rounded-[18px] bg-soft border border-line p-4 md:p-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px] md:text-[16px] leading-relaxed text-body max-w-[560px]">{t.apt.whereText}</p>
              {mapLink && (
                <a href={mapLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 font-bold bg-white border border-line-strong hover:border-ink text-ink rounded-[14px] min-h-[44px] px-4 text-[15px] transition-colors">
                  {t.apt.openMaps}
                </a>
              )}
            </div>
          </section>

          <section aria-labelledby="gtk" className="flex flex-col gap-3">
            <h2 id="gtk" className="font-display font-bold text-[21px] md:text-[23px] text-ink">{t.apt.goodToKnow}</h2>
            <ul className="flex flex-col gap-2 text-[15px] md:text-[16px] text-body">
              {agency && <li className="flex items-start gap-2"><Check className="mt-[5px]" />{t.apt.gtkWeekly}</li>}
              <li className="flex items-start gap-2"><Check className="mt-[5px]" />
                <span>{t.apt.gtkTerms} <Link href={`/${lang}/terms`} className="font-bold text-accent hover:text-accent-hover">{t.apt.gtkTermsLink}</Link>.</span>
              </li>
              <li className="flex items-start gap-2"><Check className="mt-[5px]" />{t.apt.gtkCard}</li>
            </ul>
          </section>

          {/* the guides, for the rest of the trip */}
          <nav aria-labelledby="plan" className="flex flex-col gap-3">
            <h2 id="plan" className="font-display font-bold text-[21px] md:text-[23px] text-ink">{t.guides.plan}</h2>
            <ul className="flex flex-wrap gap-2">
              {GUIDE_PAIRS.map(p => (
                <li key={p.key}>
                  <Link href={`/${lang}/guide/${p[lang]}`}
                    className="inline-flex items-center min-h-[44px] px-4 rounded-full border border-line bg-white text-[15px] font-bold text-ink hover:border-line-strong hover:text-accent transition-colors">
                    {t.guides.short[p.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* the static HTML has the card without dates; the browser applies the URL's */}
        <Suspense fallback={<BookingPanel {...panel} initial={plain} />}>
          <BookingFromUrl {...panel} />
        </Suspense>
      </div>
    </div>
  );
}
