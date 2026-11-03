import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { apartmentProfit } from "@/lib/profit";
import { FLIGHT_MARGIN_EUR } from "@/lib/flight-margin";

/*
 * Admins and sellers: estimated profit behind a SITE quote (/quote, /offer, the
 * apartment booking box) — the client sends the figures it is showing. A seller
 * also gets his share of it (lib/sellers.ts).
 */
export async function POST(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const b = await req.json().catch(() => ({}));
  const db = createServerClient();
  const { data: apt } = await db.from("apartments").select("name, source").eq("id", String(b.apartment_id || "")).maybeSingle();
  const name = apt?.name || String(b.apartment || "");
  const nights = Number(b.nights) || 7;
  const lines: { label: string; profit: number | null }[] = [];
  const aptSell = Number(b.aptTotal) || 0;
  if (aptSell > 0) {
    const { profit } = apartmentProfit(name, apt?.source ?? null, aptSell, nights);
    lines.push({ label: `לינה — ${name.slice(0, 40)}`, profit });
  }
  const pax = Number(b.flightQty) || 0;
  if (pax > 0) lines.push({ label: `טיסות (€${FLIGHT_MARGIN_EUR} לאדם)`, profit: FLIGHT_MARGIN_EUR * pax });
  const total = lines.reduce((s, l) => s + (l.profit || 0), 0);
  const share = access.seller && !access.isAdmin ? { rate: access.seller.share, amount: Math.round(total * access.seller.share) } : null;
  return NextResponse.json({ ok: true, lines, totalProfit: total, note: "ציוד/סקיפס/הסעה במחיר עלות או עמלה חיצונית", share, admin: access.isAdmin });
}
