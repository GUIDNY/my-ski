import { confirmDepositPaid } from "@/lib/confirm-order";
import { payplusPaymentApproved, payplusSignatureOk, txApproved } from "@/lib/payplus-verify";
import { NextRequest, NextResponse } from "next/server";

// PayPlus server-to-server callback (IPN). First confirmation → order 'hold' +
// "received" email + dates reserved. Idempotent (duplicate IPNs are ignored).
// Approval+charge is done separately from the admin.
// Only a real PayPlus message counts: its signature (the `hash` header) must
// match, or PayPlus itself must confirm the transaction (lib/payplus-verify).
export async function POST(req: NextRequest) {
  const raw = await req.text().catch(() => "");
  let payload: Record<string, unknown> = {};
  try { payload = JSON.parse(raw || "{}"); } catch { payload = {}; }

  const t: Record<string, unknown> =
    (payload.transaction as Record<string, unknown>) || (payload.data as Record<string, unknown>) || payload;

  const orderCode = String(t.more_info_1 || payload.more_info_1 || "").trim().toLowerCase();
  const txUid = String(t.transaction_uid || t.uid || payload.transaction_uid || "").trim();
  const pageUid = String(t.page_request_uid || payload.page_request_uid || t.payment_page_request_uid || "").trim();
  const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;

  let verified = false, how = "";
  if (payplusSignatureOk(raw, payload, req.headers.get("hash"))) {
    // signed by PayPlus: a declined transaction still doesn't confirm the order
    const status = String(t.status_code ?? "").trim();
    verified = status === "" || txApproved(t);
    how = verified ? "signature" : `signed but status_code ${status}`;
  } else if (orderCode) {
    const check = await payplusPaymentApproved({ orderCode, transactionUid: txUid, pageRequestUid: pageUid });
    verified = check.ok;
    how = check.reason;
  } else {
    how = "no signature and no order code";
  }

  if (!verified) {
    console.warn("[payplus] callback not confirmed", { order: orderCode || null, hasHash: !!req.headers.get("hash"), ua: req.headers.get("user-agent"), why: how });
    return NextResponse.json({ ok: false });
  }

  const res = await confirmDepositPaid(orderCode, origin, {
    email: String(t.customer_email || t.email || "").trim(),
    name: String(t.customer_name || "").trim(),
    phone: String(t.customer_phone || t.phone || "").trim(),
    txUid,
    amountIls: Number(t.amount) || 0,
  }, payload);
  console.info("[payplus] callback confirmed", { order: orderCode, how, changed: res.changed });

  return NextResponse.json({ ok: true });
}
