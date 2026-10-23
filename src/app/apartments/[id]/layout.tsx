import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import type { Apartment } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const db = createServerClient();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await db.from("apartments").select("name, description, price_per_night, images, max_guests, sqm, source").eq("id", id).maybeSingle();
  const apt = data as Pick<Apartment, "name" | "description" | "price_per_night" | "images" | "max_guests" | "sqm" | "source"> | null;

  // a wrong or removed apartment: a real 404, not an empty page with a 200
  if (!apt) notFound();

  const title = `${apt.name} — דירה בואל טורנס | SkiShare`;
  const size = [apt.max_guests ? `עד ${apt.max_guests} אנשים` : "", apt.sqm ? `${apt.sqm} מ"ר` : ""].filter(Boolean).join(", ");
  const how = apt.source === "la_cime" ? "לשבוע שלם, שבת עד שבת" : `החל מ-€${Math.round(apt.price_per_night)} ללילה`;
  const description = `${apt.name}: דירה בואל טורנס${size ? `, ${size}` : ""}, ${how}. אפשר להוסיף לאותה הזמנה סקי פס, הסעה מהשדה וציוד.`;
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
