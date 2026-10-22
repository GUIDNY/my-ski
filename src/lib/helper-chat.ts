/**
 * The site chat talks to the same "helper" brain as the WhatsApp bot (n8n
 * "SkiShare – helper v2"), through the n8n workflow "SkiShare – אתר: צ'אט
 * ומחירים": POST `${N8N_SITE_URL}/chat` with the visitor's session and text,
 * back come the short messages ("bubbles"), the quote link when a quote was
 * made, and apartment photos. Server-only.
 */

export type HelperAnswer = {
  ok: true;
  bubbles: string[];
  link: string | null;     // the quote (PDF) when get_quote made one
  images: string[];        // apartment photos to show under the messages
  contact: string | null;  // phone number the visitor left, kept for the next messages
};

const SESSION = /^[A-Za-z0-9_-]{16,64}$/;
const SITE_LINK = /^https:\/\/(www\.)?skisharebook\.com\//;

/* Basic flood guard per server instance: real visitors never get near it. */
const hits = new Map<string, number[]>();
export function tooManyMessages(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
  return recent.length > limit;
}

// After n8n fails, use the old site bot for a minute instead of waiting on it
// again (before the n8n workflow is published, every call fails fast).
let downUntil = 0;

export function helperConfigured(): boolean {
  return !!process.env.N8N_SITE_URL && Date.now() >= downUntil;
}

export function validSession(id: unknown): id is string {
  return typeof id === "string" && SESSION.test(id);
}

/** null = the helper couldn't answer (the caller falls back to the old flow). */
export async function askHelper(input: { sessionId: string; text: string; name?: string; contact?: string; kind?: "text" | "image" }): Promise<HelperAnswer | null> {
  try {
    const res = await fetch(`${process.env.N8N_SITE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: input.sessionId,
        text: input.text.slice(0, 1500),
        name: (input.name ?? "").slice(0, 60),
        contact: (input.contact ?? "").replace(/[^\d+]/g, "").slice(0, 16),
        kind: input.kind ?? "text",
      }),
      // a quote with flights takes about a minute in n8n
      signal: AbortSignal.timeout(170_000),
    });
    if (!res.ok) {
      if (res.status === 404 || res.status >= 500) downUntil = Date.now() + 60_000;
      return null;
    }
    const j = await res.json() as Record<string, unknown>;
    const bubbles = Array.isArray(j.bubbles) ? j.bubbles.map(b => String(b ?? "").trim()).filter(Boolean).slice(0, 6) : [];
    if (j.ok !== true || !bubbles.length) return null;
    const link = typeof j.link === "string" && SITE_LINK.test(j.link) ? j.link : null;
    const images = Array.isArray(j.images)
      ? j.images.map(String).filter(u => /^https:\/\/[^\s"'<>]+$/.test(u)).slice(0, 4) : [];
    const contact = typeof j.contact === "string" && /^\+?\d{8,15}$/.test(j.contact) ? j.contact : null;
    return { ok: true, bubbles, link, images, contact };
  } catch (e) {
    console.error("helper chat:", e instanceof Error ? e.message : e);
    downUntil = Date.now() + 60_000;
    return null;
  }
}

/** A photo becomes a short description, like the WhatsApp router does for the same brain. */
export async function describeImage(base64: string, mimeType: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY || !base64) return "";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: "תאר בעברית, במשפט אחד או שניים, מה רואים בתמונה. אם יש בה טקסט (למשל הודעה, צילום מסך של טיסה או מספר הזמנה), כתוב אותו." },
          { inline_data: { mime_type: mimeType || "image/jpeg", data: base64 } },
        ] }],
        generationConfig: { maxOutputTokens: 400 },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const j = await res.json();
    const parts = j?.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p: { text?: string }) => p.text ?? "").join(" ").replace(/\s+/g, " ").trim().slice(0, 400);
  } catch {
    return "";
  }
}
