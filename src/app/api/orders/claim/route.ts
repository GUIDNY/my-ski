import { createServerClient } from "@/lib/supabase-server";
import { sessionUser } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

// Link an order (by its code) to the signed-in user's account (the user comes
// from the session token, not from the request body).
export async function POST(req: NextRequest) {
  const user = await sessionUser(req);
  if (!user) return NextResponse.json({ error: "login required" }, { status: 401 });
  const db = createServerClient();
  const { code } = await req.json().catch(() => ({ code: "" }));
  const user_id = user.id;
  if (!code) return NextResponse.json({ error: "missing code/user" }, { status: 400 });

  const { data: order } = await db.from("orders").select("id, user_id").eq("code", String(code).toLowerCase()).single();
  if (!order) return NextResponse.json({ error: "קוד לא נמצא" }, { status: 404 });
  if (order.user_id && order.user_id !== user_id)
    return NextResponse.json({ error: "ההזמנה כבר משויכת לחשבון אחר" }, { status: 409 });

  const { error } = await db.from("orders").update({ user_id }).eq("id", order.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
