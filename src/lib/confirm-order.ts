import { createServerClient } from "@/lib/supabase-server";
import { blockDatesForOrder } from "@/lib/inventory";

type Info = { email?: string; name?: string; phone?: string; txUid?: string; amountIls?: number };

// Idempotent: marks an order's deposit as taken (awaiting → hold) once,
// reserves the dates, and fires the "received" email. Safe to call from both
// the PayPlus IPN callback and the /pay/success redirect — whichever lands first wins.
export async function confirmDepositPaid(code: string, origin: string, info: Info = {}, rawPayload?: unknown) {
  const c = (code || "").trim().toLowerCase();
  if (!c) return { changed: false as const };
  const db = createServerClient();
  const { data: existing } = await db.from("orders").select("*").eq("code", c).single();
  if (!existing) return { changed: false as const };

  const patch: Record<string, unknown> = {};
  let sendEmail = false;
  if (existing.status === "awaiting") { patch.status = "hold"; sendEmail = true; }
  if (info.email && !existing.customer_email) patch.customer_email = info.email;
  if (info.name && !existing.customer_name) patch.customer_name = info.name;
  if (info.phone && !existing.customer_phone) patch.customer_phone = info.phone;
  if (info.txUid && !existing.payplus_transaction_uid) patch.payplus_transaction_uid = info.txUid;
  if (info.amountIls && info.amountIls > 0 && !existing.amount_ils) patch.amount_ils = info.amountIls;

  let order = existing;
  if (Object.keys(patch).length) {
    const { data } = await db.from("orders").update(patch).eq("id", existing.id).select().single();
    if (data) order = data;
  }

  if (sendEmail) {
    await blockDatesForOrder(db, order);
    const hook = process.env.N8N_WEBHOOK_URL;
    if (hook) {
      let splitUrl: string | undefined;
      if (order.group_id) {
        try {
          const { data: g } = await db.from("booking_groups").select("code").eq("id", order.group_id).single();
          if (g?.code) splitUrl = `${origin}/split/${g.code}`;
        } catch { /* ignore */ }
      }
      try {
        await fetch(hook, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "payplus", type: "received", order_code: order.code,
            order: {
              code: order.code, customer_email: order.customer_email, customer_name: order.customer_name,
              apartment: order.apartment_name, area: order.area, checkin: order.checkin, checkout: order.checkout,
              guests: order.guests, nights: order.nights, ski_pass: order.ski_pass, transfer: order.transfer,
              total_eur: order.total_eur, portal_url: `${origin}/my?code=${order.code}`,
              share_amount: order.share_amount, shares_total: order.shares_total, split_url: splitUrl,
            },
            data: rawPayload,
          }),
        });
      } catch { /* never block on n8n errors */ }
    }
  }
  return { changed: sendEmail, order };
}
