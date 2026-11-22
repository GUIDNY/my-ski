import { encodeExtras } from "@/lib/quote-extras";
import type { SupabaseClient } from "@supabase/supabase-js";

// short id: 6 chars, no ambiguous characters (no 0/O/1/l/I)
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function shortId(len = 6) {
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

export type QuoteRow = {
  apartment_id: string | null;
  /** the second apartment of a two-apartment booking (/combo) */
  extra_apartment_id?: string | null;
  apartment_name: string;
  checkin: string | null;
  checkout: string | null;
  guests: number;
  nights: number;
  ski_pass: boolean;
  transfer: boolean;
  equipment: boolean;
  cancel: string;
  service: string;
  apt_total: number;
  grand_total: number;
};

// Shared by POST /api/quotes (the admin/manual "share a quote" flow) and the
// AI concierge, which creates one automatically once it's found a single
// apartment that fits — both need the same short-id-with-retry insert.
export async function createQuote(db: SupabaseClient, row: QuoteRow): Promise<{ id: string } | { error: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = shortId();
    const { data, error } = await db.from("quotes").insert({ id, ...row }).select("id").single();
    if (!error && data) return { id: data.id };
    if (error && !/duplicate key|unique/i.test(error.message)) return { error: error.message };
  }
  return { error: "could not allocate id" };
}

/** the choices a stored quote row (+ the ?x of its link) carries, for buildSiteProposal */
export function quoteChoices(q: Record<string, unknown>, id: string, x: string | null): Record<string, string> {
  const guests = Number(q.guests) || 2;
  const xx = x ?? encodeExtras({
    ...(q.ski_pass ? { pass: { area: "val_thorens" as const, qty: guests } } : {}),
    ...(q.transfer ? { transfer: { qty: guests } } : {}),
    ...(q.equipment ? { equipment: { qty: guests } } : {}),
  });
  return {
    apartment_id: String(q.apartment_id || ""), apartment_id2: String(q.extra_apartment_id || ""), checkin: String(q.checkin || ""), checkout: String(q.checkout || ""),
    guests: String(guests), cancel: String(q.cancel || "regular"), service: String(q.service || "human"), x: xx, q: id,
  };
}

/** "2 חדרים — 2 חדרים קרוב למסלולים — ALT003" → "2 חדרים קרוב למסלולים" (agency listings carry a code and a room type) */
export function shortName(name: string) {
  const parts = name.split(/\s+[—–-]\s+/).map(p => p.trim()).filter(Boolean);
  if (parts.length < 2) return name.trim();
  const words = parts.filter(p => !/^[A-Z]{1,5}\d{1,5}[A-Z]?$/.test(p));
  const best = words.filter(p => !words.some(o => o !== p && o.includes(p))).sort((a, b) => b.length - a.length)[0];
  return best || name.trim();
}

