import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Link an order (by its code) to a logged-in user's account.
export async function POST(req: NextRequest) {
  const db = createServerClient();
  const { code, user_id } = await req.json();
  if (!code || !user_id) return NextResponse.json({ error: "missing code/user" }, { status: 400 });

  const { data: order } = await db.from("orders").select("id, user_id").eq("code", String(code).toLowerCase()).single();
  if (!order) return NextResponse.json({ error: "קוד לא נמצא" }, { status: 404 });
  if (order.user_id && order.user_id !== user_id)
    return NextResponse.json({ error: "ההזמנה כבר משויכת לחשבון אחר" }, { status: 409 });

  const { error } = await db.from("orders").update({ user_id }).eq("id", order.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
