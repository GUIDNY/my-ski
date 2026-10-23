import { NextResponse } from "next/server";
import { loadWeekPrices } from "@/lib/week-prices-server";

/** the cheapest open agency apartment of every Saturday ahead (the guide's price table refreshes from here) */
export async function GET() {
  const prices = await loadWeekPrices();
  if (!prices) return NextResponse.json({ ok: false }, { status: 502 });
  return NextResponse.json({ ok: true, ...prices }, {
    // one answer an hour for everyone, from the CDN
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
  });
}
