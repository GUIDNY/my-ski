import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase-server";
import type { Apartment } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const db = createServerClient();
  const { data } = await db.from("apartments").select("name, description, price_per_night, images, beds, max_guests").eq("id", id).single();
  const apt = data as Pick<Apartment, "name" | "description" | "price_per_night" | "images" | "beds" | "max_guests"> | null;

  if (!apt) return { title: "דירה בואל טורנס | SkiShare" };

  const title = `${apt.name} — דירה בואל טורנס | SkiShare`;
  const description = `${apt.name}: דירה בואל טורנס עם ${apt.beds} חדרים, עד ${apt.max_guests ?? "-"} אורחים, החל מ-€${apt.price_per_night}/לילה. סקי פס, הסעה וציוד סקי אפשר להוסיף לאותה הזמנה.`;
  const url = `https://skisharebook.com/apartments/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images: apt.images?.[0] ? [{ url: apt.images[0] }] : undefined,
    },
  };
}

export default function ApartmentDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
