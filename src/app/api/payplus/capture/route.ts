import { createServerClient } from "@/lib/supabase-server";
import { blockDatesForOrder } from "@/lib/inventory";
import { NextRequest, NextResponse } from "next/server";

// Captures (charges) a held J5 deposit via PayPlus, then marks the order
// approved and fires the confirmation email via n8n.
export async function POST(req: NextRequest) {
  const db = createServerClient();
  const { order_id } = await req.json();
  if (!order_id) return NextResponse.json({ error: "missing order_id" }, { status: 400 });

  const { data: order } = await db.from("orders").select("*").eq("id", order_id).single();
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
  if (order.status === "approved") return NextResponse.json({ error: "ההזמנה כבר אושרה" }, { status: 409 });

  // 1) charge the held deposit through PayPlus (if we have its transaction uid)
  if (order.payplus_transaction_uid) {
    const BASE = process.env.PAYPLUS_BASE_URL || "https://restapi.payplus.co.il";
    const amount = Number(order.amount_ils) > 0 ? Number(order.amount_ils) : undefined;
    try {
      const res = await fetch(`${BASE}/api/v1.0/Transactions/ChargeByTransactionUID`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.PAYPLUS_API_KEY || "",
          "secret-key": process.env.PAYPLUS_SECRET_KEY || "",
        },
        body: JSON.stringify({ transaction_uid: order.payplus_transaction_uid, ...(amount ? { amount } : {}) }),
      });
      const j = await res.json();
      if (j?.results?.status !== "success") {
        return NextResponse.json({ error: j?.results?.message || "PayPlus charge failed", raw: j }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "charge request failed" }, { status: 500 });
    }
  }

  // 2) mark approved + reserve dates + fire confirmation email
  const { data: updated } = await db.from("orders").update({ status: "approved" }).eq("id", order_id).select().single();
  if (updated) await blockDatesForOrder(db, updated);

  const hook = process.env.N8N_WEBHOOK_URL;
  if (hook && updated) {
    const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
    try {
      await fetch(hook, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "capture", type: "approved",
          order: {
            code: updated.code, customer_name: updated.customer_name, customer_email: updated.customer_email,
            apartment: updated.apartment_name, area: updated.area, checkin: updated.checkin, checkout: updated.checkout,
            guests: updated.guests, nights: updated.nights, ski_pass: updated.ski_pass, transfer: updated.transfer,
            total_eur: updated.total_eur, portal_url: `${origin}/my?code=${updated.code}`,
          },
        }),
      });
    } catch { /* ignore */ }
  }

  return NextResponse.json({ ok: true, charged: !!order.payplus_transaction_uid });
}
