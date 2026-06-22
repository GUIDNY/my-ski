import { confirmDepositPaid } from "@/lib/confirm-order";
import { NextRequest, NextResponse } from "next/server";

// PayPlus server-to-server callback (IPN). First confirmation → order 'hold' +
// "received" email + dates reserved. Idempotent (duplicate IPNs are ignored).
// Approval+charge is done separately from the admin.
export async function POST(req: NextRequest) {
  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch { payload = {}; }

  const t: Record<string, unknown> =
    (payload.transaction as Record<string, unknown>) || (payload.data as Record<string, unknown>) || payload;

  const orderCode = String(t.more_info_1 || payload.more_info_1 || "").trim().toLowerCase();
  const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;

  await confirmDepositPaid(orderCode, origin, {
    email: String(t.customer_email || t.email || "").trim(),
    name: String(t.customer_name || "").trim(),
    phone: String(t.customer_phone || t.phone || "").trim(),
    txUid: String(t.transaction_uid || t.uid || payload.transaction_uid || "").trim(),
    amountIls: Number(t.amount) || 0,
  }, payload);

  return NextResponse.json({ ok: true });
}
