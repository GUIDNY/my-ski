/*
 * OpenAI Ads measurement pixel (ChatGPT ads, Ads Manager > Conversions).
 * Docs: https://developers.openai.com/ads/measurement-pixel
 *
 * The base script is loaded by components/OpenAIPixel.tsx (root layout).
 * Everything here is fire-and-forget: if the pixel is blocked or not loaded
 * yet, the call is queued by the snippet's stub or silently dropped, and
 * never breaks a page.
 *
 * Events we send:
 *  - page_viewed       every page change (not admin/seller pages)
 *  - lead_created      WhatsApp click, first message to the site chat, a quote link made
 *  - checkout_started  an order was made and the customer is sent to PayPlus
 *  - order_created     PayPlus sent the customer back to /pay/success
 *
 * Each of these also goes to Google Ads as a conversion (lib/gads.ts), when it is set up.
 */

import { gadsConversion } from "@/lib/gads";

export const OAI_PIXEL_ID = process.env.NEXT_PUBLIC_OAI_PIXEL_ID || "JUva1CRVPrEnzzc2MpF3kf";

// pages that are not for customers: no pixel there
export const OAI_PIXEL_SKIP = ["/admin", "/seller", "/quote/print"];
export const oaiSkip = (path: string) => OAI_PIXEL_SKIP.some(h => path === h || path.startsWith(h + "/"));

/* the English/French site (/en, /fr): nothing before the visitor agreed to cookies
   (the banner saves "skishare_cookie_consent" and fires "skishare:cookie-consent") */
export const OAI_CONSENT_KEY = "skishare_cookie_consent";
export const OAI_CONSENT_EVENT = "skishare:cookie-consent";
export const oaiNeedsConsent = (path: string) => /^\/(en|fr)(\/|$)/.test(path);
export function oaiConsented(): boolean {
  try { return !!localStorage.getItem(OAI_CONSENT_KEY); } catch { return false; }
}
export const oaiAllowed = (path: string) => !oaiSkip(path) && (!oaiNeedsConsent(path) || oaiConsented());

type Oaiq = (...args: unknown[]) => void;

function oaiq(...args: unknown[]) {
  if (typeof window === "undefined") return;
  try {
    if (!oaiAllowed(window.location.pathname)) return;
    const w = window as unknown as { oaiq?: Oaiq; __oaiPending?: unknown[][] };
    if (typeof w.oaiq === "function") w.oaiq(...args);
    // the snippet loads after hydration: keep the call, the snippet sends it after init
    else (w.__oaiPending ||= []).push(args);
  } catch { /* never break the page */ }
}

// amounts go to the pixel as integers in minor units (2599 = 25.99)
const minor = (n: number) => Math.round(n * 100);

export function oaiPageView() {
  oaiq("measure", "page_viewed", { type: "contents" });
}

/* lead_created once per tab session per source, so a customer who clicks
   WhatsApp five times counts as one lead */
export function oaiLead(source: "whatsapp" | "chat" | "quote") {
  const key = `oai_lead_${source}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch { /* private mode: send anyway */ }
  oaiq("measure", "lead_created", { type: "customer_action" });
  gadsConversion("lead");
}

const PENDING = "oai_pending_order";

export function oaiCheckoutStarted(orderCode: string, amount: number, currency: string, name?: string) {
  const cur = (currency || "EUR").toUpperCase();
  try { sessionStorage.setItem(PENDING, JSON.stringify({ code: orderCode, amount, currency: cur, name })); } catch { /* ignore */ }
  oaiq("measure", "checkout_started", {
    type: "contents",
    amount: minor(amount),
    currency: cur,
    contents: [{ id: orderCode, name, quantity: 1, amount: minor(amount), currency: cur }],
  });
  gadsConversion("checkout", { value: amount, currency: cur, transaction_id: orderCode });
}

/* the order code is the event_id, so a refresh of the success page is not a
   second sale. The amount comes from checkout_started in this tab, if any. */
export function oaiOrderCreated(orderCode: string) {
  const code = orderCode.toLowerCase();
  const sent = `oai_order_${code}`;
  try { if (localStorage.getItem(sent)) return; } catch { /* ignore */ }

  let pending: { code?: string; amount?: number; currency?: string; name?: string } = {};
  try { pending = JSON.parse(sessionStorage.getItem(PENDING) || "{}"); } catch { /* ignore */ }
  const match = pending.code && String(pending.code).toLowerCase() === code && typeof pending.amount === "number";

  const data: Record<string, unknown> = { type: "contents" };
  if (match) {
    const cur = (pending.currency || "EUR").toUpperCase();
    data.amount = minor(pending.amount!);
    data.currency = cur;
    data.contents = [{ id: code, name: pending.name, quantity: 1, amount: minor(pending.amount!), currency: cur }];
  }
  oaiq("measure", "order_created", data, { event_id: `order_${code}` });
  // Google counts one purchase per transaction_id, so a refresh is not a second sale there either
  gadsConversion("purchase", match ? { value: pending.amount, currency: pending.currency, transaction_id: code } : { transaction_id: code });
  try { localStorage.setItem(sent, "1"); sessionStorage.removeItem(PENDING); } catch { /* ignore */ }
}
