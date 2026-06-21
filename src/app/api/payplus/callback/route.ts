import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// PayPlus server-to-server callback (IPN). State machine:
//   first callback (hold/J2)      → order 'hold'     + "received" email
//   later callback (capture/charge in PayPlus dashboard) → order 'approved' + "confirmed" email
export async function POST(req: NextRequest) {
  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch { payload = {}; }

  const t: Record<string, unknown> =
    (payload.transaction as Record<string, unknown>) || (payload.data as Record<string, unknown>) || payload;

  const orderCode = String(t.more_info_1 || payload.more_info_1 || "").trim().toLowerCase();
  const email = String(t.customer_email || t.email || "").trim();
  const name = String(t.customer_name || "").trim();
  const phone = String(t.customer_phone || t.phone || "").trim();
  const txUid = String(t.transaction_uid || t.uid || payload.transaction_uid || "").trim();

  const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
  const hook = process.env.N8N_WEBHOOK_URL;

  // explicit capture signal from PayPlus (charge), if present in the payload
  const typeStr = String(t.transaction_type || t.type || t.method || "").toLowerCase();
  const looksCaptured = /charge|חיוב|captur|commit/.test(typeStr);

  let order: Record<string, unknown> | null = null;
  let event: "received" | "approved" = "received";

  if (orderCode) {
    try {
      const db = createServerClient();
      const { data: existing } = await db.from("orders").select("*").eq("code", orderCode).single();

      if (existing) {
        if (existing.status === "approved") {
          return NextResponse.json({ ok: true }); // already done — ignore duplicate IPNs
        }
        // capture event = order already on hold OR PayPlus says it's a charge
        event = existing.status === "hold" || looksCaptured ? "approved" : "received";

        const patch: Record<string, unknown> = { status: event === "approved" ? "approved" : "hold" };
        if (email) patch.customer_email = email;
        if (name) patch.customer_name = name;
        if (phone) patch.customer_phone = phone;
        if (txUid) patch.payplus_transaction_uid = txUid;
        const { data } = await db.from("orders").update(patch).eq("id", existing.id).select().single();
        order = data;
      }
    } catch { /* ignore */ }
  }

  if (hook) {
    const o = order || {};
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "payplus",
          type: event, // "received" or "approved"
          order_code: orderCode,
          order: order ? {
            code: o.code, customer_email: o.customer_email, customer_name: o.customer_name,
            apartment: o.apartment_name, area: o.area, checkin: o.checkin, checkout: o.checkout,
            guests: o.guests, nights: o.nights, ski_pass: o.ski_pass, transfer: o.transfer,
            total_eur: o.total_eur, portal_url: `${origin}/my?code=${o.code}`,
          } : undefined,
          data: payload,
        }),
      });
    } catch { /* never block PayPlus on n8n errors */ }
  }

  return NextResponse.json({ ok: true });
}
