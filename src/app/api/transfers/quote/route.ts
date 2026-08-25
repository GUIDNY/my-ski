import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/winteride";

// Live pricing from Winteride — read-only, never creates a booking.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { airport_code, resort_slug, date, pax, out_direction, flight_no } = body;
  if (!airport_code || !resort_slug || !date || !pax || !out_direction) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }
  try {
    const quote = await getQuote({ airport_code, resort_slug, date, pax, out_direction, flight_no });
    return NextResponse.json(quote);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "quote failed" }, { status: 502 });
  }
}
