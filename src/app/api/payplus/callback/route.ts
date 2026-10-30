import { confirmDepositPaid } from "@/lib/confirm-order";
import { orderFromPayment } from "@/lib/payment-order";
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

  let orderCode = String(t.more_info_1 || payload.more_info_1 || "").trim().toLowerCase();
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

  // a payment with no order on the site behind it (a quote's pay button, a link the bot made):
  // it becomes an order now, so it shows in the admin and the customer gets the "received" email
  const ref = orderCode;
  let fromLink = false;
  if (!orderCode || orderCode.startsWith("p:")) {
    const made = await orderFromPayment({
      ref, txUid,
      description: String(t.more_info || payload.more_info || "").trim(),
      amount: Number(t.amount) || 0,
      currency: String(t.currency_code || t.currency || "ILS"),
      name: String(t.customer_name || "").trim(),
      email: String(t.customer_email || t.email || "").trim(),
      phone: String(t.customer_phone || t.phone || "").trim(),
      pageUid,
    });
    if (made) { orderCode = made.code; fromLink = made.created; }
    else console.warn("[payplus] payment with no order: could not open an order", { ref: ref || null });
  }

  const res = await confirmDepositPaid(orderCode, origin, {
    email: String(t.customer_email || t.email || "").trim(),
    name: String(t.customer_name || "").trim(),
    phone: String(t.customer_phone || t.phone || "").trim(),
    txUid,
    amountIls: /^ils$/i.test(String(t.currency_code || t.currency || "ILS")) ? Number(t.amount) || 0 : 0,
  }, payload);
  console.info("[payplus] callback confirmed", { order: orderCode, how, changed: res.changed, amount: t.amount, currency: t.currency_code || t.currency });

  // a message to Idan on Telegram for every confirmed payment, with or without an order on the site
  // (quote links and the links the bot makes have no order code, so nothing else tells him)
  const alert = process.env.N8N_PAY_ALERT_URL;
  if (alert && (fromLink || res.changed)) {
    const card = String(t.four_digits || t.card_suffix || "").trim();
    try {
      await fetch(alert, {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          amount: Number(t.amount) || 0,
          currency: String(t.currency_code || t.currency || "ILS"),
          description: String(t.more_info || payload.more_info || "").trim(),
          name: String(t.customer_name || "").trim(),
          phone: String(t.customer_phone || t.phone || "").trim(),
          email: String(t.customer_email || t.email || "").trim(),
          card: card ? `כרטיס שמסתיים ב-${card}` : "",
          order: orderCode || "",
          fromLink,
        }),
      });
    } catch { /* the payment is saved either way */ }
  }

  return NextResponse.json({ ok: true });
}
