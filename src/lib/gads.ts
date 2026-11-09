/*
 * Google Ads conversion tracking. Same events and the same rules as the
 * OpenAI pixel (lib/oai-pixel.ts calls these): not on the admin/seller pages,
 * and on /en and /fr only after the cookie consent.
 *
 * Switched on by Vercel env vars (all public, set in Google Ads > Goals > Conversions):
 *   NEXT_PUBLIC_GADS_ID              "AW-123456789"           the account's tag; without it nothing loads
 *   NEXT_PUBLIC_GADS_PURCHASE_LABEL  the "Purchase" conversion's label  (order paid, with amount and order code)
 *   NEXT_PUBLIC_GADS_CHECKOUT_LABEL  optional, "Begin checkout"        (sent to PayPlus)
 *   NEXT_PUBLIC_GADS_LEAD_LABEL      optional, "Contact / lead"        (WhatsApp, site chat, quote link)
 */
export const GADS_ID = (process.env.NEXT_PUBLIC_GADS_ID || "").trim();
const LABEL = {
  purchase: (process.env.NEXT_PUBLIC_GADS_PURCHASE_LABEL || "").trim(),
  checkout: (process.env.NEXT_PUBLIC_GADS_CHECKOUT_LABEL || "").trim(),
  lead: (process.env.NEXT_PUBLIC_GADS_LEAD_LABEL || "").trim(),
};

type Gtag = (...args: unknown[]) => void;

/** only once components/GoogleAdsTag put gtag on the page (it does that only where it is allowed) */
export function gadsConversion(kind: keyof typeof LABEL, params: { value?: number; currency?: string; transaction_id?: string } = {}) {
  if (typeof window === "undefined" || !GADS_ID || !LABEL[kind]) return;
  try {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    if (typeof gtag !== "function") return;
    const p: Record<string, unknown> = { send_to: `${GADS_ID}/${LABEL[kind]}` };
    if (typeof params.value === "number" && params.value > 0) { p.value = Math.round(params.value * 100) / 100; p.currency = (params.currency || "EUR").toUpperCase(); }
    if (params.transaction_id) p.transaction_id = params.transaction_id;
    gtag("event", "conversion", p);
  } catch { /* never break the page */ }
}
