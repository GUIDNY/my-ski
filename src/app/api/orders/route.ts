import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const code = (n = 6) => Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db.from("orders").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const b = await req.json();
  const row = {
    apartment_id:   b.apartment_id || null,
    apartment_name: b.apartment || b.apartment_name || "",
    area:           b.area || "Val Thorens",
    checkin:        b.checkin || null,
    checkout:       b.checkout || null,
    guests:         Number(b.guests ?? 2),
    nights:         Number(b.nights ?? 1),
    ski_pass:       b.ski_pass === true || b.ski_pass === "true",
    transfer:       b.transfer === true || b.transfer === "true",
    cancel:         b.cancel || "none",
    service:        b.service || "human",
    total_eur:      Number(b.grand_total ?? b.total_eur ?? 0),
  };
  for (let i = 0; i < 5; i++) {
    const c = code();
    const { data, error } = await db.from("orders").insert({ code: c, ...row }).select("code").single();
    if (!error && data) return NextResponse.json({ code: data.code }, { status: 201 });
    if (error && !/duplicate|unique/i.test(error.message)) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "could not allocate code" }, { status: 500 });
}
