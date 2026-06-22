import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const gen = (n = 6) => Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

// Create a split-payment group (one per shared booking)
export async function POST(req: NextRequest) {
  const db = createServerClient();
  const b = await req.json();
  const row = {
    apartment_id: b.apartment_id || null,
    extra_apartment_id: b.extra_apartment_id || null,
    apartment_name: b.apartment_name || "",
    area: b.area || "Val Thorens",
    checkin: b.checkin || null,
    checkout: b.checkout || null,
    guests: Number(b.guests ?? 2),
    accommodation_total: Number(b.accommodation_total ?? 0),
    shares_total: Number(b.shares_total ?? 2),
  };
  for (let i = 0; i < 5; i++) {
    const code = gen();
    const { data, error } = await db.from("booking_groups").insert({ code, ...row }).select("id, code").single();
    if (!error && data) return NextResponse.json(data, { status: 201 });
    if (error && !/duplicate|unique/i.test(error.message)) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "could not allocate code" }, { status: 500 });
}

// Fetch a group + payment progress by code
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });
  const db = createServerClient();
  const { data: group, error } = await db.from("booking_groups").select("*").eq("code", code).single();
  if (error || !group) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: orders } = await db.from("orders")
    .select("share_amount, status, customer_name, ski_pass, transfer")
    .eq("group_id", group.id);
  const paid = (orders ?? []).filter(o => o.status === "hold" || o.status === "approved");
  const sharePrice = group.shares_total ? Math.round(Number(group.accommodation_total) / group.shares_total) : Number(group.accommodation_total);

  return NextResponse.json({
    group,
    share_price: sharePrice,
    shares_total: group.shares_total,
    shares_paid: paid.length,
    accommodation_paid: paid.reduce((s, o) => s + (Number(o.share_amount) || 0), 0),
    payers: paid.map(o => ({ name: o.customer_name, ski_pass: o.ski_pass, transfer: o.transfer })),
  });
}
