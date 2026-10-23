import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { pageMeta } from "@/lib/page-meta";
import { aptDisplayName, aptMetaDescription, aptParts } from "@/lib/apartment-display";
import type { Apartment } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createServerClient();
  const { data } = await db.from("apartments")
    .select("name, type, price_per_night, images, max_guests, sqm, source, available_weeks")
    .eq("id", id).maybeSingle();
  const apt = data as Pick<Apartment, "name" | "type" | "price_per_night" | "images" | "max_guests" | "sqm" | "source" | "available_weeks"> | null;

  // a wrong or removed apartment: a real 404, not an empty page with a 200
  if (!apt) notFound();

  const name = aptDisplayName(apt);
  const { code } = aptParts(apt);
  return pageMeta({
    // the agency's code keeps titles of look-alike studios apart
    title: `${name}${code ? ` (${code})` : ""} | SkiShare`,
    description: aptMetaDescription(apt),
    path: `/apartments/${id}`,
    image: apt.images?.[0] ?? null,
    imageAlt: name,
  });
}

export default function ApartmentDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
