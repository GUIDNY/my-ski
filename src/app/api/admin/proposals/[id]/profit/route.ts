import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { proposalProfit } from "@/lib/proposal-profit";

/*
 * The estimated PROFIT behind one proposal, for the floating badge on /p/<id>.
 * Admins and sellers only (customers never reach this); a seller also gets his
 * share of it (lib/sellers.ts). The math is in lib/proposal-profit.ts.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const { id } = await params;
  const p = await proposalProfit(createServerClient(), id);
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  const share = access.seller && !access.isAdmin ? { rate: access.seller.share, amount: Math.round(p.totalProfit * access.seller.share) } : null;
  return NextResponse.json({ ok: true, ...p, share, admin: access.isAdmin });
}
