import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Full account deletion (Apple App Store guideline 5.1.1(v)).
// Verifies the caller's own session token, then removes personal data and the auth user.
export async function POST(req: NextRequest) {
  const { access_token } = await req.json().catch(() => ({ access_token: "" }));
  if (!access_token) return NextResponse.json({ error: "missing token" }, { status: 401 });

  const db = createServerClient();
  const { data: { user }, error } = await db.auth.getUser(access_token);
  if (error || !user) return NextResponse.json({ error: "invalid session" }, { status: 401 });
  const uid = user.id;

  // remove the user's personal data
  await db.from("saved_trips").delete().eq("user_id", uid);
  // unlink orders (kept for legal/accounting per privacy policy, no longer tied to an account)
  await db.from("orders").update({ user_id: null }).eq("user_id", uid);

  // delete the auth account
  const { error: delErr } = await db.auth.admin.deleteUser(uid);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
