import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();
  const { data: src, error: e1 } = await db.from("proposals").select("*").eq("id", id).single();
  if (e1 || !src) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { data: num } = await db.rpc("next_proposal_number");
  const copy = {
    proposal_number: num as string,
    client_name: src.client_name,
    client_email: src.client_email,
    client_phone: src.client_phone,
    status: "draft",
    valid_until: src.valid_until,
    currency: src.currency,
    data: src.data,
  };
  const { data, error } = await db.from("proposals").insert(copy).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
