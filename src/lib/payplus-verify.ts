import crypto from "crypto";

/*
 * Is a "payment succeeded" message really from PayPlus? An order is marked
 * "deposit received" (hold), its dates are blocked and the "received" email
 * goes out only after one of these checks passes. Before, the callback and
 * the /pay/success fallback trusted whatever order code they were sent, so
 * anyone with an order code could mark it paid.
 *
 * 1. Signature (the IPN callback): PayPlus sends a `hash` header,
 *    base64(HMAC-SHA256(secret key, body)) (docs: "Validate Requests Received
 *    from PayPlus"). We accept the raw body or its JSON.stringify, whichever
 *    PayPlus signed.
 * 2. Ask PayPlus (the fallback, and an unsigned callback): POST
 *    /api/v1.0/PaymentPages/ipn with the transaction_uid or the
 *    payment_request_uid; the transaction must be approved (status_code "000")
 *    and carry this order's code (more_info_1, set in create-link).
 */

const BASE = () => process.env.PAYPLUS_BASE_URL || "https://restapi.payplus.co.il";

function sameText(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** True when the `hash` header is PayPlus's signature of this body. */
export function payplusSignatureOk(rawBody: string, parsed: unknown, hashHeader: string | null): boolean {
  const secret = process.env.PAYPLUS_SECRET_KEY;
  const hash = (hashHeader || "").trim();
  if (!secret || !hash || !rawBody) return false;
  const messages = [rawBody];
  try { const s = JSON.stringify(parsed); if (s && s !== rawBody) messages.push(s); } catch { /* not JSON */ }
  return messages.some(m => sameText(crypto.createHmac("sha256", secret).update(m).digest("base64"), hash));
}

type Tx = Record<string, unknown>;

// the transaction object somewhere in PayPlus's answer (data, data.transaction, data[0] …)
function findTransactions(node: unknown, out: Tx[] = [], depth = 0): Tx[] {
  if (!node || typeof node !== "object" || depth > 5) return out;
  if (Array.isArray(node)) { for (const n of node) findTransactions(n, out, depth + 1); return out; }
  const o = node as Tx;
  if ("status_code" in o && ("transaction_uid" in o || "uid" in o || "more_info_1" in o || "amount" in o)) out.push(o);
  for (const v of Object.values(o)) if (v && typeof v === "object") findTransactions(v, out, depth + 1);
  return out;
}

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

/** The order code a PayPlus transaction belongs to (create-link puts it in more_info_1). */
export function txOrderCode(tx: Tx): string {
  return str(tx.more_info_1 || tx.more_info1).toLowerCase();
}

/** "000" is PayPlus's approved status. A missing status_code doesn't count as approved. */
export function txApproved(tx: Tx): boolean {
  return str(tx.status_code) === "000";
}

/**
 * Ask PayPlus whether this order really has an approved payment.
 * Needs the transaction_uid or the payment page request uid (PayPlus adds
 * them to the success redirect and to the callback).
 */
export async function payplusPaymentApproved(opts: { orderCode: string; transactionUid?: string; pageRequestUid?: string }):
  Promise<{ ok: boolean; reason: string; tx?: Tx }> {
  const API_KEY = process.env.PAYPLUS_API_KEY, SECRET = process.env.PAYPLUS_SECRET_KEY;
  const code = opts.orderCode.trim().toLowerCase();
  if (!API_KEY || !SECRET) return { ok: false, reason: "no PayPlus keys" };
  if (!code) return { ok: false, reason: "no order code" };
  const body = opts.transactionUid ? { transaction_uid: opts.transactionUid }
    : opts.pageRequestUid ? { payment_request_uid: opts.pageRequestUid } : null;
  if (!body) return { ok: false, reason: "no transaction or page uid to check" };
  try {
    const res = await fetch(`${BASE()}/api/v1.0/PaymentPages/ipn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: JSON.stringify({ api_key: API_KEY, secret_key: SECRET }),
        "api-key": API_KEY,
        "secret-key": SECRET,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json().catch(() => null);
    const txs = findTransactions(json);
    const mine = txs.filter(t => txOrderCode(t) === code);
    const approved = mine.find(txApproved);
    if (approved) return { ok: true, reason: "approved by PayPlus", tx: approved };
    return { ok: false, reason: !txs.length ? `PayPlus answered ${res.status} without a transaction` : !mine.length ? "transaction is for another order" : "transaction not approved" };
  } catch (e) {
    return { ok: false, reason: "PayPlus check failed: " + (e instanceof Error ? e.message : "error") };
  }
}
