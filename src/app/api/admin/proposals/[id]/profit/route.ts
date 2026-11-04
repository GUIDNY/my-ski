import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { proposalProfit } from "@/lib/proposal-profit";
import { phoneDigits } from "@/lib/sellers";
import { readSellerConfig } from "@/lib/seller-store";
import { leadList, phoneOwners } from "@/lib/seller-leads";

/*
 * The estimated PROFIT behind one proposal, for the floating badge on /p/<id>.
 * Admins and sellers only (customers never reach this); a seller only on a quote
 * of his own lead (same phone), and he also gets his share. Math: lib/proposal-profit.ts.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const { id } = await params;
  const db = createServerClient();
  if (!access.isAdmin) {
    const [{ data: row }, cfg, leads] = await Promise.all([db.from("proposals").select("client_phone").eq("id", id).maybeSingle(), readSellerConfig(db), leadList()]);
    const owner = phoneOwners(cfg, leads ?? []).get(phoneDigits(row?.client_phone))?.seller;
    if (owner !== access.seller?.email) return NextResponse.json({ error: "not your quote" }, { status: 403 });
  }
  const p = await proposalProfit(db, id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  const share = access.seller && !access.isAdmin ? { rate: access.seller.share, amount: Math.round(p.totalProfit * access.seller.share) } : null;
  return NextResponse.json({ ok: true, ...p, share, admin: access.isAdmin });
}
