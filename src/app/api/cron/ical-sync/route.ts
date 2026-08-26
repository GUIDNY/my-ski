import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { syncApartmentIcal } from "@/lib/ical-sync";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Give this route room to fetch + sync every apartment's calendars in one run
// (60s is supported on both Hobby and Pro Vercel plans without extra config).
export const maxDuration = 60;

// Triggered daily by Vercel Cron (see vercel.json). Syncs every apartment
// that has at least one iCal source, one apartment at a time.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: sources } = await supabase.from("ical_sources").select("*");
  if (!sources?.length) return NextResponse.json({ apartments: 0, synced: 0 });

  const byApartment = new Map<string, typeof sources>();
  for (const s of sources) {
    if (!byApartment.has(s.apartment_id)) byApartment.set(s.apartment_id, []);
    byApartment.get(s.apartment_id)!.push(s);
  }

  let totalSynced = 0;
  for (const [apartment_id, aptSources] of byApartment) {
    totalSynced += await syncApartmentIcal(supabase, apartment_id, aptSources);
  }

  return NextResponse.json({ apartments: byApartment.size, synced: totalSynced });
}
