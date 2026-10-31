import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { couponDiscount } from "@/lib/coupons";

/* Public: POST { code, total } → { valid, discount, label }. Tells nothing
   about other codes; an invalid code just answers valid:false. */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const total = Number(b.total) || 0;
  const hit = await couponDiscount(createServerClient(), String(b.code || ""), total);
  if (!hit) return NextResponse.json({ valid: false });
  const label = hit.coupon.percent ? `${hit.coupon.percent}% הנחה` : `€${hit.coupon.amount} הנחה`;
  return NextResponse.json({ valid: true, discount: hit.discount, label });
}
