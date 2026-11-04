import { chatAdmin } from "@/lib/helper-chat";
import { SELLERS, phoneDigits } from "@/lib/sellers";
import { sellerData, type SellerConfig } from "@/lib/seller-store";

/*
 * Whose lead is it. In order:
 *   1. Idan assigned it (seller-store leads[lead]: an email, or "" = nobody's)
 *   2. a seller wrote to it from the seller area (touched)
 *   3. automatic: Idan chose a seller for new leads (autoAssign), and the lead started after that
 * A seller sees only his leads, their quotes and their orders (an order from the lead's
 * phone, made after the conversation started).
 */
export type LeadRow = { lead: string; phone?: string; firstAt?: string; name?: string; channel?: string } & Record<string, unknown>;
export type LeadOwner = { seller: string | null; by: "manual" | "touched" | "auto" | null };

/** n8n's "2026-11-03 22:00" is Israel time */
export function leadTime(s: unknown): string {
  const v = String(s || "");
  if (!v) return "";
  const t = Date.parse(v.includes("T") ? v : v.replace(" ", "T") + ":00+02:00");
  return isNaN(t) ? "" : new Date(t).toISOString();
}

export function leadOwner(cfg: SellerConfig, l: LeadRow): LeadOwner {
  const m = cfg.leads[l.lead];
  if (m) return { seller: SELLERS.some(s => s.email === m.seller) ? m.seller : null, by: "manual" };
  let best: { email: string; at: string } | null = null;
  for (const s of SELLERS) {
    const t = sellerData(cfg, s.email).touched[l.lead];
    if (t && (!best || t.at < best.at)) best = { email: s.email, at: t.at };
  }
  if (best) return { seller: best.email, by: "touched" };
  const a = cfg.autoAssign;
  const first = leadTime(l.firstAt);
  if (a && SELLERS.some(s => s.email === a.seller) && first && first >= a.since) return { seller: a.seller, by: "auto" };
  return { seller: null, by: null };
}

/**
 * phone → {seller, since}: what the order attribution reads. "since" = when the
 * conversation started (or when he first wrote, for a lead the list doesn't have).
 */
export function phoneOwners(cfg: SellerConfig, leads: LeadRow[]): Map<string, { seller: string; since: string }> {
  const out = new Map<string, { seller: string; since: string }>();
  const put = (phone: string, seller: string, since: string) => {
    const d = phoneDigits(phone);
    if (d.length < 9 || out.has(d)) return;
    out.set(d, { seller, since });
  };
  const known = new Set<string>();
  for (const l of leads) {
    known.add(l.lead);
    const o = leadOwner(cfg, l);
    if (o.seller) put(String(l.phone || ""), o.seller, leadTime(l.firstAt) || cfg.leads[l.lead]?.at || "");
  }
  // leads that are not in the list (any more): what was stored when it was assigned or touched
  for (const [lead, m] of Object.entries(cfg.leads)) if (!known.has(lead) && m.seller) put(m.phone, m.seller, m.at);
  for (const s of SELLERS) for (const [lead, t] of Object.entries(sellerData(cfg, s.email).touched)) {
    if (!known.has(lead) && !cfg.leads[lead]) put(t.phone, s.email, t.at);
  }
  return out;
}

/* the leads list from n8n, kept for 30 seconds (the chat screen polls it, and every seller call needs it) */
let cache: { at: number; leads: LeadRow[] } | null = null;
export async function leadList(fresh = false): Promise<LeadRow[] | null> {
  if (!fresh && cache && Date.now() - cache.at < 30_000) return cache.leads;
  const r = await chatAdmin({ action: "list" });
  if (!r) return cache?.leads ?? null;
  const leads = ((r.chats as LeadRow[]) || []).filter(l => l && typeof l.lead === "string");
  cache = { at: Date.now(), leads };
  return leads;
}
