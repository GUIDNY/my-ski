import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";
import type { SeasonRental } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const db = createServerClient();
  const { data } = await db.from("season_rentals").select("name, area, beds, sleeps, price_per_month, images").eq("id", id).single();
  const r = data as Pick<SeasonRental, "name" | "area" | "beds" | "sleeps" | "price_per_month" | "images"> | null;

  if (!r) return { title: "דירה לעונה שלמה בואל טורנס | SkiShare" };

  const title = `${r.name} — דירה לעונה שלמה בואל טורנס | SkiShare`;
  const description = `${r.name}: דירה לעונה שלמה ב${r.area}, ${r.beds} חדרים, עד ${r.sleeps} אנשים, החל מ-€${r.price_per_month.toLocaleString()}/חודש.`;
  const url = `https://skisharebook.com/seasonaires/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images: r.images?.[0] ? [{ url: r.images[0] }] : undefined,
    },
  };
}

export default function SeasonaireDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
