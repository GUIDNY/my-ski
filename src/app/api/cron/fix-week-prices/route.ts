import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

/*
 * Repairs week prices that were read 100× too high (La Cime prices with cents,
 * "1 540,80 €" read as 154 080: fixed in la-cime-sync on 5.11.2026). A week of
 * more than €30,000 is never real, so it is divided by 100. It changes nothing
 * else and does nothing when all prices are fine, so it needs no secret.
 */
export const dynamic = "force-dynamic";

const LIMIT = 30000;

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db.from("apartments").select("id, name, available_weeks").eq("source", "la_cime");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const fixed: { name: string; week: string; from: number; to: number }[] = [];
  for (const a of data ?? []) {
    const weeks = Array.isArray(a.available_weeks) ? a.available_weeks as { week: string; price: number }[] : [];
    if (!weeks.some(w => w && typeof w.price === "number" && w.price > LIMIT)) continue;
    const next = weeks.map(w => {
      if (!(w && typeof w.price === "number" && w.price > LIMIT)) return w;
      const to = Math.round(w.price / 100);
      fixed.push({ name: String(a.name || "").split(" — ").pop() || a.id, week: w.week, from: w.price, to });
      return { ...w, price: to };
    });
    await db.from("apartments").update({ available_weeks: next }).eq("id", a.id);
  }
  return NextResponse.json({ ok: true, fixed });
}
