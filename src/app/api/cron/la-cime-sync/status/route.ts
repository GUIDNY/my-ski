import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Read-only, no secret required — just answers "did the sync run, and when."
export async function GET() {
  const { data, error } = await supabase
    .from("sync_log")
    .select("*")
    .eq("job", "la_cime_sync")
    .order("ran_at", { ascending: false })
    .limit(10);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const last = data?.[0] ?? null;
  const hoursSinceLast = last ? (Date.now() - new Date(last.ran_at).getTime()) / 3600000 : null;

  return NextResponse.json({
    lastRun: last,
    hoursSinceLast: hoursSinceLast !== null ? Math.round(hoursSinceLast * 10) / 10 : null,
    staleWarning: hoursSinceLast !== null && hoursSinceLast > 30,
    recentRuns: data,
  });
}
