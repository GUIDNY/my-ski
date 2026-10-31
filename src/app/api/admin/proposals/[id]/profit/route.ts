import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { apartmentProfit } from "@/lib/profit";

/*
 * Admin-only: the estimated PROFIT behind one proposal, for the floating
 * badge on /p/<id>. Customers never reach this (requireAdmin).
 * - agency apartments (la_cime/VTI): sell already includes 32% on cost → profit = sell - sell/1.32
 * - own seasonal apartments: cost/night from the signed 2026-27 contracts
 * - flights: our €25-per-person margin
 */
export const dynamic = "force-dynamic";


const eur = (s: string) => { const m = String(s).replace(/,/g, "").match(/€\s*(\d+(?:\.\d+)?)/); return m ? Number(m[1]) : 0; };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const db = createServerClient();
  const { data: row } = await db.from("proposals").select("data").eq("id", id).maybeSingle();
  const data = row?.data as { sections?: { heading?: string; blocks?: { type?: string; rows?: string[][]; total?: string[] }[] }[] } | null;
  if (!data?.sections) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: apts } = await db.from("apartments").select("name, source");
  const srcOf = (label: string) => apts?.find(a => a.name && label.includes(a.name))?.source || null;

  const table = data.sections.flatMap(s => s.blocks || []).find(b => b.type === "table");
  const lines: { label: string; sell: number; cost: number | null; profit: number | null }[] = [];
  let nights = 7;
  for (const s of data.sections) for (const b of s.blocks || []) if (b.type === "summary") for (const r of b.rows || []) {
    if (r[0] === "משך החופשה") { const m = String(r[1]).match(/(\d+)/); if (m) nights = Number(m[1]); }
  }
  for (const r of table?.rows || []) {
    const [label, qty, , totalS] = r;
    const sellTotal = eur(totalS || "");
    if (/^לינה/.test(label) && sellTotal > 0) {
      const { cost, profit } = apartmentProfit(label, srcOf(label), sellTotal, nights);
      lines.push({ label: label.slice(0, 60), sell: sellTotal, cost, profit });
    } else if (/^טיסות/.test(label) && sellTotal > 0) {
      const pax = Number(qty) || 0;
      lines.push({ label: "טיסות (המרווח שלנו €25 לאדם)", sell: sellTotal, cost: sellTotal - 25 * pax, profit: 25 * pax });
    }
  }
  const total = lines.reduce((s, l) => s + (l.profit || 0), 0);
  const grand = eur(table?.total?.[3] || "");
  return NextResponse.json({ ok: true, lines, totalProfit: total, grandTotal: grand, note: "ציוד, סקיפס והסעה לא נספרים (עמלות חיצוניות/מחיר עלות)" });
}
