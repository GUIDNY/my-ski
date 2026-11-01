import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { buildSiteProposal } from "@/lib/site-proposal";
import { encodeExtras } from "@/lib/quote-extras";
import { stripForReplacement } from "@/lib/replacement";

// Admin-only: a price-free "חופשת החזר" version of a SITE quote (/q/<id>), saved as a /p proposal.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  if (!/^[a-z0-9]{4,12}$/i.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  const db = createServerClient();
  const { data: q } = await db.from("quotes").select("*").eq("id", id).maybeSingle();
  if (!q) return NextResponse.json({ error: "not found" }, { status: 404 });
  const guests = Number(q.guests) || 2;
  const x = encodeExtras({
    ...(q.ski_pass ? { pass: { area: "val_thorens" as const, qty: guests } } : {}),
    ...(q.transfer ? { transfer: { qty: guests } } : {}),
    ...(q.equipment ? { equipment: { qty: guests } } : {}),
  });
  const choices: Record<string, string> = {
    apartment_id: String(q.apartment_id || ""), checkin: String(q.checkin || ""), checkout: String(q.checkout || ""),
    guests: String(guests), cancel: String(q.cancel || "regular"), service: String(q.service || "human"), x, q: id,
  };
  const r = await buildSiteProposal(k => choices[k] || "");
  if (!r) return NextResponse.json({ error: "build failed" }, { status: 500 });
  const data = stripForReplacement(r.data);
  const { data: created, error } = await db.from("proposals")
    .insert({ client_name: String(q.client_name || "") || null, client_phone: null, data })
    .select("id").single();
  if (error || !created) return NextResponse.json({ error: error?.message || "insert failed" }, { status: 500 });
  return NextResponse.json({ ok: true, id: created.id, url: `https://skisharebook.com/p/${created.id}` });
}
