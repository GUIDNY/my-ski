import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { N8N_UA } from "@/lib/airbnb-calendar";

/*
 * Admin quote builder: the free apartments for some dates (with the price we'd sell each one at),
 * and a quote built from the apartments the admin picked by hand. Both go to the same n8n quote
 * engine the WhatsApp bots use (`${N8N_SITE_URL}/quote`), so the prices, ski pass, transfer,
 * equipment and payment links are exactly the bots'. Nothing is sent to the customer: the
 * answer is the quote's link, for the admin to send.
 */
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const base = process.env.N8N_SITE_URL;
  if (!base) return NextResponse.json({ ok: false, error: "n8n is not configured" }, { status: 500 });
  const b = await req.json().catch(() => ({}));
  const create = b.action === "create";
  try {
    const res = await fetch(`${base}/quote`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "User-Agent": N8N_UA },
      body: JSON.stringify(b),
      signal: AbortSignal.timeout(create ? 170_000 : 60_000),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j) return NextResponse.json({ ok: false, error: `n8n answered ${res.status}` }, { status: 502 });
    return NextResponse.json(j);
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "n8n did not answer" }, { status: 504 });
  }
}
