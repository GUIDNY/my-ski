import { createServerClient } from "@/lib/supabase-server";
import { buildSeasonalRules } from "@/lib/seasonal-pricing";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db
    .from("apartments")
    .select("*")
    .eq("available", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json();
  const { data, error } = await db.from("apartments").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // seed the new apartment with the default seasonal pricing calendar
  if (data?.id) {
    try { await db.from("pricing_rules").insert(buildSeasonalRules(data.id)); } catch { /* ignore */ }
  }
  return NextResponse.json(data, { status: 201 });
}
