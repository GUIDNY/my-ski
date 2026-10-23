import { createServerClient } from "@/lib/supabase-server";
import { PUBLIC_APARTMENT_COLUMNS } from "@/lib/apartment-fields";
import type { Apartment } from "@/types";
import ApartmentsClient from "./ApartmentsClient";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/*
 * All the apartments, loaded on the server: the page arrives with the list
 * and plain links to every apartment, for people and for search engines.
 * Picking dates and filtering happen in the browser on top.
 */
export default async function ApartmentsPage({ searchParams }: Props) {
  await searchParams; // dates and guests are read from the address by the list
  const db = createServerClient();
  const { data } = await db.from("apartments").select(PUBLIC_APARTMENT_COLUMNS)
    .eq("available", true).order("created_at", { ascending: false });
  return <ApartmentsClient initialApartments={(data ?? []) as unknown as Apartment[]} />;
}
