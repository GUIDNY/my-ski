import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { cleanCheckin, guestView } from "@/lib/checkin";
import { tooManyMessages } from "@/lib/helper-chat";

// Online check-in from the personal area: the order code is the key (like the order page).
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = String(code || "").toLowerCase();
  if (!/^[a-z0-9]{4,12}$/.test(c)) return NextResponse.json({ error: "bad code" }, { status: 400 });
  if (tooManyMessages(`checkin:${c}`, 10, 10 * 60_000)) return NextResponse.json({ error: "too many" }, { status: 429 });
  const db = createServerClient();
  const { data: o } = await db.from("orders").select("id, status, guests, ops").eq("code", c).single();
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (o.status !== "approved" && o.status !== "hold") return NextResponse.json({ error: "not confirmed" }, { status: 409 });
  const data = cleanCheckin(await req.json().catch(() => ({})), Number(o.guests) || 1);
  if (!data) return NextResponse.json({ error: "missing" }, { status: 400 });
  const ops = { ...((o.ops as Record<string, unknown>) || {}), x_checkin: data };
  const { error } = await db.from("orders").update({ ops }).eq("id", o.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ...guestView(ops) });
}
