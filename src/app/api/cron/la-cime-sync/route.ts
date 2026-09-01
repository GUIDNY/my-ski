import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 30;

// Next Saturday-to-Saturday week (rolling: if today is Saturday, that's checkin).
function upcomingWeek(): { checkin: Date; checkout: Date } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun..6=Sat
  const daysUntilSat = (6 - day + 7) % 7;
  const checkin = new Date(now);
  checkin.setDate(checkin.getDate() + daysUntilSat);
  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + 7);
  return { checkin, checkout };
}

const fmtFR = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

// Triggered daily by Vercel Cron. Queries the partner site (Agence La Cime,
// via its Arkiane booking engine) for which properties are free for the
// upcoming Saturday-to-Saturday week, and mirrors that into `available` for
// every apartment we imported from them (source = 'la_cime').
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: ours } = await supabase.from("apartments").select("id,source_ref").eq("source", "la_cime");
  if (!ours?.length) return NextResponse.json({ checked: 0, available: 0, unavailable: 0 });

  const { checkin, checkout } = upcomingWeek();
  const url = `https://agencelacime.locvacances.com/?startDate=${encodeURIComponent(fmtFR(checkin))}&endDate=${encodeURIComponent(fmtFR(checkout))}`;

  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) return NextResponse.json({ error: `partner site returned ${res.status}` }, { status: 502 });
  const html = await res.text();

  const availableRefs = new Set(
    [...html.matchAll(/data-caption="([A-Z0-9]+) -/g)].map(m => m[1])
  );

  let availableCount = 0, unavailableCount = 0;
  for (const apt of ours) {
    const isAvailable = !!apt.source_ref && availableRefs.has(apt.source_ref);
    await supabase.from("apartments").update({ available: isAvailable }).eq("id", apt.id);
    if (isAvailable) availableCount++; else unavailableCount++;
  }

  return NextResponse.json({
    week: { checkin: fmtFR(checkin), checkout: fmtFR(checkout) },
    checked: ours.length,
    available: availableCount,
    unavailable: unavailableCount,
  });
}
