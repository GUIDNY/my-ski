import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/cleaning-day?date=YYYY-MM-DD
 *
 * Read-only, for the daily cleaning summary in n8n: approved site orders on
 * our own apartments (not agency/la_cime units) that check in or check out
 * on that date. Only what the cleaning team needs: apartment names, dates and
 * guest count. No customer names, contacts or payments.
 */

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !ISO.test(date) || Number.isNaN(Date.parse(date + "T12:00:00Z"))) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  const db = createServerClient();
  const [{ data: orders, error }, { data: agency, error: aErr }] = await Promise.all([
    db.from("orders")
      .select("apartment_id,apartment_name,extra_apartment_id,extra_apartment_name,checkin,checkout,guests,group_id")
      .eq("status", "approved")
      .or(`checkin.eq.${date},checkout.eq.${date}`),
    db.from("apartments").select("id").eq("source", "la_cime"),
  ]);
  if (error || aErr) return NextResponse.json({ error: "lookup failed" }, { status: 503 });

  const agencyIds = new Set((agency ?? []).map(a => a.id));
  const stays = (orders ?? [])
    .filter(o => o.apartment_id && !agencyIds.has(o.apartment_id))
    .map(o => ({
      apartment_name: o.apartment_name,
      extra_apartment_name: o.extra_apartment_id && !agencyIds.has(o.extra_apartment_id) ? o.extra_apartment_name : null,
      checkin: o.checkin,
      checkout: o.checkout,
      guests: o.guests ?? null,
      group_id: o.group_id ?? null,
    }));

  return NextResponse.json({ date, stays }, { headers: { "Cache-Control": "no-store" } });
}
