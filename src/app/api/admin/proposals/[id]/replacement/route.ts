import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { stripForReplacement } from "@/lib/replacement";
import type { ProposalData } from "@/types";

// Admin-only: a price-free "חופשת החזר" COPY of this proposal, as a new /p link.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const db = createServerClient();
  const { data: row } = await db.from("proposals").select("client_name, client_phone, data").eq("id", id).maybeSingle();
  if (!row?.data) return NextResponse.json({ error: "not found" }, { status: 404 });
  const data = stripForReplacement(row.data as ProposalData);
  const { data: created, error } = await db.from("proposals")
    .insert({ client_name: row.client_name, client_phone: row.client_phone, data })
    .select("id").single();
  if (error || !created) return NextResponse.json({ error: error?.message || "insert failed" }, { status: 500 });
  return NextResponse.json({ ok: true, id: created.id, url: `https://skisharebook.com/p/${created.id}` });
}
