import { NextRequest, NextResponse } from "next/server";
import { getQuote, type WinterideQuote } from "@/lib/winteride";
import { fixedTransferTotal } from "@/lib/transfer-options";

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
  } catch {
    // Winteride can't price now: the fixed price for one leg (see fixedTransferTotal), booked by the office
    const p = Math.max(1, Math.min(60, Math.round(Number(pax) || 1)));
    const fixed: WinterideQuote = {
      in_season: true,
      flight: { flight_no: null, found: false, time: null },
      travel: { drive_minutes: airport_code === "LYS" ? 150 : 165, km: airport_code === "LYS" ? 190 : 165 },
      private: [{ class: "private", vehicle_class_id: "fixed", max_pax: 60, max_luggage: 99, on_request: false, price_cents: fixedTransferTotal(p, 1) * 100, currency: "EUR" }],
      shared: null,
      supplements: [],
    };
    return NextResponse.json(fixed);
  }
}
