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
  // ?shape=legacy: the answer the n8n quote engines already read (a /quotes-like "private" list):
  // the best option only, priced for both legs together, named for the quote line
  if (req.nextUrl.searchParams.get("shape") === "legacy") {
    const o = a.options.find(x => x.key === a.best);
    const SHORT: Record<string, string> = { shared: "שאטל משותף", sedan: "סדאן", minivan: "מיניוואן", van: "ואן", "Premium minivan": "מיניוואן פרימיום", minibus: "מיניבוס", coach: "אוטובוס" };
    return NextResponse.json(o ? {
      private: [{ class: SHORT[o.className] ?? o.name, max_pax: 99, price_cents: o.total * 100 }],
      best: o, options: a.options,
    } : { private: [] });
  }
  return NextResponse.json(a);
}
