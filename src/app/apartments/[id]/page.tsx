import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { rulesWithAirbnb } from "@/lib/airbnb-calendar";
import { PUBLIC_APARTMENT_COLUMNS } from "@/lib/apartment-fields";
import { aptDisplayName, aptShortName } from "@/lib/apartment-display";
import { ORG_ID, VAL_THORENS, breadcrumbLd, ldJson } from "@/lib/site";
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
  const name = aptDisplayName(a);
  // what the page is about, for search engines and AI answers (only facts from the listing)
  const plain = (t: string) => t.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();
  const today = new Date().toISOString().slice(0, 10);
  const weeks = a.source === "la_cime" ? (a.available_weeks ?? []).filter(w => w.week >= today && w.price > 0) : [];
  const prices = weeks.map(w => w.price);
  const ld = [{
    "@context": "https://schema.org",
    "@type": "Apartment",
    "@id": `${url}#apartment`,
    name,
    url,
    ...(a.description ? { description: plain(a.description).slice(0, 600) } : {}),
    ...(a.images?.length ? { image: a.images.slice(0, 10) } : {}),
    ...(a.baths ? { numberOfBathroomsTotal: a.baths } : {}),
    ...(a.sqm ? { floorSize: { "@type": "QuantitativeValue", value: a.sqm, unitCode: "MTK" } } : {}),
    ...(a.max_guests ? { occupancy: { "@type": "QuantitativeValue", maxValue: a.max_guests } } : {}),
    address: { "@type": "PostalAddress", addressLocality: "Val Thorens", postalCode: "73440", addressRegion: "Savoie", addressCountry: "FR" },
    containedInPlace: VAL_THORENS,
    ...(a.amenities?.length ? { amenityFeature: a.amenities.map(n => ({ "@type": "LocationFeatureSpecification", name: n, value: true })) } : {}),
  },
  // agency apartments: the open weeks and their prices are listed on the page
  ...(prices.length ? [{
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    "@id": `${url}#weeks`,
    url,
    itemOffered: { "@id": `${url}#apartment` },
    seller: { "@id": ORG_ID },
    priceCurrency: "EUR",
    lowPrice: Math.min(...prices),
    highPrice: Math.max(...prices),
    offerCount: prices.length,
    availability: "https://schema.org/InStock",
    description: "שבוע שלם משבת לשבת, לדירה כולה",
  }] : []),
  breadcrumbLd([["דף הבית", "/"], ["דירות בואל טורנס", "/apartments"], [aptShortName(a), `/apartments/${id}`]]),
  ];
  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
    <ApartmentClient
      initialApt={a}
      initialRules={rules?.get(id) ?? []}
      initialPasses={(passes ?? []) as SkiPass[]}
    />
    </>
  );
}
