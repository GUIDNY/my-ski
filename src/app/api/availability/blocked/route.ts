import { createServerClient } from "@/lib/supabase-server";
import { takenApartmentIds } from "@/lib/inventory";
import { NextRequest, NextResponse } from "next/server";

// Returns the apartment_ids that are unavailable for a date range, by the same
// rule as /search and /api/inventory (takenApartmentIds): any blocked night
// between checkin and checkout-1 (orders, manual blocks and iCal, all in
// availability_blocks), site bookings that aren't cancelled, and nights already
// closed on the apartment's live Airbnb calendar. (It used to skip the bookings
// table, so the apartment page could take a payment for dates search showed as
// taken.)
export async function GET(req: NextRequest) {
  const checkin = req.nextUrl.searchParams.get("checkin");
  const checkout = req.nextUrl.searchParams.get("checkout");
  if (!checkin || !checkout) return NextResponse.json({ blocked: [] });

  const taken = await takenApartmentIds(createServerClient(), checkin, checkout);
  return NextResponse.json({ blocked: taken ? Array.from(taken) : [] });
}
