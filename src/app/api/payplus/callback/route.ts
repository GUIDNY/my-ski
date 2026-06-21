import { createServerClient } from "@/lib/supabase-server";
import { blockDatesForOrder } from "@/lib/inventory";
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

  let order: Record<string, unknown> | null = null;
  let sendEmail = false;

  if (orderCode) {
    try {
      const db = createServerClient();
      const { data: existing } = await db.from("orders").select("*").eq("code", orderCode).single();
      if (existing) {
        // record the deposit transaction once; first time → 'hold' + "received" email.
        // duplicate IPNs (or after approval) are ignored. Approval+charge is done from admin.
        const patch: Record<string, unknown> = {};
        if (existing.status === "awaiting") { patch.status = "hold"; sendEmail = true; }
        if (email && !existing.customer_email) patch.customer_email = email;
        if (name && !existing.customer_name) patch.customer_name = name;
        if (phone && !existing.customer_phone) patch.customer_phone = phone;
        if (txUid && !existing.payplus_transaction_uid) patch.payplus_transaction_uid = txUid;
        const ils = Number(t.amount);
        if (ils > 0 && !existing.amount_ils) patch.amount_ils = ils;
        if (Object.keys(patch).length) {
          const { data } = await db.from("orders").update(patch).eq("id", existing.id).select().single();
          order = data;
        } else { order = existing; }
        // deposit taken → reserve the dates on the calendar
        if (sendEmail && order) await blockDatesForOrder(db, order);
      }
    } catch { /* ignore */ }
  }

  if (hook && sendEmail) {
    const o = order || {};
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "payplus",
          type: "received",
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
