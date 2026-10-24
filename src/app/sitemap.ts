import type { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase-server";
import { GUIDES } from "@/lib/guides";
import { siteUrl } from "@/lib/site";
import { alternatesFor, guideAlternates } from "@/lib/intl/metadata";
import { guidePair } from "@/lib/intl/config";
import { intlGuides } from "@/lib/intl/guides";

// the apartment list changes with the daily sync: rebuild the sitemap every hour
export const revalidate = 3600;

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/apartments", priority: 0.9, changeFrequency: "daily" },
  { path: "/packages", priority: 0.9, changeFrequency: "daily" },
  { path: "/weekly", priority: 0.8, changeFrequency: "daily" },
  { path: "/transfers", priority: 0.6, changeFrequency: "weekly" },
  { path: "/seasonaires", priority: 0.6, changeFrequency: "weekly" },
  { path: "/guide", priority: 0.9, changeFrequency: "weekly" },
  { path: "/val-thorens-weather", priority: 0.8, changeFrequency: "daily" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/emergency-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/cancellation-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "monthly" },
  { path: "/cookies", priority: 0.1, changeFrequency: "monthly" },
  { path: "/accessibility", priority: 0.1, changeFrequency: "monthly" },
];

// The English and French site (/en, /fr): the Hebrew page each one translates
// (hreflang alternates for all three languages, on the Hebrew entries too)
const INTL_ROUTES: { rest: string; he: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { rest: "", he: "/", priority: 0.9, changeFrequency: "daily" },
  { rest: "/apartments", he: "/apartments", priority: 0.8, changeFrequency: "daily" },
  { rest: "/guide", he: "/guide", priority: 0.7, changeFrequency: "weekly" },
  { rest: "/val-thorens-weather", he: "/val-thorens-weather", priority: 0.7, changeFrequency: "daily" },
  { rest: "/terms", he: "/terms", priority: 0.2, changeFrequency: "monthly" },
  { rest: "/privacy", he: "/privacy", priority: 0.2, changeFrequency: "monthly" },
];
const INTL_REST_OF_HE = new Map(INTL_ROUTES.map(r => [r.he, r.rest]));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // no made-up "last modified" dates: only the guides have a real one
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(r => {
    const rest = INTL_REST_OF_HE.get(r.path);
    return {
      url: siteUrl(r.path),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      ...(rest !== undefined ? { alternates: { languages: alternatesFor(rest) } } : {}),
    };
  });

  const intlEntries: MetadataRoute.Sitemap = INTL_ROUTES.flatMap(r => (["en", "fr"] as const).map(lang => ({
    url: siteUrl(`/${lang}${r.rest}`),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
    alternates: { languages: alternatesFor(r.rest) },
  })));

  const guideEntries: MetadataRoute.Sitemap = GUIDES.map(g => {
    // the same guide in English and French, when there is one
    const pair = guidePair("he", g.slug);
    return {
      // Hebrew addresses percent-encoded, as Google asks for in sitemaps
      url: siteUrl(`/guide/${g.slug}`),
      lastModified: new Date(g.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...(pair ? { alternates: { languages: guideAlternates(pair) } } : {}),
    };
  });

  // the guides of /en/guide and /fr/guide, each with its versions in the other languages
  const intlGuideEntries: MetadataRoute.Sitemap = (["en", "fr"] as const).flatMap(lang => intlGuides(lang).map(g => ({
    url: siteUrl(`/${lang}/guide/${g.slug}`),
    lastModified: new Date(g.updated),
    changeFrequency: "weekly" as const,
    priority: 0.7,
    alternates: { languages: guideAlternates(g.pair) },
  })));

  let apartmentEntries: MetadataRoute.Sitemap = [];
  try {
    const db = createServerClient();
    const { data } = await db.from("apartments").select("id").eq("available", true);
    apartmentEntries = (data ?? []).flatMap(a => {
      const alternates = { languages: alternatesFor(`/apartments/${a.id}`) };
      return [
        { url: siteUrl(`/apartments/${a.id}`), changeFrequency: "daily" as const, priority: 0.8, alternates },
        { url: siteUrl(`/en/apartments/${a.id}`), changeFrequency: "daily" as const, priority: 0.7, alternates },
        { url: siteUrl(`/fr/apartments/${a.id}`), changeFrequency: "daily" as const, priority: 0.7, alternates },
      ];
    });
  } catch {
    // sitemap should still render even if the DB is briefly unreachable
  }

  return [...staticEntries, ...intlEntries, ...guideEntries, ...intlGuideEntries, ...apartmentEntries];
}
