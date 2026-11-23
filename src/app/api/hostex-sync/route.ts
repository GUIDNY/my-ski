import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Read by the n8n "Hostex ← site orders" workflow: which future nights of one apartment are held
// by an active site order (to close in Hostex right away), and which are held for any site reason
// (order or manual block: never reopen those). Dates only, no customer data — the same nights the
// public iCal feed already exposes.
export async function GET(req: NextRequest) {
  const apartment_id = req.nextUrl.searchParams.get("apartment_id");
  if (!apartment_id) return NextResponse.json({ ok: false, error: "missing apartment_id" }, { status: 400 });
  const today = new Date().toISOString().slice(0, 10);
  const close: string[] = [];
  const keep: string[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from("availability_blocks")
      .select("date, source")
      .eq("apartment_id", apartment_id).in("source", ["order", "manual"]).gte("date", today)
      .order("date").range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    for (const b of data ?? []) {
      const d = String(b.date).slice(0, 10);
      keep.push(d);
      if (b.source === "order") close.push(d);
    }
    if (!data || data.length < PAGE) break;
  }
  return NextResponse.json({ ok: true, apartment_id, close, keep }, { headers: { "Cache-Control": "no-store" } });
}
