import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { pageMeta } from "@/lib/page-meta";
import { aptDisplayName, aptMetaDescription, aptParts, withListedSize } from "@/lib/apartment-display";
import { alternatesFor } from "@/lib/intl/metadata";
import type { Apartment } from "@/types";
import { aptIdOf, aptSegment } from "@/lib/apartment-url";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = aptIdOf(decodeURIComponent((await params).id));
  if (!id) notFound();
  const db = createServerClient();
  const { data } = await db.from("apartments")
    .select("name, type, price_per_night, images, max_guests, sqm, source, available_weeks, available, description")
    .eq("id", id).maybeSingle();
  const row = data as Pick<Apartment, "name" | "type" | "price_per_night" | "images" | "max_guests" | "sqm" | "source" | "available_weeks" | "available" | "description"> | null;
  const apt = row ? withListedSize(row) : null;

  // a wrong or removed apartment: a real 404, not an empty page with a 200
  if (!apt) notFound();

  const name = aptDisplayName(apt);
  const path = `/apartments/${aptSegment({ ...apt, id })}`;
  const { code } = aptParts(apt);
  return pageMeta({
    // the agency's code keeps titles of look-alike studios apart
    title: `${name}${code ? ` (${code})` : ""} | SkiShare`,
    description: aptMetaDescription(apt),
    path,
    // the preview card: the apartment's photo, name, size and price (lib/og-card)
    image: `/api/og/apt/${id}`,
    imageAlt: name,
    // the English and French pages exist only for apartments on offer
    ...(apt.available ? { languages: alternatesFor(path) } : {}),
  });
}

export default function ApartmentDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
