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
