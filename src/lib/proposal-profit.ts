import type { SupabaseClient } from "@supabase/supabase-js";
import { apartmentProfit } from "@/lib/profit";
import { FLIGHT_MARGIN_EUR } from "@/lib/flight-margin";

/*
 * The estimated PROFIT behind one proposal (/p/<id>), from its price table:
 * - agency apartments (la_cime/VTI): sell already includes 32% on cost → profit = sell - sell/1.32
 * - own seasonal apartments: cost/night from the signed 2026-27 contracts
 * - flights: our margin per person
 * Equipment, ski pass and transfers are at cost / external commission: not counted.
 */
export type ProfitLine = { label: string; sell: number; cost: number | null; profit: number | null };
export type ProposalProfit = { lines: ProfitLine[]; totalProfit: number; grandTotal: number; note: string };
type Apt = { name: string | null; source: string | null };
type Data = { sections?: { heading?: string; blocks?: { type?: string; rows?: string[][]; total?: string[] }[] }[] } | null;

export const PROFIT_NOTE = "ציוד, סקיפס והסעה לא נספרים (עמלות חיצוניות/מחיר עלות)";
const eur = (s: string) => { const m = String(s).replace(/,/g, "").match(/€\s*(\d+(?:\.\d+)?)/); return m ? Number(m[1]) : 0; };

export function profitFromData(raw: unknown, apts: Apt[]): ProposalProfit | null {
  const data = raw as Data;
  if (!data?.sections) return null;
  const srcOf = (label: string) => apts.find(a => a.name && label.includes(a.name))?.source || null;
  const table = data.sections.flatMap(s => s.blocks || []).find(b => b.type === "table");
  const lines: ProfitLine[] = [];
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
      lines.push({ label: `טיסות (המרווח שלנו €${FLIGHT_MARGIN_EUR} לאדם)`, sell: sellTotal, cost: sellTotal - FLIGHT_MARGIN_EUR * pax, profit: FLIGHT_MARGIN_EUR * pax });
    }
  }
  const totalProfit = lines.reduce((s, l) => s + (l.profit || 0), 0);
  return { lines, totalProfit, grandTotal: eur(table?.total?.[3] || ""), note: PROFIT_NOTE };
}

export async function apartmentsForProfit(db: SupabaseClient): Promise<Apt[]> {
  const { data } = await db.from("apartments").select("name, source");
  return (data ?? []) as Apt[];
}

export async function proposalProfit(db: SupabaseClient, id: string, apts?: Apt[]): Promise<ProposalProfit | null> {
  const { data: row } = await db.from("proposals").select("data").eq("id", id).maybeSingle();
  if (!row?.data) return null;
  return profitFromData(row.data, apts ?? await apartmentsForProfit(db));
}
