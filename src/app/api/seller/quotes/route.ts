import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { apartmentsForProfit, profitFromData } from "@/lib/proposal-profit";
import { phoneDigits } from "@/lib/sellers";

/*
 * /seller/quotes: the quotes sent lately (the bot's and Idan's proposals, /p/<id>),
 * each with its estimated profit and the seller's share of it if it closes.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const db = createServerClient();
  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days")) || 60, 1), 365);
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const [{ data }, apts] = await Promise.all([
    db.from("proposals").select("id, proposal_number, client_name, client_phone, status, created_at, data")
      .gte("created_at", since).order("created_at", { ascending: false }).limit(200),
    apartmentsForProfit(db),
  ]);
  const rate = access.seller?.share ?? 0;
  const quotes = (data ?? []).map(p => {
    const pr = profitFromData(p.data, apts);
    const d = p.data as { title?: string; subtitle?: string } | null;
    return {
      id: p.id, number: p.proposal_number, client: p.client_name || "", phone: phoneDigits(p.client_phone),
      status: p.status, createdAt: p.created_at, title: d?.subtitle || d?.title || "",
      total: pr?.grandTotal ?? 0, profit: pr && pr.lines.length ? pr.totalProfit : null,
      share: pr && pr.lines.length && rate ? Math.round(pr.totalProfit * rate) : null,
    };
  });
  return NextResponse.json({ ok: true, rate, quotes });
}
