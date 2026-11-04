import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { readSellerConfig, sellersOf, updateSellerConfig } from "@/lib/seller-store";

/*
 * Idan's sellers table (/seller/assign): who may sign in to the seller area, his
 * name and his share of the profit. A seller removed from it loses the area; his
 * leads become free (lib/seller-leads) and stay with whoever answers them next.
 * POST { email, name?, share? (percent, 0-100) }  add or update
 * POST { email, remove: true }                    remove
 */
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

export async function GET(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  if (!access.isAdmin) return NextResponse.json({ error: "admins only" }, { status: 403 });
  return NextResponse.json({ ok: true, sellers: sellersOf(await readSellerConfig(createServerClient())) });
}

export async function POST(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  if (!access.isAdmin) return NextResponse.json({ error: "admins only" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  if (!EMAIL.test(email)) return NextResponse.json({ ok: false, error: "email" }, { status: 400 });
  let error = "";
  const cfg = await updateSellerConfig(createServerClient(), c => {
    const list = [...sellersOf(c)];
    const i = list.findIndex(s => s.email === email);
    if (b.remove === true) {
      if (i < 0) return false;
      list.splice(i, 1);
      if (c.autoAssign?.seller === email) delete c.autoAssign;
    } else {
      const pct = b.share === undefined || b.share === "" ? (i >= 0 ? list[i].share * 100 : 20) : Number(b.share);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) { error = "share"; return false; }
      const name = String(b.name ?? (i >= 0 ? list[i].name : "")).trim().slice(0, 40) || email.split("@")[0];
      const row = { email, name, share: Math.round(pct * 100) / 10000 };
      if (i >= 0) list[i] = row; else list.push(row);
    }
    c.sellerList = list;
  });
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  return NextResponse.json({ ok: true, sellers: sellersOf(cfg) });
}
