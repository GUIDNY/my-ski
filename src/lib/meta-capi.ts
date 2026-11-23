import { createHash } from "crypto";

/*
 * Meta Conversions API (server side). Needs META_CAPI_TOKEN (Events Manager >
 * Settings > Conversions API > Generate access token) and the pixel id
 * (NEXT_PUBLIC_META_PIXEL_ID). Without either it does nothing, quietly.
 * event_id matches the browser pixel (lib/meta-pixel.ts) so Meta de-duplicates.
 */
const PIXEL = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim();
const sha = (v?: string | null) => {
  const s = (v || "").trim().toLowerCase();
  return s ? createHash("sha256").update(s).digest("hex") : undefined;
};

export type CapiEvent = {
  event: "Purchase" | "Lead" | "InitiateCheckout";
  eventId: string;
  url?: string;
  value?: number; currency?: string; contentIds?: string[];
  email?: string | null; phone?: string | null; name?: string | null;
  fbp?: string; fbc?: string; ip?: string; ua?: string;
};

export async function sendMetaEvent(e: CapiEvent) {
  const token = (process.env.META_CAPI_TOKEN || "").trim();
  if (!token || !PIXEL) return;
  try {
    const digits = (e.phone || "").replace(/\D/g, "");
    const first = (e.name || "").trim().split(/\s+/)[0];
    const user: Record<string, unknown> = {
      em: e.email ? [sha(e.email)] : undefined,
      ph: digits ? [sha(digits)] : undefined,
      fn: first ? [sha(first)] : undefined,
      fbp: e.fbp || undefined, fbc: e.fbc || undefined,
      client_ip_address: e.ip || undefined, client_user_agent: e.ua || undefined,
    };
    const custom: Record<string, unknown> = {};
    if (e.value && e.value > 0) { custom.value = Math.round(e.value * 100) / 100; custom.currency = (e.currency || "EUR").toUpperCase(); }
    if (e.contentIds?.length) { custom.content_ids = e.contentIds; custom.content_type = "product"; }
    const body = {
      data: [{
        event_name: e.event, event_time: Math.floor(Date.now() / 1000), event_id: e.eventId,
        action_source: "website", event_source_url: e.url || "https://skisharebook.com",
        user_data: user, custom_data: custom,
      }],
    };
    const r = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(PIXEL)}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) console.warn("[meta-capi]", r.status, (await r.text().catch(() => "")).slice(0, 200));
  } catch (err) { console.warn("[meta-capi] failed", err instanceof Error ? err.message : err); }
}
