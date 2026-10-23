import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PricingRule } from "@/lib/pricing";
import { parseAirbnbCalendar, airbnbRules, type AirbnbCalendar } from "@/lib/airbnb-rules";

/**
 * Our own apartments are priced like the WhatsApp/Telegram bots price them:
 * the apartment's Airbnb nightly prices plus the listing's cleaning fee, minus
 * the Airbnb host commission. The calendar comes from n8n ("SkiShare – אתר:
 * צ'אט ומחירים"), which reads it from Hostex with the bots' own Hostex
 * credential; the site never holds a Hostex key. Server-only.
 *
 * N8N_SITE_URL = https://<n8n>/webhook/<secret path>; the calendar is
 * `${N8N_SITE_URL}/prices`. Without it (or when n8n can't be reached and
 * nothing is cached yet) apartments keep the site's own seasonal pricing.
 */

// n8n's webhooks "ignore bots": a plain server fetch (user agent "node") gets
// 403 "Authorization data is wrong!", so say who we are in a browser-style UA.
export const N8N_UA = "Mozilla/5.0 (Linux x86_64) SkiShareSite/1.0";

async function fetchAirbnbCalendar(): Promise<AirbnbCalendar> {
  const res = await fetch(`${process.env.N8N_SITE_URL}/prices`, {
    cache: "no-store",
    headers: { "User-Agent": N8N_UA },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`airbnb calendar: n8n answered ${res.status}`);
  return parseAirbnbCalendar(await res.json());
}

// Shared by every instance through Next's data cache; refreshed in the
// background every 30 minutes (the stale copy keeps serving meanwhile).
const cachedCalendar = unstable_cache(fetchAirbnbCalendar, ["airbnb-calendar-v1"], {
  revalidate: 1800,
  tags: ["airbnb-calendar"],
});

let lastGood: AirbnbCalendar | null = null;
let failedAt = 0;

export async function getAirbnbCalendar(): Promise<AirbnbCalendar | null> {
  if (!process.env.N8N_SITE_URL) return null;
  // after a failure, don't make every page view wait on n8n again for a minute
  if (Date.now() - failedAt < 60_000) return lastGood;
  try {
    lastGood = await cachedCalendar();
    return lastGood;
  } catch (e) {
    failedAt = Date.now();
    console.error("airbnb calendar unavailable:", e instanceof Error ? e.message : e);
    return lastGood;
  }
}

/**
 * pricing_rules rows for these apartments plus their Airbnb rules, by
 * apartment. null when the database query fails.
 */
export async function rulesWithAirbnb(db: SupabaseClient, apartmentIds: string[]): Promise<Map<string, PricingRule[]> | null> {
  const byApt = new Map<string, PricingRule[]>(apartmentIds.map(id => [id, []]));
  if (!apartmentIds.length) return byApt;
  const [{ data, error }, cal] = await Promise.all([
    db.from("pricing_rules").select("*").in("apartment_id", apartmentIds),
    getAirbnbCalendar(),
  ]);
  if (error) return null;
  for (const r of (data ?? []) as (PricingRule & { apartment_id: string })[]) byApt.get(r.apartment_id)?.push(r);
  for (const id of apartmentIds) byApt.get(id)!.push(...airbnbRules(cal, id));
  return byApt;
}
