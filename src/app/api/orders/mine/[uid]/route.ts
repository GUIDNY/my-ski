import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Returns a user's orders. Also auto-links any unclaimed orders whose
// customer_email matches the logged-in email (passed as ?email=).
export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const db = createServerClient();
  const { uid } = await params;
  const email = req.nextUrl.searchParams.get("email");

  // A verified login email proves ownership: (re)link every order whose
  // customer_email matches — even if it was linked to a stale/old account id.
  if (email) {
    await db.from("orders").update({ user_id: uid }).ilike("customer_email", email);
  }

  const { data, error } = await db
    .from("orders")
    .select("code, apartment_name, area, checkin, checkout, guests, nights, ski_pass, transfer, total_eur, status, customer_name, apartment:apartments(images)")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
