import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/api-auth";

/* The admin dashboard's numbers. Admins only: the page used to read them on the server and
   render them for anyone who opened /admin, logged in or not. */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const db = createServerClient();
  const [{ count: aptCount }, { count: seasonCount }, { data: orders, error }] = await Promise.all([
    db.from("apartments").select("*", { count: "exact", head: true }),
    db.from("season_rentals").select("*", { count: "exact", head: true }),
    db.from("orders").select("id, code, customer_name, customer_email, apartment_name, checkin, checkout, guests, nights, total_eur, status, transfer, payplus_transaction_uid, ops").order("created_at", { ascending: false }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ aptCount: aptCount ?? 0, seasonCount: seasonCount ?? 0, orders: orders ?? [] });
}
