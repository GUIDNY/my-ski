import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SELLERS, type Seller } from "@/lib/sellers";

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
 *   leads[lead]               Idan's assignment of a lead: seller email ("" = nobody), its phone, when
 *   autoAssign                new leads from `since` on go to this seller by themselves (lib/seller-leads)
 *   manualLeads[id]           leads added by hand ("+ ליד חדש": a phone call, a referral): id "m_…"
 *   sellerList                the sellers table (email, name, share), edited by Idan; missing = DEFAULT_SELLERS
 */
export type Touch = { phone: string; at: string };
export type SavedCustomer = { name?: string; note?: string; saved?: boolean; at: string };
export type SellerData = { telegram?: number; touched: Record<string, Touch>; customers: Record<string, SavedCustomer> };
export type OrderOverride = { seller?: string; profit?: number };
export type LeadAssign = { seller: string; phone: string; at: string };
export type AutoAssign = { seller: string; since: string };
/** firstAt/lastAt like n8n's leads: "YYYY-MM-DD HH:mm", Israel time */
export type ManualLead = { name: string; phone: string; note: string; status: string; by: string; firstAt: string; lastAt: string };
export type SellerConfig = {
  sellers: Record<string, SellerData>; orders: Record<string, OrderOverride>;
  leads: Record<string, LeadAssign>; autoAssign?: AutoAssign;
  manualLeads: Record<string, ManualLead>;
  sellerList?: Seller[];
};

const JOB = "seller_config";
const KEEP = 30;

export async function readSellerConfig(db: SupabaseClient): Promise<SellerConfig> {
  const { data } = await db.from("sync_log").select("detail").eq("job", JOB)
    .order("id", { ascending: false }).limit(1).maybeSingle();
  const d = (data?.detail ?? {}) as Partial<SellerConfig>;
  const obj = <T,>(x: unknown): Record<string, T> => (x && typeof x === "object" ? x as Record<string, T> : {});
  return {
    sellers: obj<SellerData>(d.sellers), orders: obj<OrderOverride>(d.orders), leads: obj<LeadAssign>(d.leads),
    manualLeads: obj<ManualLead>(d.manualLeads),
    ...(Array.isArray(d.sellerList) ? { sellerList: d.sellerList } : {}),
    ...(d.autoAssign?.seller ? { autoAssign: d.autoAssign } : {}),
  };
}

/** the sellers right now: Idan's table, or the starting list */
export const sellersOf = (cfg: SellerConfig): Seller[] => cfg.sellerList ?? DEFAULT_SELLERS;

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
