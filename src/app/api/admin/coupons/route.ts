import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { readCoupons, saveCoupons, normCode, type Coupon } from "@/lib/coupons";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  return NextResponse.json({ coupons: await readCoupons(createServerClient()) });
}

// POST { coupons: Coupon[] } — replaces the whole list (the admin page sends it all)
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const list: Coupon[] = (Array.isArray(b.coupons) ? b.coupons : [])
    .map((c: Coupon) => ({
      code: normCode(c.code),
      percent: Number(c.percent) > 0 ? Math.min(Number(c.percent), 100) : undefined,
      amount: Number(c.amount) > 0 ? Number(c.amount) : undefined,
      note: String(c.note || "").slice(0, 80) || undefined,
      active: c.active !== false,
      expires: c.expires || null,
      uses: Number(c.uses) || 0,
    }))
    .filter((c: Coupon) => c.code && (c.percent || c.amount));
  await saveCoupons(createServerClient(), list);
  return NextResponse.json({ ok: true, coupons: list });
}
