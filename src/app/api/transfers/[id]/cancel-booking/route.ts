import { createServerClient } from "@/lib/supabase-server";
import { cancelBooking } from "@/lib/winteride";
import { NextRequest, NextResponse } from "next/server";

// Cancels an already-confirmed Winteride booking (real refund flow on their side).
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const { data: t, error } = await db.from("transfers").select("*").eq("id", id).single();
  if (error || !t) return NextResponse.json({ error: "transfer not found" }, { status: 404 });
  if (!t.winteride_ref) return NextResponse.json({ error: "no Winteride booking to cancel" }, { status: 400 });

  try {
    for (const ref of String(t.winteride_ref).split(", ")) await cancelBooking(ref);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "cancel failed" }, { status: 502 });
  }

  const { data: updated, error: updateError } = await db.from("transfers")
    .update({ status: "cancelled", winteride_status: "cancelled" }).eq("id", id).select().single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json(updated);
}
