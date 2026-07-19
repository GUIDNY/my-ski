import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Internal management of our own seasonal properties & agency properties.
export async function GET(req: NextRequest) {
  const db = createServerClient();
  const kind = req.nextUrl.searchParams.get("kind");
  let q = db.from("managed_properties").select("*").order("created_at", { ascending: false });
  if (kind) q = q.eq("kind", kind);
  const { data: props, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // attach payments to each property
  const ids = (props ?? []).map(p => p.id);
  let payments: Record<string, unknown[]> = {};
  if (ids.length) {
    const { data: pays } = await db.from("property_payments").select("*").in("property_id", ids).order("due_date", { ascending: true });
    payments = (pays ?? []).reduce((acc: Record<string, unknown[]>, p) => {
      (acc[p.property_id] ??= []).push(p); return acc;
    }, {});
  }
  return NextResponse.json((props ?? []).map(p => ({ ...p, payments: payments[p.id] ?? [] })));
}

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json();
  const { data, error } = await db.from("managed_properties").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
