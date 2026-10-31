import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { couponDiscount } from "@/lib/coupons";

/*
 * Public: a coupon on a proposal page, where the payment buttons are
 * pre-made PayPlus links with the full amount. A valid code answers with a
 * NEW PayPlus link for the discounted total. Invalid → { valid: false }.
 */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const total = Number(b.total) || 0;
  if (!(total > 0)) return NextResponse.json({ valid: false });
  const hit = await couponDiscount(createServerClient(), String(b.code || ""), total);
  if (!hit) return NextResponse.json({ valid: false });
  const amount = Math.max(1, Math.round((total - hit.discount) * 100) / 100);
  const origin = req.nextUrl.origin;
  try {
    const r = await fetch(`${origin}/api/payplus/create-link`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency: "EUR", description: `${String(b.description || "חופשת סקי בוואל טורנס").slice(0, 80)} · קופון ${hit.coupon.code}` }),
    });
    const j = await r.json();
    if (!j?.url) return NextResponse.json({ valid: false });
    const label = hit.coupon.percent ? `${hit.coupon.percent}% הנחה` : `€${hit.coupon.amount} הנחה`;
    return NextResponse.json({ valid: true, discount: hit.discount, label, amount, url: j.url });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
