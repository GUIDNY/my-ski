import { NextRequest, NextResponse } from "next/server";

// PayPlus server-to-server callback (IPN).
// Forwards the transaction to the n8n webhook (if configured) so n8n can
// email the customer a booking confirmation. Always returns 200 to PayPlus.
export async function POST(req: NextRequest) {
  let payload: unknown = null;
  try { payload = await req.json(); } catch { payload = null; }

  const hook = process.env.N8N_WEBHOOK_URL;
  if (hook && payload) {
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "payplus", receivedAt: new Date().toISOString(), data: payload }),
      });
    } catch { /* never block PayPlus on n8n errors */ }
  }

  return NextResponse.json({ ok: true });
}
