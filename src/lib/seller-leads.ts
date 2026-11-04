import { chatAdmin } from "@/lib/helper-chat";
import { phoneDigits } from "@/lib/sellers";
import { sellerData, sellersOf, type SellerConfig } from "@/lib/seller-store";
import { randomBytes } from "node:crypto";

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
  const SELLERS = sellersOf(cfg);
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
  const SELLERS = sellersOf(cfg);
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

/* ── leads added by hand (seller-store manualLeads, id "m_…") ── */
export const MANUAL_LEAD = /^m_[a-z0-9]{10}$/;
export const newManualId = () => "m_" + randomBytes(8).toString("hex").slice(0, 10);

/** now, the way n8n writes lead times: "2026-11-04 21:47" in Israel */
export function israelStamp(d = new Date()): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(d).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}

/** the hand-added leads as lead rows; one whose phone already talks to the bot is shown as that lead instead */
export function manualRows(cfg: SellerConfig, n8nLeads: LeadRow[]): LeadRow[] {
  const phones = new Set(n8nLeads.map(l => phoneDigits(String(l.phone || ""))).filter(Boolean));
  return Object.entries(cfg.manualLeads)
    .filter(([, m]) => !phones.has(m.phone))
    .map(([id, m]) => ({
      lead: id, sessionId: "", channel: "manual", phone: m.phone, name: m.name, firstAt: m.firstAt, lastAt: m.lastAt,
      lastMessage: m.note || "ליד שנוסף ידנית", messages: 0, quotes: 0, lastTotal: 0, lastQuote: "", status: m.status || "talking",
      live: false, note: m.note, fuStage: 0, optOut: false, lastIdanAt: "",
    }));
}

/** n8n's leads and the hand-added ones, newest first */
export async function allLeads(cfg: SellerConfig, fresh = false): Promise<LeadRow[] | null> {
  const n8n = await leadList(fresh);
  if (!n8n) return null;
  return [...n8n, ...manualRows(cfg, n8n)].sort((a, b) => String(b.lastAt || "").localeCompare(String(a.lastAt || "")));
}

/** a hand-added lead opened in the chat screen: no conversation, its note and status */
export function manualThread(cfg: SellerConfig, id: string) {
  const m = cfg.manualLeads[id];
  return m ? { ok: true, live: false, status: m.status || "talking", lastQuote: "", note: m.note, messages: [], manual: true } : { ok: false, error: "not found" };
}

/** status / note on a hand-added lead (there is no chat to send to: he calls or writes from his own phone) */
export async function manualPost(db: import("@supabase/supabase-js").SupabaseClient, id: string, action: string, b: { status?: unknown; note?: unknown }): Promise<Record<string, unknown>> {
  if (action === "send") return { ok: false, error: "manual" };
  if (action === "release") return { ok: true };
  const { updateSellerConfig } = await import("@/lib/seller-store");
  let found = false;
  await updateSellerConfig(db, cfg => {
    const m = cfg.manualLeads[id];
    if (!m) return false;
    found = true;
    if (typeof b.status === "string" && b.status) m.status = b.status.slice(0, 20);
    if (typeof b.note === "string") m.note = b.note.slice(0, 1000);
    m.lastAt = israelStamp();
  });
  return found ? { ok: true } : { ok: false, error: "not found" };
}
