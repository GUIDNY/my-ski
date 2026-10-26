import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/winteride";

// Live pricing from Winteride — read-only, never creates a booking.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { airport_code, resort_slug, date, pax, out_direction, flight_no } = body;
  const n = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.min(60, Math.round(Number(v))) : undefined);
  const luggage = n(body.luggage), ski = n(body.ski);
  if (!airport_code || !resort_slug || !date || !pax || !out_direction) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }
  try {
    const quote = await getQuote({ airport_code, resort_slug, date, pax, out_direction, flight_no: typeof flight_no === "string" && flight_no.trim() ? flight_no.trim().toUpperCase().replace(/\s+/g, "") : undefined, luggage, ski });
    return NextResponse.json(quote);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "quote failed" }, { status: 502 });
  }
}
