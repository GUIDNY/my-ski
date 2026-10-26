import { createServerClient } from "@/lib/supabase-server";
import { PUBLIC_APARTMENT_COLUMNS } from "@/lib/apartment-fields";
import { withListedSize } from "@/lib/apartment-display";
import { rulesWithAirbnb } from "@/lib/airbnb-calendar";
import { fromNight } from "@/lib/intl/pricing-view";
import type { Apartment, SkiPass } from "@/types";
import ApartmentsClient from "./ApartmentsClient";
import ApartmentsGuide, { apartmentsIntro } from "./ApartmentsGuide";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/*
 * "דירות בואל טורנס": all the apartments, loaded on the server, so the page
 * arrives with the list and plain links to every apartment, for people and
 * for search engines. Around it, the text (prices by week, what fits, what
 * can be added, questions), built from the same live data. Picking dates and
 * filtering happen in the browser on top.
 */
export default async function ApartmentsPage({ searchParams }: Props) {
  await searchParams; // dates and guests are read from the address by the list
  const db = createServerClient();
  const [{ data }, { data: passes }] = await Promise.all([
    db.from("apartments").select(PUBLIC_APARTMENT_COLUMNS)
      .eq("available", true).order("created_at", { ascending: false }),
    db.from("ski_passes").select("*").eq("available", true).eq("type", "adult"),
  ]);
  const apartments = ((data ?? []) as unknown as Apartment[]).map(withListedSize);
  // our apartments are priced per night from the Airbnb calendar: without dates
  // the card shows the cheapest night of the season (as the English pages do)
  const own = apartments.filter(a => a.source !== "la_cime");
  const rules = await rulesWithAirbnb(db, own.map(a => a.id));
  const today = new Date().toISOString().slice(0, 10);
  const fromNights: Record<string, number> = {};
  if (rules) for (const a of own) {
    const p = fromNight(a, rules.get(a.id) ?? [], today);
    if (p) fromNights[a.id] = Math.round(p);
  }
  return (
    <>
      {/* the cards show one photo and three amenities: the rest (descriptions, all the photos) stays on the apartment pages,
          so the list of 250+ apartments doesn't weigh megabytes */}
      <ApartmentsClient initialApartments={apartments.map(a => ({ ...a, description: "", images: (a.images ?? []).slice(0, 1), amenities: (a.amenities ?? []).slice(0, 3) }))} intro={apartmentsIntro()} fromNights={fromNights} />
      <ApartmentsGuide apartments={apartments} passes={(passes ?? []) as SkiPass[]} />
    </>
  );
}
