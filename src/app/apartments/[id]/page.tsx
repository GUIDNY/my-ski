import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { rulesWithAirbnb } from "@/lib/airbnb-calendar";
import { PUBLIC_APARTMENT_COLUMNS } from "@/lib/apartment-fields";
import type { Apartment, SkiPass } from "@/types";
import ApartmentClient from "./ApartmentClient";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/*
 * The apartment page. The apartment, its prices (incl. the Airbnb calendar)
 * and the ski passes load here on the server, so the page arrives complete:
 * people see it at once and search engines can read it (they used to get
 * only the loading screen). The booking parts run in the browser on top.
 */
export default async function ApartmentPage({ params, searchParams }: Props) {
  const { id } = await params;
  await searchParams; // the booking parts read the dates and guests from the address
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createServerClient();
  const [{ data: apt }, rules, { data: passes }] = await Promise.all([
    db.from("apartments").select(PUBLIC_APARTMENT_COLUMNS).eq("id", id).maybeSingle(),
    rulesWithAirbnb(db, [id]),
    db.from("ski_passes").select("*").eq("available", true).order("price"),
  ]);
  if (!apt) notFound();
  const a = apt as unknown as Apartment;
  const url = `https://skisharebook.com/apartments/${id}`;
  // what the page is about, for search engines and AI answers (only facts from the listing)
  const plain = (t: string) => t.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();
  const ld = [{
    "@context": "https://schema.org",
    "@type": "Apartment",
    "@id": `${url}#apartment`,
    name: a.name,
    url,
    ...(a.description ? { description: plain(a.description).slice(0, 600) } : {}),
    ...(a.images?.length ? { image: a.images.slice(0, 6) } : {}),
    ...(a.baths ? { numberOfBathroomsTotal: a.baths } : {}),
    ...(a.sqm ? { floorSize: { "@type": "QuantitativeValue", value: a.sqm, unitCode: "MTK" } } : {}),
    ...(a.max_guests ? { occupancy: { "@type": "QuantitativeValue", maxValue: a.max_guests } } : {}),
    address: { "@type": "PostalAddress", addressLocality: "Val Thorens", postalCode: "73440", addressRegion: "Savoie", addressCountry: "FR" },
    containedInPlace: { "@type": "Place", name: "Val Thorens, Les 3 Vallées" },
    ...(a.amenities?.length ? { amenityFeature: a.amenities.map(n => ({ "@type": "LocationFeatureSpecification", name: n, value: true })) } : {}),
  }, {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "דף הבית", item: "https://skisharebook.com/" },
      { "@type": "ListItem", position: 2, name: "דירות בואל טורנס", item: "https://skisharebook.com/apartments" },
      { "@type": "ListItem", position: 3, name: a.name, item: url },
    ],
  }];
  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    <ApartmentClient
      initialApt={a}
      initialRules={rules?.get(id) ?? []}
      initialPasses={(passes ?? []) as SkiPass[]}
    />
    </>
  );
}
