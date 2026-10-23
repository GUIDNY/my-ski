import type { Metadata } from "next";
import { SITE_URL, guidePath, hebrewEquivalent, type GuidePair, type Lang } from "./config";
import { DICT } from "./dict";

/*
 * <head> of the English and French pages: title and description in the page's
 * language, the canonical URL (never with the query), hreflang links to the
 * Hebrew, English and French versions (x-default: English), Open Graph in the
 * right locale. The root layout's Hebrew defaults are replaced field by field
 * (metadata merges shallowly), and the Smart App Banner of the Hebrew-only
 * iOS app is left out here.
 */

const OG_LOCALE: Record<Lang, string> = { en: "en_GB", fr: "fr_FR" };

export function alternatesFor(rest: string) {
  const he = hebrewEquivalent(rest);
  return {
    // the Hebrew pages' own canonical URLs (the home is "https://skisharebook.com/")
    ...(he ? { he: `${SITE_URL}${he}` } : {}),
    en: `${SITE_URL}/en${rest}`,
    fr: `${SITE_URL}/fr${rest}`,
    "x-default": `${SITE_URL}/en${rest}`,
  };
}

/**
 * hreflang of a guide: its own address in each language (a guide's slug is
 * different in each), the Hebrew one only when the Hebrew site has that guide.
 */
export function guideAlternates(p: GuidePair) {
  const he = guidePath(p, "he");
  return {
    ...(he ? { he: `${SITE_URL}${he}` } : {}),
    en: `${SITE_URL}${guidePath(p, "en")}`,
    fr: `${SITE_URL}${guidePath(p, "fr")}`,
    "x-default": `${SITE_URL}${guidePath(p, "en")}`,
  };
}

export function pageMetadata(lang: Lang, rest: string, o: {
  title: string; description: string; image?: string | null; noindex?: boolean;
  /** hreflang when the other languages' addresses aren't the same `rest` (a guide: guideAlternates) */
  languages?: Record<string, string>;
  type?: "website" | "article";
}): Metadata {
  const url = `${SITE_URL}/${lang}${rest}`;
  const t = DICT[lang].meta;
  const images = o.image ? [{ url: o.image, alt: o.title }] : [{ url: "/og.jpg", width: 1200, height: 630, alt: t.ogAlt }];
  return {
    title: { absolute: o.title },
    description: o.description,
    alternates: o.noindex ? { canonical: url } : { canonical: url, languages: o.languages ?? alternatesFor(rest) },
    openGraph: {
      type: o.type ?? "website", siteName: "SkiShare", url, title: o.title, description: o.description,
      locale: OG_LOCALE[lang], alternateLocale: [OG_LOCALE[lang === "en" ? "fr" : "en"], "he_IL"], images,
    },
    twitter: { card: "summary_large_image", title: o.title, description: o.description, images: images.map(i => i.url) },
    itunes: null,
    ...(o.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Defaults for anything under /en or /fr without its own metadata (e.g. a 404). */
export function layoutMetadata(lang: Lang): Metadata {
  const t = DICT[lang].meta;
  return {
    title: { absolute: t.homeTitle },
    description: t.siteDesc,
    openGraph: {
      type: "website", siteName: "SkiShare", url: `${SITE_URL}/${lang}`, title: t.homeTitle, description: t.siteDesc,
      locale: OG_LOCALE[lang], images: [{ url: "/og.jpg", width: 1200, height: 630, alt: t.ogAlt }],
    },
    twitter: { card: "summary_large_image", title: t.homeTitle, description: t.siteDesc, images: ["/og.jpg"] },
    itunes: null,
  };
}
