import type { SupabaseClient } from "@supabase/supabase-js";
import { phoneDigits } from "@/lib/sellers";
import { leadList, phoneOwners, type LeadRow } from "@/lib/seller-leads";
import { readSellerConfig, sellersOf, type SellerConfig } from "@/lib/seller-store";
import { apartmentsForProfit, profitFromData } from "@/lib/proposal-profit";

/*
 * Whose order is it, and how much did we make on it.
 * - owner: Idan's choice when he set one (orders[code].seller: an email, or "" for nobody);
 *   otherwise automatic: the seller whose lead that phone is (lib/seller-leads: assigned,
 *   written to, or auto-assigned), when the order came after the conversation started.
 * - profit: Idan's number when he set one; otherwise the estimate from the order's
 *   proposal (lib/proposal-profit); site orders without a proposal wait for his number.
 * - share: the seller's part of the profit (lib/sellers.ts), only for paid orders
 *   (approved / hold), never for cancelled or unpaid ones.
 */
export type SellerOrder = {
  code: string; customer: string; phone: string; apartment: string;
  checkin: string | null; checkout: string | null; guests: number; total: number; status: string; createdAt: string;
  owner: string | null; ownerBy: "auto" | "manual" | null;
  profit: number | null; profitBy: "manual" | "proposal" | null;
  share: number | null; counts: boolean; proposalId: string | null;
};

const PAID = new Set(["approved", "hold"]);

export async function sellerOrders(db: SupabaseClient, cfg?: SellerConfig, leads?: LeadRow[]): Promise<{ orders: SellerOrder[]; cfg: SellerConfig }> {
  const conf = cfg ?? await readSellerConfig(db);
  const owners = phoneOwners(conf, leads ?? await leadList() ?? []);
  const { data: rows } = await db.from("orders")
    .select("code, customer_name, customer_phone, apartment_name, checkin, checkout, guests, total_eur, status, created_at, ops")
    .order("created_at", { ascending: false }).limit(400);
  const list = rows ?? [];

  // the proposals behind the orders: their phone (when the order has none) and their profit
  const pids = [...new Set(list.map(o => (o.ops as Record<string, unknown> | null)?.x_proposal).filter((x): x is string => typeof x === "string"))];
  const props = new Map<string, { phone: string; data: unknown }>();
  if (pids.length) {
    const { data } = await db.from("proposals").select("id, client_phone, data").in("id", pids);
    for (const p of data ?? []) props.set(p.id, { phone: String(p.client_phone || ""), data: p.data });
  }
  const apts = pids.length ? await apartmentsForProfit(db) : [];

  const orders = list.map(o => {
    const ops = (o.ops ?? {}) as Record<string, unknown>;
    const pid = typeof ops.x_proposal === "string" ? ops.x_proposal : null;
    const prop = pid ? props.get(pid) : undefined;
    const phone = phoneDigits(o.customer_phone) || phoneDigits(prop?.phone);
    const ov = conf.orders[o.code] ?? {};

    let owner: string | null = null, ownerBy: SellerOrder["ownerBy"] = null;
    if (typeof ov.seller === "string") { owner = ov.seller || null; ownerBy = "manual"; }
    else {
      const t = phone ? owners.get(phone) : undefined;
      if (t && (!t.since || Date.parse(t.since) <= Date.parse(String(o.created_at)))) { owner = t.seller; ownerBy = "auto"; }
    }

    let profit: number | null = null, profitBy: SellerOrder["profitBy"] = null;
    if (typeof ov.profit === "number") { profit = ov.profit; profitBy = "manual"; }
    else if (prop) {
      const p = profitFromData(prop.data, apts);
      if (p && p.lines.length) { profit = p.totalProfit; profitBy = "proposal"; }
    }

    const seller = sellersOf(conf).find(s => s.email === owner);
    const counts = PAID.has(String(o.status));
    return {
      code: o.code, customer: String(o.customer_name || ""), phone, apartment: String(o.apartment_name || ""),
      checkin: o.checkin, checkout: o.checkout, guests: Number(o.guests) || 0, total: Number(o.total_eur) || 0,
      status: String(o.status), createdAt: String(o.created_at),
      owner, ownerBy, profit, profitBy,
      share: seller && counts && profit != null ? Math.round(profit * seller.share) : null,
      counts, proposalId: pid,
    } satisfies SellerOrder;
  });
  return { orders, cfg: conf };
}

export function totals(orders: SellerOrder[]) {
  const mine = orders.filter(o => o.counts);
  return {
    orders: mine.length,
    sales: mine.reduce((s, o) => s + o.total, 0),
    profit: mine.reduce((s, o) => s + (o.profit ?? 0), 0),
    share: mine.reduce((s, o) => s + (o.share ?? 0), 0),
    waitingProfit: mine.filter(o => o.profit == null).length,
  };
}
