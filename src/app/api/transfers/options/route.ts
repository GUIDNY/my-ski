import { NextRequest, NextResponse } from "next/server";
import { transferOptions } from "@/lib/transfer-options";

/* Read-only: every transfer we can offer for a trip (lib/transfer-options.ts).
   POST { airport, outDate, retDate, outFlight, retFlight, pax, luggage, ski } */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const a = await transferOptions({
    airport: b.airport, outDate: b.outDate, retDate: b.retDate, outFlight: b.outFlight, retFlight: b.retFlight,
    pax: Number(b.pax) || 1, luggage: b.luggage, ski: b.ski,
  });
  return NextResponse.json(a);
}
