import { createServerClient } from "@/lib/supabase-server";
import { heldNights, hostexStays } from "@/lib/hostex-sync";
import { NextResponse } from "next/server";

// Read by the n8n workflow "Hostex ← site orders" (every 20 minutes and on every order change):
// the Hostex reservations the site's active orders need (key, apartment, Airbnb listing, dates,
// guests, order codes) and the nights the site holds per apartment. Dates only, no customer data:
// the same nights the public iCal feed already exposes. Names come to n8n only in the site's push.
export async function GET() {
  const db = createServerClient();
  const r = await hostexStays(db);
  if (!r) return NextResponse.json({ ok: false, error: "lookup failed" }, { status: 503 });
  const keep = await heldNights(db, Object.keys(r.listings));
  if (!keep) return NextResponse.json({ ok: false, error: "lookup failed" }, { status: 503 });
  const stays = r.stays.map(s => ({ key: s.key, apartment_id: s.apartment_id, listing_id: s.listing_id, checkin: s.checkin, checkout: s.checkout, guests: s.guests, codes: s.codes }));
  return NextResponse.json({ ok: true, listings: r.listings, stays, keep }, { headers: { "Cache-Control": "no-store" } });
}
