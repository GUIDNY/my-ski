import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// PayPlus server-to-server callback (IPN).
// 1) updates the matching order (by code in more_info_1) to "hold" + customer details
// 2) forwards to the n8n webhook so n8n can email the customer. Always 200 to PayPlus.
export async function POST(req: NextRequest) {
  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch { payload = {}; }

  // dig out fields from common PayPlus shapes
  const t: Record<string, unknown> = (payload.transaction as Record<string, unknown>) || (payload.data as Record<string, unknown>) || payload;
  const orderCode = String(t.more_info_1 || (payload as Record<string, unknown>).more_info_1 || "").trim();
  const email = String(t.customer_email || t.email || "").trim();
  const name = String(t.customer_name || "").trim();
  const phone = String(t.customer_phone || t.phone || "").trim();

  let order: Record<string, unknown> | null = null;
  if (orderCode) {
    try {
      const db = createServerClient();
      const patch: Record<string, unknown> = { status: "hold" };
      if (email) patch.customer_email = email;
      if (name) patch.customer_name = name;
      if (phone) patch.customer_phone = phone;
      const { data } = await db.from("orders").update(patch).eq("code", orderCode.toLowerCase()).select().single();
      order = data;
    } catch { /* ignore */ }
  }

  const hook = process.env.N8N_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // include the order from OUR db so the email recipient is reliable (not dependent on PayPlus echo)
        body: JSON.stringify({
          source: "payplus", type: "received", order_code: orderCode,
          order: order ? {
            customer_email: order.customer_email, customer_name: order.customer_name,
            apartment: order.apartment_name, area: order.area, checkin: order.checkin, checkout: order.checkout,
            guests: order.guests, nights: order.nights, total_eur: order.total_eur, code: order.code,
          } : undefined,
          data: payload,
        }),
      });
    } catch { /* never block PayPlus on n8n errors */ }
  }

  return NextResponse.json({ ok: true });
}
