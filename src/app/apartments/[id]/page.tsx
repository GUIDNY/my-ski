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
  return (
    <ApartmentClient
      initialApt={apt as unknown as Apartment}
      initialRules={rules?.get(id) ?? []}
      initialPasses={(passes ?? []) as SkiPass[]}
    />
  );
}
