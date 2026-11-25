import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { gearOf, sendGearEmail } from "@/lib/gear-email";

/** Admin: (re)send an equipment order's email to the customer */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await req.json().catch(() => ({}));
  const db = createServerClient();
  const { data: o } = await db.from("orders").select("*").eq("id", String(id || "")).single();
  if (!o || !gearOf(o)) return NextResponse.json({ error: "not an equipment order" }, { status: 404 });
  if (!o.customer_email) return NextResponse.json({ error: "אין מייל בהזמנה" }, { status: 400 });
  const paid = ["hold", "approved"].includes(String(o.status));
  const ok = await sendGearEmail(o, req.nextUrl.origin, paid);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "השליחה נכשלה" }, { status: 502 });
}
