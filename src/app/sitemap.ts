import type { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase-server";
import { GUIDES } from "@/lib/guides";

const SITE_URL = "https://skisharebook.com";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/apartments", priority: 0.9, changeFrequency: "daily" },
  { path: "/search", priority: 0.8, changeFrequency: "daily" },
  { path: "/combo", priority: 0.7, changeFrequency: "weekly" },
  { path: "/transfers", priority: 0.6, changeFrequency: "weekly" },
  { path: "/seasonaires", priority: 0.6, changeFrequency: "weekly" },
  { path: "/guide", priority: 0.9, changeFrequency: "weekly" },
  { path: "/cancellation-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(r => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

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
    apartmentEntries = (data ?? []).map(a => ({
      url: `${SITE_URL}/apartments/${a.id}`,
      lastModified: a.created_at ? new Date(a.created_at) : now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    // sitemap should still render even if the DB is briefly unreachable
  }

  return [...staticEntries, ...guideEntries, ...apartmentEntries];
}
