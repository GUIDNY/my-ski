/*
 * morning (חשבונית ירוקה / Green Invoice) — the business's receipts.
 * DRAFT STAGE ONLY: this module logs in and either asks morning for a PREVIEW
 * (a PDF, creates nothing) or saves a native morning DRAFT (טיוטה) — editable,
 * unissued, numberless, and never emailed. It NEVER issues a document:
 * the only document endpoints it calls are /documents/preview and
 * /documents/drafts (morning's own app endpoint for saved drafts).
 * Env (set by Idan in Vercel): MORNING_API_KEY, MORNING_API_SECRET,
 * optional MORNING_BASE_URL, MORNING_DOC_TYPE (default 400 = קבלה).
 */

const BASE = () => process.env.MORNING_BASE_URL || "https://api.greeninvoice.co.il/api/v1";

export const morningConfigured = () => !!process.env.MORNING_API_KEY && !!process.env.MORNING_API_SECRET;

const AUTH = () => process.env.MORNING_AUTH_URL || "https://api.morning.co/idp/v1/oauth/token";

let cached: { token: string; until: number } | null = null;
async function token(): Promise<string> {
  if (cached && Date.now() < cached.until - 60_000) return cached.token;
  const r = await fetch(AUTH(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: process.env.MORNING_API_KEY, client_secret: process.env.MORNING_API_SECRET }),
  });
  const j = await r.json().catch(() => ({})) as { accessToken?: string; expiresAt?: number; error?: string; error_description?: string };
  if (!r.ok || !j.accessToken) throw new Error(`morning login failed: ${j.error_description || j.error || r.status}`);
  cached = { token: j.accessToken, until: j.expiresAt ? j.expiresAt * 1000 : Date.now() + 50 * 60_000 };
  return j.accessToken;
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
  description?: string; // תיאור תכולת המסמך — what the deal included
  docType?: number; // override: 400 קבלה (default) / 320 חשבונית מס-קבלה / 305 חשבונית מס
  linkedIds?: string[]; // link this document to earlier ones (e.g. the receipt a tax invoice closes)
  clientPhone?: string;
  amount: number;
  currency: "ILS" | "EUR";
  payMethod: string; // key from PAY_METHODS
  remarks: string;
};

function docBody(d: ReceiptDraft) {
  const method = PAY_METHODS.find(m => m.key === d.payMethod) ?? PAY_METHODS[0];
  return {
    type: d.docType || Number(process.env.MORNING_DOC_TYPE || 400), // 400 = קבלה
    lang: "he",
    currency: d.currency,
    vatType: 0,
    rounding: false,
    ...(d.description ? { description: d.description.slice(0, 250) } : {}),
    ...(d.linkedIds?.length ? { linkedDocumentIds: d.linkedIds, linkType: "link" } : {}),
    // emails stays [] — morning never emails the customer (Idan's standing rule)
    client: { name: d.clientName || "לקוח/ה", ...(d.clientPhone ? { phone: d.clientPhone } : {}), emails: [] as string[], add: false },
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

/**
 * Save a DRAFT (טיוטה) inside morning itself — shows up in his morning account,
 * editable there, UNISSUED (no number, no email). Not an issued document.
 */
export async function saveDraftInMorning(d: ReceiptDraft): Promise<{ id: string; url: string }> {
  const t = await token();
  const body = docBody(d);
  const r = await fetch(`${BASE()}/documents/drafts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({})) as { id?: string; errorMessage?: string };
  if (!r.ok || !j.id) throw new Error(`morning draft failed: ${j.errorMessage || r.status}`);
  const section = [305, 320, 330, 400, 405, 410].includes(body.type) ? "incomes" : "business";
  return { id: j.id, url: `https://app.greeninvoice.co.il/${section}/documents/new/${body.type}?draftId=${encodeURIComponent(j.id)}` };
}

export type IssuedReceipt = { id: string; number?: string; url?: string };

/**
 * ISSUE a real receipt (מסמך אמיתי, עם מספר) in morning.
 * Still NO email ever — the client has no email on the document (emails: []).
 * Called only from flows Idan explicitly approved: the הפק-קבלה button and
 * the auto-receipt on a captured deposit.
 */
export async function issueReceipt(d: ReceiptDraft): Promise<IssuedReceipt> {
  const t = await token();
  const r = await fetch(`${BASE()}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: JSON.stringify(docBody(d)),
  });
  const j = await r.json().catch(() => ({})) as { id?: string; number?: string | number; url?: { he?: string; origin?: string }; errorMessage?: string };
  if (!r.ok || !j.id) throw new Error(`morning issue failed: ${j.errorMessage || r.status}`);
  return { id: j.id, number: j.number != null ? String(j.number) : undefined, url: j.url?.he || j.url?.origin };
}
