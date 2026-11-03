import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * Everything the seller area keeps, as the latest sync_log row with job='seller_config'
 * (the DB has no table for it and we can't add one from here, same as the coupons).
 * Every save adds a row; only the last 30 are kept.
 *
 *   sellers[email].telegram   chat id the alerts go to
 *   sellers[email].touched    leads he wrote to from the seller area (lead → phone, first time)
 *                             → an order from that phone, made after it, is his automatically
 *   sellers[email].customers  his saved customers: star, note (by phone)
 *   orders[code].seller       Idan's override: an email = his, "" = nobody's, missing = automatic
 *   orders[code].profit       Idan's override of the order's profit (€), when the estimate is off
 */
export type Touch = { phone: string; at: string };
export type SavedCustomer = { name?: string; note?: string; saved?: boolean; at: string };
export type SellerData = { telegram?: number; touched: Record<string, Touch>; customers: Record<string, SavedCustomer> };
export type OrderOverride = { seller?: string; profit?: number };
export type SellerConfig = { sellers: Record<string, SellerData>; orders: Record<string, OrderOverride> };

const JOB = "seller_config";
const KEEP = 30;

export async function readSellerConfig(db: SupabaseClient): Promise<SellerConfig> {
  const { data } = await db.from("sync_log").select("detail").eq("job", JOB)
    .order("id", { ascending: false }).limit(1).maybeSingle();
  const d = (data?.detail ?? {}) as Partial<SellerConfig>;
  return { sellers: d.sellers && typeof d.sellers === "object" ? d.sellers : {}, orders: d.orders && typeof d.orders === "object" ? d.orders : {} };
}

export function sellerData(cfg: SellerConfig, email: string): SellerData {
  const s = cfg.sellers[email] ?? {};
  return { telegram: s.telegram, touched: s.touched ?? {}, customers: s.customers ?? {} };
}

/** read → change → save, as one step (the latest row wins) */
export async function updateSellerConfig(db: SupabaseClient, change: (cfg: SellerConfig) => boolean | void): Promise<SellerConfig> {
  const cfg = await readSellerConfig(db);
  if (change(cfg) === false) return cfg;
  const { data } = await db.from("sync_log").insert({ job: JOB, ok: true, detail: cfg }).select("id").single();
  if (data?.id) await db.from("sync_log").delete().eq("job", JOB).lt("id", Number(data.id) - KEEP);
  return cfg;
}

/** the seller wrote to this lead: remember it (only the first time) */
export async function recordTouch(db: SupabaseClient, email: string, lead: string, phone: string): Promise<void> {
  await updateSellerConfig(db, cfg => {
    const s = sellerData(cfg, email);
    if (s.touched[lead]) return false;
    s.touched[lead] = { phone, at: new Date().toISOString() };
    cfg.sellers[email] = s;
  });
}
