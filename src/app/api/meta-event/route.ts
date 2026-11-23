import { NextRequest, NextResponse } from "next/server";
import { sendMetaEvent } from "@/lib/meta-capi";

// The browser tells us about a Lead it just sent to the Meta pixel, so the same
// event also goes through the Conversions API (same event id = counted once).
// Quiet no-op until META_CAPI_TOKEN is set. Only Lead is accepted from the browser.
export async function POST(req: NextRequest) {
  if (!process.env.META_CAPI_TOKEN) return NextResponse.json({ ok: true, skipped: true });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  const id = String(b.eventID || "");
  if (b.event !== "Lead" || !/^lead_[a-z]+_[a-z0-9]{4,24}$/.test(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const str = (v: unknown, n: number) => String(v || "").slice(0, n);
  await sendMetaEvent({
    event: "Lead", eventId: id, url: str(b.url, 500),
    fbp: str(b.fbp, 100), fbc: str(b.fbc, 200),
    ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim(), ua: req.headers.get("user-agent") || undefined,
  });
  return NextResponse.json({ ok: true });
}
