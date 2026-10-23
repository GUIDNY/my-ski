import { confirmDepositPaid } from "@/lib/confirm-order";
import { payplusPaymentApproved } from "@/lib/payplus-verify";
import { NextRequest, NextResponse } from "next/server";

// Fallback confirmation from the /pay/success redirect, in case the PayPlus
// IPN callback is delayed or missed. Idempotent with the callback.
// The order code alone proves nothing (anyone who has it could call this), so
// PayPlus is asked first: the transaction / payment page from the redirect
// must be approved and belong to this order. Otherwise nothing changes and
// the signed callback confirms the order when it arrives.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  const orderCode = String(b.order_code || "").trim().toLowerCase();
  if (!orderCode) return NextResponse.json({ error: "missing order_code" }, { status: 400 });

  const check = await payplusPaymentApproved({
    orderCode,
    transactionUid: String(b.transaction_uid || "").trim() || undefined,
    pageRequestUid: String(b.page_request_uid || "").trim() || undefined,
  });
  if (!check.ok) {
    console.warn("[payplus] success-page confirm skipped", { order: orderCode, why: check.reason });
    return NextResponse.json({ ok: false, changed: false });
  }

  const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
  const tx = check.tx || {};
  const res = await confirmDepositPaid(orderCode, origin, {
    txUid: String(tx.transaction_uid || tx.uid || b.transaction_uid || "").trim(),
    amountIls: Number(tx.amount) || 0,
  });
  console.info("[payplus] success-page confirm", { order: orderCode, changed: res.changed });
  return NextResponse.json({ ok: true, changed: res.changed });
}
