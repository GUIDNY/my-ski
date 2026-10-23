import { cache } from "react";
import { aptSqm } from "@/lib/apartment-display";
import { createServerClient } from "@/lib/supabase-server";
import { rulesWithAirbnb } from "@/lib/airbnb-calendar";
import { takenApartmentIds } from "@/lib/inventory";
import { AIRBNB_SOURCE, type PricingRule } from "@/lib/pricing";
import type { Apartment } from "@/types";
import { SEASON_END, SEASON_START } from "./config";
import { isoOf } from "./format";

/*
 * Server-side reads for the English and French pages, with the same Supabase
 * client and the same helpers as the Hebrew site's API routes
 * (/api/apartments, /api/pricing-rules, /api/availability/blocked). Only the
 * columns the pages show are selected: never the supplier fields
 * (source_price_per_night, owner_payments, source_ref), since everything here
 * may end up in the page sent to the browser.
 */

const FIELDS = "id,name,type,baths,sqm,max_guests,map_url,price_per_night,images,amenities,available,source,available_weeks,description";

/** the size the listing's own (Hebrew) text states, then the text is dropped: it isn't shown here */
function publicOf(row: PublicApartment & { description?: string | null }): PublicApartment {
  const { description, ...rest } = row;
  const sqm = aptSqm({ sqm: rest.sqm, description });
  return sqm && sqm !== rest.sqm ? { ...rest, sqm } : rest;
}

export type PublicApartment = Pick<Apartment,
  "id" | "name" | "type" | "baths" | "sqm" | "max_guests" | "map_url" | "price_per_night"
  | "images" | "amenities" | "available" | "source" | "available_weeks">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Today on the server (YYYY-MM-DD). Passed down so the browser renders the same days. */
export const todayIso = () => isoOf(new Date());

/** One apartment, or null when there is no such (or no longer offered) apartment. Throws when the database fails. */
export const getApartment = cache(async (id: string): Promise<PublicApartment | null> => {
  if (!UUID.test(id)) return null;
  const { data, error } = await createServerClient().from("apartments").select(FIELDS).eq("id", id).maybeSingle();
  if (error) throw new Error(`apartment ${id}: ${error.message}`);
  const apt = data ? publicOf(data as PublicApartment) : null;
  return apt && apt.available !== false ? apt : null;
});

/** The apartments on offer (newest first, like /api/apartments), or null when the database fails. */
export const getApartments = cache(async (): Promise<PublicApartment[] | null> => {
  const { data, error } = await createServerClient().from("apartments").select(FIELDS)
    .eq("available", true).order("created_at", { ascending: false });
  return error ? null : ((data ?? []) as PublicApartment[]).map(publicOf);
});

/* Only what lib/pricing.ts reads, in the order /api/pricing-rules returns it
   (the Airbnb calendar first, then the site's rules by priority). Date rules
   outside the bookable season can't touch any price here, so they stay out
   of the page. */
const inSeason = (r: PricingRule) =>
  r.type !== "date_range" || ((r.end_date ?? "") >= SEASON_START && (r.start_date ?? "") <= SEASON_END);

function forPricing(rules: PricingRule[]): PricingRule[] {
  const strip = (r: PricingRule): PricingRule => ({
    id: r.id, label: "", type: r.type, price_type: r.price_type ?? "absolute",
    start_date: r.start_date ?? undefined, end_date: r.end_date ?? undefined,
    months: r.months ?? undefined, weekdays: r.weekdays ?? undefined,
    price: Number(r.price), priority: Number(r.priority), source: r.source ?? undefined,
  });
  const airbnb = rules.filter(r => r.source === AIRBNB_SOURCE);
  const site = rules.filter(r => r.source !== AIRBNB_SOURCE).sort((a, b) => b.priority - a.priority);
  return [...airbnb, ...site].filter(inSeason).map(strip);
}

const rulesByKey = cache(async (key: string): Promise<Record<string, PricingRule[]> | null> => {
  const ids = key ? key.split(",") : [];
  const map = await rulesWithAirbnb(createServerClient(), ids);
  if (!map) return null;
  return Object.fromEntries(ids.map(id => [id, forPricing(map.get(id) ?? [])]));
});

/** Pricing rules (with the Airbnb calendar) of our own apartments, by id; null when they can't be read. */
export const getRules = (ids: string[]) => rulesByKey(Array.from(new Set(ids)).sort().join(","));

/** Ids of the apartments taken for these dates (same rule as /api/availability/blocked); null when unknown. */
export const getTaken = cache(async (checkin: string, checkout: string): Promise<string[] | null> => {
  const taken = await takenApartmentIds(createServerClient(), checkin, checkout);
  return taken ? Array.from(taken) : null;
});
