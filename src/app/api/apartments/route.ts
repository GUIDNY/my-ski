import { createServerClient } from "@/lib/supabase-server";
import { buildSeasonalRules } from "@/lib/seasonal-pricing";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { PUBLIC_APARTMENT_COLUMNS } from "@/lib/apartment-fields";

export async function GET(req: NextRequest) {
  const db = createServerClient();
  // ?all: the admin list, every apartment and every column
  const all = req.nextUrl.searchParams.has("all");
  if (all) {
    const denied = await requireAdmin(req);
    if (denied) return denied;
  }
  let q = db.from("apartments").select(all ? "*" : PUBLIC_APARTMENT_COLUMNS).order("created_at", { ascending: false });
  if (!all) q = q.eq("available", true);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
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
