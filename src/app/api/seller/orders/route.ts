import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { SELLERS } from "@/lib/sellers";
import { updateSellerConfig } from "@/lib/seller-store";
import { sellerOrders, totals } from "@/lib/seller-orders";

/*
 * /seller/orders: a seller gets his own orders and his share; an admin gets every
 * recent order with its owner, and can change who it belongs to and its profit.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const { orders } = await sellerOrders(createServerClient());
  if (access.isAdmin) {
    const bySeller = Object.fromEntries(SELLERS.map(s => [s.email, totals(orders.filter(o => o.owner === s.email))]));
    return NextResponse.json({ ok: true, admin: true, sellers: SELLERS, orders: orders.slice(0, 200), bySeller });
  }
  const me = access.seller!;
  const mine = orders.filter(o => o.owner === me.email);
  return NextResponse.json({ ok: true, admin: false, seller: me, orders: mine, totals: totals(mine) });
}

// admin only: { code, seller: "<email>" | "" (nobody) | "auto", profit: number | null (back to the estimate) }
export async function POST(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  if (!access.isAdmin) return NextResponse.json({ error: "admins only" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const code = String(b.code || "").trim();
  if (!/^[A-Za-z0-9-]{3,20}$/.test(code)) return NextResponse.json({ ok: false }, { status: 400 });
  await updateSellerConfig(createServerClient(), cfg => {
    const ov = { ...(cfg.orders[code] ?? {}) };
    if ("seller" in b) {
      const s = String(b.seller ?? "");
      if (s === "auto") delete ov.seller;
      else if (s === "" || SELLERS.some(x => x.email === s)) ov.seller = s;
    }
    if ("profit" in b) {
      const p = b.profit === null || b.profit === "" ? null : Number(b.profit);
      if (p === null) delete ov.profit; else if (Number.isFinite(p)) ov.profit = Math.round(p);
    }
    if (Object.keys(ov).length) cfg.orders[code] = ov; else delete cfg.orders[code];
  });
  return NextResponse.json({ ok: true });
}
