import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * Coupon codes, kept as the latest sync_log row with job='coupons' (the DB
 * has no coupons table and we can't add one from here; the list is tiny and
 * every save keeps history). Admin manages the list; checkout validates.
 */
export type Coupon = {
  code: string;            // stored lowercase, no spaces
  percent?: number;        // e.g. 5 = 5% off
  amount?: number;         // or a fixed € off
  note?: string;
  active: boolean;
  expires?: string | null; // YYYY-MM-DD (inclusive)
  uses?: number;           // how many orders used it (best-effort counter)
};

export async function readCoupons(db: SupabaseClient): Promise<Coupon[]> {
  const { data } = await db.from("sync_log").select("detail").eq("job", "coupons")
    .order("id", { ascending: false }).limit(1).maybeSingle();
  const list = (data?.detail as { coupons?: Coupon[] } | null)?.coupons;
  return Array.isArray(list) ? list : [];
}

export async function saveCoupons(db: SupabaseClient, coupons: Coupon[]): Promise<void> {
  await db.from("sync_log").insert({ job: "coupons", ok: true, detail: { coupons } });
}

export const normCode = (s: unknown) => String(s || "").trim().toLowerCase().replace(/\s+/g, "");

/** discount in € for this code on this total, or null when the code doesn't apply */
export async function couponDiscount(db: SupabaseClient, code: string, totalEur: number): Promise<{ coupon: Coupon; discount: number } | null> {
  const c = (await readCoupons(db)).find(x => normCode(x.code) === normCode(code));
  if (!c || !c.active) return null;
  if (c.expires && c.expires < new Date().toISOString().slice(0, 10)) return null;
  const raw = c.percent ? totalEur * (Number(c.percent) / 100) : Number(c.amount) || 0;
  const discount = Math.min(Math.round(raw), Math.max(0, Math.round(totalEur)));
  return discount > 0 ? { coupon: c, discount } : null;
}
