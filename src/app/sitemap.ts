import type { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase-server";
import { GUIDES } from "@/lib/guides";
import { alternatesFor } from "@/lib/intl/metadata";

const SITE_URL = "https://skisharebook.com";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/apartments", priority: 0.9, changeFrequency: "daily" },
  { path: "/search", priority: 0.8, changeFrequency: "daily" },
  { path: "/weekly", priority: 0.8, changeFrequency: "daily" },
  { path: "/combo", priority: 0.7, changeFrequency: "weekly" },
  { path: "/transfers", priority: 0.6, changeFrequency: "weekly" },
  { path: "/seasonaires", priority: 0.6, changeFrequency: "weekly" },
  { path: "/guide", priority: 0.9, changeFrequency: "weekly" },
  { path: "/emergency-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/cancellation-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "monthly" },
  { path: "/cookies", priority: 0.1, changeFrequency: "monthly" },
  { path: "/accessibility", priority: 0.1, changeFrequency: "monthly" },
];

// The English and French site (/en, /fr): the Hebrew page each one translates
// (hreflang alternates for all three languages, on the Hebrew entries too)
const INTL_ROUTES: { rest: string; he: string; priority: number; changeFrequency: "daily" | "monthly" }[] = [
  { rest: "", he: "/", priority: 0.9, changeFrequency: "daily" },
  { rest: "/apartments", he: "/apartments", priority: 0.8, changeFrequency: "daily" },
  { rest: "/terms", he: "/terms", priority: 0.2, changeFrequency: "monthly" },
  { rest: "/privacy", he: "/privacy", priority: 0.2, changeFrequency: "monthly" },
];
const INTL_REST_OF_HE = new Map(INTL_ROUTES.map(r => [r.he, r.rest]));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(r => {
    const rest = INTL_REST_OF_HE.get(r.path);
    return {
      url: `${SITE_URL}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      ...(rest !== undefined ? { alternates: { languages: alternatesFor(rest) } } : {}),
    };
  });

  const intlEntries: MetadataRoute.Sitemap = INTL_ROUTES.flatMap(r => (["en", "fr"] as const).map(lang => ({
    url: `${SITE_URL}/${lang}${r.rest}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
    alternates: { languages: alternatesFor(r.rest) },
  })));

  const guideEntries: MetadataRoute.Sitemap = GUIDES.map(g => ({
    url: `${SITE_URL}/guide/${g.slug}`,
    lastModified: new Date(g.updated),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  let apartmentEntries: MetadataRoute.Sitemap = [];
  try {
    const db = createServerClient();
    const { data } = await db.from("apartments").select("id, created_at").eq("available", true);
    apartmentEntries = (data ?? []).flatMap(a => {
      const lastModified = a.created_at ? new Date(a.created_at) : now;
      const alternates = { languages: alternatesFor(`/apartments/${a.id}`) };
      return [
        { url: `${SITE_URL}/apartments/${a.id}`, lastModified, changeFrequency: "daily" as const, priority: 0.8, alternates },
        { url: `${SITE_URL}/en/apartments/${a.id}`, lastModified, changeFrequency: "daily" as const, priority: 0.7, alternates },
        { url: `${SITE_URL}/fr/apartments/${a.id}`, lastModified, changeFrequency: "daily" as const, priority: 0.7, alternates },
      ];
    });
  } catch {
    // sitemap should still render even if the DB is briefly unreachable
  }

  return [...staticEntries, ...intlEntries, ...guideEntries, ...apartmentEntries];
}
