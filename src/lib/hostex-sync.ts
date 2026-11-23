import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * What Hostex should show for site orders: one direct reservation per order (a split-payment
 * group is one reservation) per apartment, on the Hostex property of the apartment's Airbnb
 * listing (from its ical_sources import URL). Read by the n8n workflow "Hostex ← site orders".
 */
export type HostexStay = {
  key: string;            // stable id of the Hostex reservation, e.g. "d2703090323-fadf" or "g080d82a26d-fadf"
  apartment_id: string;
  listing_id: string;     // Airbnb listing id → Hostex property
  checkin: string;
  checkout: string;
  guests: number;
  codes: string[];
  name: string;           // customer name (never exposed publicly)
};

const ACTIVE = ["approved", "hold"];

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** apartment_id → Airbnb listing id, for apartments whose calendar is imported from Airbnb. */
export async function airbnbListings(db: SupabaseClient): Promise<Record<string, string> | null> {
  const { data, error } = await db.from("ical_sources").select("apartment_id, platform, ical_url");
  if (error) return null;
  const out: Record<string, string> = {};
  for (const s of data ?? []) {
    const m = String(s.ical_url || "").match(/airbnb\.[a-z.]+\/calendar\/ical\/(\d+)\.ics/i);
    if (s.apartment_id && m) out[s.apartment_id] = m[1];
  }
  return out;
}

export async function hostexStays(db: SupabaseClient, onlyApartments?: string[]): Promise<{ stays: HostexStay[]; listings: Record<string, string> } | null> {
  const listings = await airbnbListings(db);
  if (!listings) return null;
  const { data, error } = await db.from("orders")
    .select("code, status, apartment_id, extra_apartment_id, checkin, checkout, guests, customer_name, group_id, created_at")
    .in("status", ACTIVE).not("checkin", "is", null).not("checkout", "is", null)
    .gt("checkout", today()).order("created_at");
  if (error) return null;
  const byKey = new Map<string, HostexStay>();
  for (const o of data ?? []) {
    const ci = String(o.checkin).slice(0, 10), co = String(o.checkout).slice(0, 10);
    // a split-payment group is one stay; so are older per-person shares without a group (same
    // apartment, same dates: the site never sells the same nights twice)
    const base = o.group_id ? "g" + String(o.group_id).replace(/-/g, "").slice(0, 10) : "d" + ci.replace(/-/g, "").slice(2) + co.replace(/-/g, "").slice(4);
    for (const apt of [o.apartment_id, o.extra_apartment_id]) {
      if (!apt || !listings[apt]) continue;
      if (onlyApartments && !onlyApartments.includes(apt)) continue;
      const key = `${base}-${String(apt).slice(0, 4)}`;
      const cur = byKey.get(key);
      if (!cur) {
        byKey.set(key, { key, apartment_id: apt, listing_id: listings[apt], checkin: ci, checkout: co, guests: Number(o.guests) || 1, codes: [String(o.code)], name: String(o.customer_name || "").trim() });
      } else {
        if (ci < cur.checkin) cur.checkin = ci;
        if (co > cur.checkout) cur.checkout = co;
        cur.guests = Math.max(cur.guests, Number(o.guests) || 1);
        cur.codes.push(String(o.code));
      }
    }
  }
  return { stays: [...byKey.values()], listings };
}

/** Future nights held on the site (active orders + manual blocks) per Airbnb-linked apartment. */
export async function heldNights(db: SupabaseClient, apartmentIds: string[]): Promise<Record<string, string[]> | null> {
  const out: Record<string, string[]> = {};
  for (const id of apartmentIds) out[id] = [];
  if (!apartmentIds.length) return out;
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("availability_blocks")
      .select("apartment_id, date")
      .in("apartment_id", apartmentIds).in("source", ["order", "manual"]).gte("date", today())
      .order("apartment_id").order("date").range(from, from + PAGE - 1);
    if (error) return null;
    for (const b of data ?? []) out[b.apartment_id]?.push(String(b.date).slice(0, 10));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

/**
 * Tell n8n right away that site orders changed. The push carries only the names of the active
 * stays (for the reservation title); n8n decides what to create or cancel from the public
 * /api/hostex-sync (dates only), so a forged push can't move availability. Never throws.
 */
export async function pushHostexSync(db: SupabaseClient, apartmentIds: (string | null | undefined)[]) {
  const ids = [...new Set(apartmentIds.filter(Boolean) as string[])];
  if (!ids.length) return;
  const url = process.env.HOSTEX_SYNC_WEBHOOK_URL || "https://n8n.skisharebook.com/webhook/skishare-hostex-sync";
  let names: Record<string, string> = {};
  try {
    const r = await hostexStays(db, ids);
    if (r) names = Object.fromEntries(r.stays.map(s => [s.key, s.name]));
  } catch { /* names are cosmetic */ }
  try {
    await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apartment_ids: ids, names }),
      signal: AbortSignal.timeout(5000),
    });
  } catch { /* the n8n catch-up run every 20 minutes handles anything missed */ }
}
