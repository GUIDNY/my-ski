import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

const MARKUP = 1.25;

// Every Saturday of the current/upcoming Val Thorens ski season (roughly
// Nov 28 -> May 3), starting from today if we're already mid-season.
function seasonSaturdays(): Date[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const y = now.getFullYear();
  const candidates = [
    { start: new Date(y - 1, 10, 28), end: new Date(y, 4, 3) },
    { start: new Date(y, 10, 28), end: new Date(y + 1, 4, 3) },
  ];
  const season = candidates.find(c => now <= c.end) ?? candidates[1];
  const rangeStart = now > season.start ? now : season.start;

  const day = rangeStart.getDay(); // 0=Sun..6=Sat
  const toSat = (6 - day + 7) % 7;
  const firstSat = new Date(rangeStart);
  firstSat.setDate(firstSat.getDate() + toSat);

  const weeks: Date[] = [];
  const cursor = new Date(firstSat);
  while (cursor <= season.end) {
    weeks.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

const fmtFR = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
const fmtISO = (d: Date) => d.toISOString().slice(0, 10);

// Each property card in the search results HTML starts at `<div id="availability-`.
// Within a card: `data-caption="REF - ..."` gives the reference, and when the
// search was date-filtered, `<div class="rate">1&#160;216 EUR</div>` gives that
// week's actual price (not the generic "starting from" price shown on the
// unfiltered catalog). The raw HTML still has entities un-decoded, so the
// thousands separator is literally the 6 characters "&#160;", not a space.
const PRICE_RE = /<div class="rate">([^<]+)<\/div>/;

function parseWeekOffers(html: string): Map<string, number> {
  const offers = new Map<string, number>();
  const cards = html.split('<div id="availability-');
  for (const card of cards) {
    const refMatch = card.match(/data-caption="([A-Z0-9]+) -/);
    if (!refMatch) continue;
    const priceMatch = card.match(PRICE_RE);
    if (!priceMatch) continue;
    const digits = priceMatch[1].replace(/[^0-9]/g, "");
    if (!digits) continue;
    offers.set(refMatch[1], parseInt(digits, 10));
  }
  return offers;
}

// Triggered daily by Vercel Cron. For every Saturday-to-Saturday week left
// in the ski season, asks the partner site (Agence La Cime / Arkiane) which
// properties are free that week and at what price, and records the list of
// {week, price} for every apartment we imported from them (source = 'la_cime').
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: ours } = await supabase.from("apartments").select("id,source_ref").eq("source", "la_cime");
  if (!ours?.length) return NextResponse.json({ checked: 0, weeksScanned: 0 });

  const weeks = seasonSaturdays();
  // ref -> [{week, price}]
  const byRef = new Map<string, { week: string; price: number }[]>();

  for (const sat of weeks) {
    const checkout = new Date(sat);
    checkout.setDate(checkout.getDate() + 7);
    const url = `https://agencelacime.locvacances.com/?startDate=${encodeURIComponent(fmtFR(sat))}&endDate=${encodeURIComponent(fmtFR(checkout))}`;
    let html = "";
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.ok) html = await res.text();
    } catch {
      continue; // skip this week on network failure, don't fail the whole sync
    }
    const offers = parseWeekOffers(html);
    for (const [ref, basePrice] of offers) {
      if (!byRef.has(ref)) byRef.set(ref, []);
      byRef.get(ref)!.push({ week: fmtISO(sat), price: Math.round(basePrice * MARKUP) });
    }
  }

  let updated = 0;
  for (const apt of ours) {
    const availableWeeks = (apt.source_ref && byRef.get(apt.source_ref)) || [];
    await supabase.from("apartments")
      .update({ available_weeks: availableWeeks, available: availableWeeks.length > 0 })
      .eq("id", apt.id);
    updated++;
  }

  return NextResponse.json({
    weeksScanned: weeks.length,
    seasonRange: weeks.length ? { from: fmtISO(weeks[0]), to: fmtISO(weeks[weeks.length - 1]) } : null,
    apartmentsUpdated: updated,
  });
}
