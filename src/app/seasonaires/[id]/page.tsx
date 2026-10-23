import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { breadcrumbLd, ldJson } from "@/lib/site";
import type { SeasonRental } from "@/types";
import RentalClient from "./RentalClient";

/*
 * A season rental. Read on the server, so the page arrives with the rental
 * (it used to load in the browser). A wrong or removed id is a real 404.
 */
export default async function SeasonRentalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createServerClient();
  const { data } = await db.from("season_rentals").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const r = data as SeasonRental;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([["דף הבית", "/"], ["אזור הסיזיונרים", "/seasonaires"], [r.name, `/seasonaires/${id}`]])) }} />
      <RentalClient rental={r} />
    </>
  );
}
