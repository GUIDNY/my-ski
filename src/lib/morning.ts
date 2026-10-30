/*
 * morning (חשבונית ירוקה / Green Invoice) — the business's receipts.
 * DRAFT STAGE ONLY: this module logs in and asks morning for a PREVIEW of a
 * receipt (a PDF to look at). It never creates, saves or sends any document:
 * the only document endpoint it calls is /documents/preview.
 * Env (set by Idan in Vercel): MORNING_API_KEY, MORNING_API_SECRET,
 * optional MORNING_BASE_URL, MORNING_DOC_TYPE (default 400 = קבלה).
 */

const BASE = () => process.env.MORNING_BASE_URL || "https://api.greeninvoice.co.il/api/v1";

export const morningConfigured = () => !!process.env.MORNING_API_KEY && !!process.env.MORNING_API_SECRET;

let cached: { token: string; until: number } | null = null;
async function token(): Promise<string> {
  if (cached && Date.now() < cached.until - 60_000) return cached.token;
  const r = await fetch(`${BASE()}/account/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: process.env.MORNING_API_KEY, secret: process.env.MORNING_API_SECRET }),
  });
  const j = await r.json().catch(() => ({})) as { token?: string; expires?: number; errorMessage?: string };
  if (!r.ok || !j.token) throw new Error(`morning login failed: ${j.errorMessage || r.status}`);
  cached = { token: j.token, until: j.expires ? j.expires * 1000 : Date.now() + 50 * 60_000 };
  return j.token;
}

/** how the customer paid → morning's payment type */
export const PAY_METHODS: { key: string; label: string; type: number }[] = [
  { key: "card_link", label: "אשראי — לינק PayPlus", type: 3 },
  { key: "card", label: "אשראי — אחר", type: 3 },
  { key: "transfer", label: "העברה בנקאית", type: 4 },
  { key: "bit", label: "ביט / אפליקציית תשלום", type: 10 },
  { key: "cash", label: "מזומן", type: 1 },
  { key: "cheque", label: "צ׳ק", type: 2 },
  { key: "other", label: "אחר", type: 11 },
];

export type ReceiptDraft = {
  clientName: string;
  clientPhone?: string;
  amount: number;
  currency: "ILS" | "EUR";
  payMethod: string; // key from PAY_METHODS
  remarks: string;
};

function docBody(d: ReceiptDraft) {
  const method = PAY_METHODS.find(m => m.key === d.payMethod) ?? PAY_METHODS[0];
  return {
    type: Number(process.env.MORNING_DOC_TYPE || 400), // 400 = קבלה
    lang: "he",
    currency: d.currency,
    vatType: 0,
    rounding: false,
    client: { name: d.clientName || "לקוח/ה", ...(d.clientPhone ? { phone: d.clientPhone } : {}), add: false },
    // no emails anywhere: morning never emails the customer (Idan's standing rule)
    payment: [{ date: new Date().toISOString().slice(0, 10), type: method.type, price: Math.round(d.amount * 100) / 100, currency: d.currency }],
    remarks: d.remarks.slice(0, 250),
  };
}

/** a PDF preview of the receipt, WITHOUT creating any document */
export async function previewReceipt(d: ReceiptDraft): Promise<{ pdf: string }> {
  const t = await token();
  const r = await fetch(`${BASE()}/documents/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(docBody(d)),
  });
  const j = await r.json().catch(() => ({})) as { file?: string; data?: string; errorMessage?: string; errorCode?: number };
  const pdf = j.file || j.data;
  if (!r.ok || !pdf) throw new Error(`morning preview failed: ${j.errorMessage || r.status}`);
  return { pdf };
}
