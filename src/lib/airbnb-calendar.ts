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

/* the last calendar n8n gave us, kept in the database (sync_log job "airbnb_calendar") */
const JOB = "airbnb_calendar";
async function storedCalendar(): Promise<unknown | null> {
  try {
    const { createServerClient } = await import("@/lib/supabase-server");
    const { data } = await createServerClient().from("sync_log").select("detail").eq("job", JOB)
      .order("id", { ascending: false }).limit(1).maybeSingle();
    return data?.detail ?? null;
  } catch { return null; }
}
async function storeCalendar(raw: unknown): Promise<void> {
  try {
    const { createServerClient } = await import("@/lib/supabase-server");
    const db = createServerClient();
    const { data } = await db.from("sync_log").insert({ job: JOB, ok: true, detail: raw }).select("id").single();
    if (data?.id) await db.from("sync_log").delete().eq("job", JOB).lt("id", Number(data.id) - 3);
  } catch { /* the site still has the copy in its cache */ }
}

/**
 * n8n, and when n8n fails or is slow, the last good copy from the database.
 * Never throws while a stored copy exists: a failure is then cached like a
 * success, so the next try at n8n is 30 minutes later. (Before, every failed
 * background refresh was retried by the next visitor, and the apartments and
 * search pages ask once per apartment: hundreds of calls to n8n in a minute,
 * which choked the n8n server.)
 */
const FRESH_MS = 25 * 60_000;
const LOCK = "airbnb_calendar_lock";

/* another server instance is asking n8n right now (a lock row from the last minute): don't ask too */
async function someoneElseFetching(): Promise<boolean> {
  try {
    const { createServerClient } = await import("@/lib/supabase-server");
    const db = createServerClient();
    const { data } = await db.from("sync_log").select("detail").eq("job", LOCK).order("id", { ascending: false }).limit(1).maybeSingle();
    const at = Number((data?.detail as { at?: number } | null)?.at) || 0;
    if (Date.now() - at < 60_000) return true;
    const { data: row } = await db.from("sync_log").insert({ job: LOCK, ok: true, detail: { at: Date.now() } }).select("id").single();
    if (row?.id) await db.from("sync_log").delete().eq("job", LOCK).lt("id", Number(row.id));
    return false;
  } catch { return false; }
}

async function fetchAirbnbCalendar(): Promise<AirbnbCalendar> {
  // the copy in the database is fresh (another instance refreshed it), or another instance is
  // refreshing it this minute: use it instead of calling n8n. Many instances missing the cache
  // together used to send ~150 calls to n8n in one second (12.11: n8n → Hostex timed out).
  const stored = await storedCalendar();
  if (stored) {
    const gen = Date.parse(String((stored as { generatedAt?: string }).generatedAt || ""));
    if ((gen && Date.now() - gen < FRESH_MS) || await someoneElseFetching()) {
      try { return parseAirbnbCalendar(stored); } catch { /* bad copy: ask n8n */ }
    }
  }
  try {
    const res = await fetch(`${process.env.N8N_SITE_URL}/prices`, {
      cache: "no-store",
      headers: { "User-Agent": N8N_UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`airbnb calendar: n8n answered ${res.status}`);
    const raw = await res.json();
    const cal = parseAirbnbCalendar(raw);
    await storeCalendar(raw);
    return cal;
  } catch (e) {
    const stored = await storedCalendar();
    if (stored) {
      console.warn("airbnb calendar: n8n failed, using the stored copy:", e instanceof Error ? e.message : e);
      return parseAirbnbCalendar(stored);
    }
    throw e;
  }
}

// Shared by every instance through Next's data cache; refreshed in the
// background every 30 minutes (the stale copy keeps serving meanwhile).
const cachedCalendar = unstable_cache(fetchAirbnbCalendar, ["airbnb-calendar-v1"], {
  revalidate: 1800,
  tags: ["airbnb-calendar"],
});

let lastGood: AirbnbCalendar | null = null;
let failedAt = 0;
// one request at a time per server instance: a page that prices 50 apartments at once,
// on a cold cache, used to send 50 parallel calls to n8n (12.11: n8n → Hostex timed out)
let inflight: Promise<AirbnbCalendar> | null = null;

export async function getAirbnbCalendar(): Promise<AirbnbCalendar | null> {
  if (!process.env.N8N_SITE_URL) return null;
  // after a failure, don't make every page view wait on n8n again for a minute
  if (Date.now() - failedAt < 60_000) return lastGood;
  try {
    if (!inflight) inflight = cachedCalendar().finally(() => { inflight = null; });
    lastGood = await inflight;
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
