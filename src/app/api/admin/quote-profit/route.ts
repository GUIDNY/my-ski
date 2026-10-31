import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { apartmentProfit } from "@/lib/profit";
import { FLIGHT_MARGIN_EUR } from "@/lib/flight-margin";

/*
 * Admin-only: estimated profit behind a SITE quote (/quote, /offer, the
 * apartment booking box) — the client sends the figures it is showing.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
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
  return NextResponse.json({ ok: true, lines, totalProfit: total, note: "ציוד/סקיפס/הסעה במחיר עלות או עמלה חיצונית" });
}
