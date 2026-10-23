import { createServerClient } from "@/lib/supabase-server";
import { PUBLIC_APARTMENT_COLUMNS } from "@/lib/apartment-fields";
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
  const apartments = (data ?? []) as unknown as Apartment[];
  return (
    <>
      <ApartmentsClient initialApartments={apartments} intro={apartmentsIntro()} />
      <ApartmentsGuide apartments={apartments} passes={(passes ?? []) as SkiPass[]} />
    </>
  );
}
