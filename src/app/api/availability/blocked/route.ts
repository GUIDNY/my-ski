import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Returns the apartment_ids that are unavailable for a date range
// (any blocked night between checkin and checkout-1). Covers orders,
// manual blocks and iCal — all live in availability_blocks.
export async function GET(req: NextRequest) {
  const checkin = req.nextUrl.searchParams.get("checkin");
  const checkout = req.nextUrl.searchParams.get("checkout");
  if (!checkin || !checkout) return NextResponse.json({ blocked: [] });

  const db = createServerClient();
  const { data, error } = await db
    .from("availability_blocks")
    .select("apartment_id")
    .gte("date", checkin)
    .lt("date", checkout);
  if (error) return NextResponse.json({ blocked: [] });

  const blocked = Array.from(new Set((data ?? []).map(b => b.apartment_id).filter(Boolean)));
  return NextResponse.json({ blocked });
}
