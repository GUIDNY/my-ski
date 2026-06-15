import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// short id: 6 chars, no ambiguous characters (no 0/O/1/l/I)
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function shortId(len = 6) {
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const b = await req.json();

  const row = {
    apartment_id:   b.apartment_id ?? null,
    apartment_name: b.apartment ?? "",
    checkin:        b.checkin || null,
    checkout:       b.checkout || null,
    guests:         Number(b.guests ?? 2),
    nights:         Number(b.nights ?? 1),
    ski_pass:       b.ski_pass === true || b.ski_pass === "true",
    transfer:       b.transfer === true || b.transfer === "true",
    cancel:         b.cancel ?? "none",
    service:        b.service ?? "human",
    apt_total:      Number(b.apt_total ?? 0),
    grand_total:    Number(b.grand_total ?? 0),
  };

  // try a few times in case of a short-id collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = shortId();
    const { data, error } = await db.from("quotes").insert({ id, ...row }).select("id").single();
    if (!error && data) return NextResponse.json({ id: data.id }, { status: 201 });
    if (error && !/duplicate key|unique/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "could not allocate id" }, { status: 500 });
}
