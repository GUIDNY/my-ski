import type { Metadata } from "next";
import { siteUrl } from "./site";

/*
 * Title, description, canonical and the share preview (WhatsApp, Facebook,
 * X) of a page, all from one place. Without it a page inherits the home
 * page's og:url and og:title, so a shared link previews as the home page.
 */
export function pageMeta(o: {
  title: string;
  description: string;
  /** the page's path, e.g. "/apartments" */
  path: string;
  /** a share image; the site's default (1200×630) when not given */
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  noindex?: boolean;
  /** hreflang: the same page in other languages (src/lib/intl/metadata.ts alternatesFor) */
  languages?: Record<string, string>;
}): Metadata {
  const url = siteUrl(o.path);
  // the link preview (WhatsApp, Facebook) shows no prices (Idan, 23.11): sentences with a price are left out there
  const share = shareText(o.description);
  // no image of its own: the page's preview card (/api/og/page, lib/og-card), drawn for its path
  const images = o.image
    ? [{ url: o.image, alt: o.imageAlt ?? o.title }]
    : [{ url: `/api/og/page?path=${encodeURIComponent(o.path)}`, width: 1200, height: 630, type: "image/jpeg", alt: o.imageAlt ?? o.title }];
  return {
    title: { absolute: o.title },
    description: o.description,
    alternates: o.languages ? { canonical: url, languages: o.languages } : { canonical: url },
    openGraph: {
      type: o.type ?? "website",
      siteName: "SkiShare",
      locale: "he_IL",
      url,
      title: o.title,
      description: share,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: o.title,
      description: share,
      images: images.map(i => i.url),
    },
    ...(o.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** a description without its sentences that name a price (€ / ₪), for link previews */
export function shareText(d: string) {
  const kept = d.split(/(?<=[.!?])\s+/).filter(x => !/[€₪]|\d+\s*(?:יורו|אירו|ש"ח)/.test(x));
  return kept.join(" ").trim() || d.replace(/[^.,]*[€₪][^.,]*[.,]?/g, "").replace(/\s+/g, " ").trim();
}
