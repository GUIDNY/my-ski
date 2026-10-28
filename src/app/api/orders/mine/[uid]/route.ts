import { createServerClient } from "@/lib/supabase-server";
import { sessionUser } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { guestView } from "@/lib/checkin";

// Returns the signed-in user's orders. Also auto-links any orders whose
// customer_email matches the user's verified login email. The user and the
// email come from the session token, never from the URL.
export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const user = await sessionUser(req);
  const { uid } = await params;
  if (!user) return NextResponse.json({ error: "login required" }, { status: 401 });
  if (user.id !== uid) return NextResponse.json({ error: "not your account" }, { status: 403 });
  const db = createServerClient();
  const email = user.email_confirmed_at ? user.email : null;

  // A verified login email proves ownership: (re)link every order whose
  // customer_email matches — even if it was linked to a stale/old account id.
  if (email) {
    await db.from("orders").update({ user_id: uid }).ilike("customer_email", email);
  }

  const { data, error } = await db
    .from("orders")
    .select("code, apartment_id, apartment_name, extra_apartment_id, extra_apartment_name, area, checkin, checkout, guests, nights, ski_pass, transfer, equipment, flight, flight_details, transfer_details, ops, total_eur, status, customer_name, group_id, share_amount, shares_total")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // attach apartment images via a separate query (no FK relationship to join on)
  const ids = Array.from(new Set((data ?? []).flatMap(o => [o.apartment_id, o.extra_apartment_id]).filter(Boolean)));
  let imgMap: Record<string, string[]> = {};
  if (ids.length) {
    const { data: apts } = await db.from("apartments").select("id, images").in("id", ids);
    imgMap = Object.fromEntries((apts ?? []).map(a => [a.id, a.images || []]));
  }

  // attach split-group progress for orders that belong to a group
  const groupIds = Array.from(new Set((data ?? []).map(o => o.group_id).filter(Boolean)));
  const groupMap: Record<string, { code: string; shares_total: number; shares_paid: number }> = {};
  if (groupIds.length) {
    const [{ data: groups }, { data: gOrders }] = await Promise.all([
      db.from("booking_groups").select("id, code, shares_total").in("id", groupIds),
      db.from("orders").select("group_id, status").in("group_id", groupIds),
    ]);
    (groups ?? []).forEach(g => {
      const paid = (gOrders ?? []).filter(o => o.group_id === g.id && (o.status === "hold" || o.status === "approved")).length;
      groupMap[g.id] = { code: g.code, shares_total: g.shares_total, shares_paid: paid };
    });
  }

  const enriched = (data ?? []).map(({ ops, ...o }) => ({
    ...o,
    // the ski pass area the admin set (orders.ops.x_pass3v); the rest of ops is our internal checklist
    ...guestView(ops),
    apartment: { images: [...(imgMap[o.apartment_id] || []), ...(o.extra_apartment_id ? imgMap[o.extra_apartment_id] || [] : [])].slice(0, 12) },
    group: o.group_id ? groupMap[o.group_id] ?? null : null,
  }));
  return NextResponse.json(enriched);
}
