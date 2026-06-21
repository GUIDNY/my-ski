import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) return NextResponse.json([]);
  const db = createServerClient();
  const { data, error } = await db
    .from("saved_trips")
    .select("id, checkin, checkout, guests, created_at, extra_apartment_id, apartment:apartments(id, name, type, images, price_per_night, beds, baths, sqm)")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // attach the second apartment for combo saves (no FK relationship to join on)
  const extraIds = Array.from(new Set((data ?? []).map(s => s.extra_apartment_id).filter(Boolean)));
  let extraMap: Record<string, unknown> = {};
  if (extraIds.length) {
    const { data: extras } = await db.from("apartments").select("id, name, type, images, price_per_night, beds, baths, sqm").in("id", extraIds);
    extraMap = Object.fromEntries((extras ?? []).map(a => [a.id, a]));
  }
  const enriched = (data ?? []).map(s => ({ ...s, extra_apartment: s.extra_apartment_id ? extraMap[s.extra_apartment_id] ?? null : null }));
  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const b = await req.json();
  if (!b.user_id || !b.apartment_id) return NextResponse.json({ error: "missing" }, { status: 400 });
  const { error } = await db.from("saved_trips").upsert({
    user_id: b.user_id,
    apartment_id: b.apartment_id,
    extra_apartment_id: b.extra_apartment_id || null,
    checkin: b.checkin || null,
    checkout: b.checkout || null,
    guests: Number(b.guests ?? 2),
  }, { onConflict: "user_id,apartment_id,checkin,checkout", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
