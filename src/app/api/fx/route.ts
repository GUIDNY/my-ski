import { getEurToIls, SELL_MARKUP } from "@/lib/fx";
import { NextResponse } from "next/server";

// Public: current EUR→ILS rate + the sell (cash) rate customers pay in shekels.
export async function GET() {
  const rate = await getEurToIls();
  const sell = rate * SELL_MARKUP;
  return NextResponse.json({ rate, sell, markup: SELL_MARKUP });
}
