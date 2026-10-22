import { createServerClient } from "@/lib/supabase-server";
import { getAirbnbCalendar } from "@/lib/airbnb-calendar";
import { airbnbClosedApartments } from "@/lib/airbnb-rules";
import { NextRequest, NextResponse } from "next/server";

// Returns the apartment_ids that are unavailable for a date range
// (any blocked night between checkin and checkout-1). Covers orders,
// manual blocks and iCal — all live in availability_blocks — plus nights
// already closed on the apartment's live Airbnb calendar.
export async function GET(req: NextRequest) {
  const checkin = req.nextUrl.searchParams.get("checkin");
  const checkout = req.nextUrl.searchParams.get("checkout");
  if (!checkin || !checkout) return NextResponse.json({ blocked: [] });

  const db = createServerClient();
  const [{ data, error }, cal] = await Promise.all([
    db.from("availability_blocks").select("apartment_id").gte("date", checkin).lt("date", checkout),
    getAirbnbCalendar(),
  ]);
  if (error) return NextResponse.json({ blocked: [] });

  const blocked = Array.from(new Set([
    ...(data ?? []).map(b => b.apartment_id).filter(Boolean),
    ...airbnbClosedApartments(cal, checkin, checkout),
  ]));
  return NextResponse.json({ blocked });
}
