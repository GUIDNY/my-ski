import { confirmDepositPaid } from "@/lib/confirm-order";
import { NextRequest, NextResponse } from "next/server";

// Fallback confirmation from the /pay/success redirect — in case the PayPlus
// IPN callback is delayed or missed. Idempotent with the callback.
export async function POST(req: NextRequest) {
  const { order_code } = await req.json().catch(() => ({ order_code: "" }));
  if (!order_code) return NextResponse.json({ error: "missing order_code" }, { status: 400 });
  const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
  const res = await confirmDepositPaid(String(order_code), origin);
  return NextResponse.json({ ok: true, changed: res.changed });
}
