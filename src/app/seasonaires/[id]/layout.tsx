import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { pageMeta } from "@/lib/page-meta";
import type { SeasonRental } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createServerClient();
  const { data } = await db.from("season_rentals").select("name, area, beds, sleeps, price_per_month, images").eq("id", id).maybeSingle();
  const r = data as Pick<SeasonRental, "name" | "area" | "beds" | "sleeps" | "price_per_month" | "images"> | null;

  // a wrong or removed rental: a real 404 (metadata is sent before the page for search engines)
  if (!r) notFound();

  return pageMeta({
    title: `${r.name}: דירה לעונה שלמה בואל טורנס | SkiShare`,
    description: `${r.name}: דירה לעונה שלמה ב${r.area}, עד ${r.sleeps} אנשים, החל מ-€${r.price_per_month.toLocaleString("en-US")} לחודש.`,
    path: `/seasonaires/${id}`,
    image: r.images?.[0] ?? null,
    imageAlt: r.name,
  });
}

export default function SeasonaireDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
