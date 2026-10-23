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
  const images = o.image
    ? [{ url: o.image, alt: o.imageAlt ?? o.title }]
    : [{ url: "/og.jpg", width: 1200, height: 630, alt: o.imageAlt ?? o.title }];
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
      description: o.description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: o.title,
      description: o.description,
      images: images.map(i => i.url),
    },
    ...(o.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
