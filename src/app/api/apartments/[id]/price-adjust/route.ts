import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Bulk price change for an apartment: adjust the whole seasonal calendar
// (all pricing_rules) + the base nightly price by a percentage or fixed amount.
// value is signed: -10 (percent) = 10% off · -20 (fixed) = €20 off.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { mode, value } = await req.json().catch(() => ({}));
  const v = Number(value);
  if (!id || (mode !== "percent" && mode !== "fixed") || !isFinite(v)) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }
  const adjust = (p: number) =>
    mode === "percent" ? Math.max(0, Math.round(p * (1 + v / 100))) : Math.max(0, Math.round(p + v));

  const db = createServerClient();

  // all pricing rules (seasonal calendar)
  const { data: rules } = await db.from("pricing_rules").select("id, price, price_type").eq("apartment_id", id);
  let updated = 0;
  for (const r of rules ?? []) {
    // only scale absolute prices (skip add/subtract deltas)
    if ((r.price_type ?? "absolute") !== "absolute") continue;
    await db.from("pricing_rules").update({ price: adjust(Number(r.price)) }).eq("id", r.id);
    updated++;
  }

  // base nightly price
  const { data: apt } = await db.from("apartments").select("price_per_night").eq("id", id).single();
  if (apt) await db.from("apartments").update({ price_per_night: adjust(Number(apt.price_per_night)) }).eq("id", id);

  return NextResponse.json({ ok: true, updated });
}
