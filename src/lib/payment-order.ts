import { createServerClient } from "@/lib/supabase-server";
import { getSellRate } from "@/lib/fx";

/*
 * A payment that came in with no order on the site behind it: a pay button
 * on a quote (the PDF or /p/<id>) or a link the bot made for Idan. It still
 * becomes an order, so it shows in the admin (and can be charged there when
 * PayPlus only holds the amount), and the customer gets the "received" email.
 * The quote's details (apartment, dates, guests) come from the proposal when
 * the link carried one ("p:<proposal id>"), otherwise from the description
 * ("… 2026-12-10 עד 2026-12-17").
 * One order per PayPlus transaction: a repeated IPN finds the same order.
 */

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
const ISO = /(\d{4}-\d{2}-\d{2})\D+?(\d{4}-\d{2}-\d{2})/;

type Rows = [string, string][];

function fromProposal(data: unknown): { apt?: string; checkin?: string; checkout?: string; guests?: number } {
  const d = (data || {}) as { title?: string; sections?: { blocks?: { type?: string; rows?: Rows }[] }[] };
  const rows: Rows = [];
  for (const s of d.sections || []) for (const b of s.blocks || []) if (b.type === "summary" && Array.isArray(b.rows)) rows.push(...b.rows);
  const get = (k: string) => rows.find(r => r[0] === k)?.[1] || "";
  const dates = get("תאריכים").match(ISO);
  const g = parseInt(get("מספר אורחים"), 10);
  return {
    apt: get("לינה") || d.title || undefined,
    checkin: dates?.[1], checkout: dates?.[2],
    guests: g > 0 ? g : undefined,
  };
}

export async function orderFromPayment(opts: {
  ref: string; txUid: string; description: string; amount: number; currency: string;
  name: string; email: string; phone: string;
}): Promise<{ code: string; created: boolean } | null> {
  try { return await make(opts); } catch (e) { console.error("[payplus] order from payment", e); return null; }
}

async function make(opts: Parameters<typeof orderFromPayment>[0]): Promise<{ code: string; created: boolean } | null> {
  const db = createServerClient();
  if (opts.txUid) {
    const { data: same } = await db.from("orders").select("code").eq("payplus_transaction_uid", opts.txUid).maybeSingle();
    if (same?.code) return { code: same.code, created: false };
  }

  let info: ReturnType<typeof fromProposal> = {};
  if (opts.ref.startsWith("p:")) {
    try {
      const { data: p } = await db.from("proposals").select("data").eq("id", opts.ref.slice(2)).maybeSingle();
      if (p) info = fromProposal(p.data);
    } catch { /* fall back to the description */ }
  }
  if (!info.checkin) {
    const m = opts.description.match(ISO);
    if (m) { info.checkin = m[1]; info.checkout = m[2]; }
  }
  const nights = info.checkin && info.checkout
    ? Math.max(0, Math.round((Date.parse(info.checkout) - Date.parse(info.checkin)) / 864e5)) : 0;
  const cur = (opts.currency || "ILS").toUpperCase();
  const totalEur = cur === "EUR" ? opts.amount : Math.round(opts.amount / (await getSellRate()));

  const row = {
    apartment_id: null,
    apartment_name: (info.apt ? `${info.apt} · ` : "") + (opts.description || "תשלום"),
    area: "Val Thorens",
    checkin: info.checkin || null,
    checkout: info.checkout || null,
    guests: info.guests || 1,
    nights,
    ski_pass: false, transfer: false, equipment: false, flight: false,
    cancel: "none", service: "human",
    total_eur: totalEur,
    amount_ils: cur === "ILS" ? opts.amount : null,
    status: "awaiting",
    customer_name: opts.name,
    customer_email: opts.email.toLowerCase(),
    customer_phone: opts.phone,
    payplus_transaction_uid: opts.txUid || null,
  };
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const { data, error } = await db.from("orders").insert({ code, ...row }).select("code").single();
    if (!error && data) return { code: data.code, created: true };
    if (error && !/duplicate|unique/i.test(error.message)) { console.error("[payplus] order from payment failed", error.message); return null; }
  }
  return null;
}
