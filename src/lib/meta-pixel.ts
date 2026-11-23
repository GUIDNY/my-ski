/*
 * Meta (Facebook) pixel + Conversions API. Same rules as the other pixels
 * (lib/oai-pixel.ts): not on the admin/seller pages, and on /en and /fr only
 * after the cookie consent. components/MetaPixel.tsx loads the base code.
 *
 * NEXT_PUBLIC_META_PIXEL_ID (public, not a secret) is the dataset id from Events Manager.
 * Built-in fallback: the existing dataset 792481999983799.
 * The server side (lib/meta-capi.ts) additionally needs META_CAPI_TOKEN.
 *
 * Browser and server send the same event_id so Meta counts each event once:
 *   Purchase  order_<code>      (also sent by confirmDepositPaid)
 *   Lead      lead_<source>_<random>   (also POSTed to /api/meta-event)
 */
import { oaiAllowed } from "@/lib/oai-pixel";

export const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "792481999983799").trim();

type Fbq = (...args: unknown[]) => void;

function fbq(event: string, data: Record<string, unknown> | undefined, eventID: string) {
  if (typeof window === "undefined" || !META_PIXEL_ID) return false;
  try {
    if (!oaiAllowed(window.location.pathname)) return false;
    const w = window as unknown as { fbq?: Fbq; __fbqPending?: unknown[][] };
    const args = ["track", event, data || {}, { eventID }];
    if (typeof w.fbq === "function") w.fbq(...args);
    else (w.__fbqPending ||= []).push(args); // flushed by the snippet after init
    return true;
  } catch { return false; }
}

const cookie = (n: string) => { try { return document.cookie.split("; ").find(c => c.startsWith(n + "="))?.slice(n.length + 1) || ""; } catch { return ""; } };

/** tells our server about the same event (Conversions API), with the browser cookies Meta uses to match it */
function toServer(event: string, eventID: string, extra: Record<string, unknown> = {}) {
  try {
    void fetch("/api/meta-event", {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ event, eventID, url: location.href, fbp: cookie("_fbp"), fbc: cookie("_fbc"), ...extra }),
    }).catch(() => {});
  } catch { /* never break the page */ }
}

export function metaPageView() {
  if (typeof window === "undefined" || !META_PIXEL_ID) return;
  try {
    if (!oaiAllowed(window.location.pathname)) return;
    const w = window as unknown as { fbq?: Fbq; __fbqPending?: unknown[][] };
    if (typeof w.fbq === "function") w.fbq("track", "PageView");
    else (w.__fbqPending ||= []).push(["track", "PageView"]);
  } catch { /* ignore */ }
}

export function metaLead(source: "whatsapp" | "chat" | "quote") {
  if (!META_PIXEL_ID) return;
  const id = `lead_${source}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  if (fbq("Lead", { content_name: source }, id)) toServer("Lead", id, { source });
}

export function metaCheckout(orderCode: string, amount: number, currency: string) {
  fbq("InitiateCheckout", { value: Math.round(amount * 100) / 100, currency: (currency || "EUR").toUpperCase(), content_ids: [orderCode], content_type: "product", num_items: 1 }, `checkout_${orderCode.toLowerCase()}`);
}

/** value/currency only when known (the same tab that started the checkout) */
export function metaPurchase(orderCode: string, value?: number, currency?: string) {
  const code = orderCode.toLowerCase();
  const d: Record<string, unknown> = { content_ids: [code], content_type: "product" };
  if (typeof value === "number" && value > 0) { d.value = Math.round(value * 100) / 100; d.currency = (currency || "EUR").toUpperCase(); }
  fbq("Purchase", d, `order_${code}`);
}
