import { createServerClient } from "@/lib/supabase-server";
import { isAdminUser, sessionUser } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

// Admins get every booking; a signed-in customer only the bookings made with
// their own email (the profile page). Nobody else gets anything.
export async function GET(req: NextRequest) {
  const user = await sessionUser(req);
  if (!user) return NextResponse.json({ error: "login required" }, { status: 401 });
  const db = createServerClient();
  let query = db
    .from("bookings")
    .select("*, apartment:apartments(name, type)")
    .order("created_at", { ascending: false });
  if (!isAdminUser(user)) {
    if (!user.email || !user.email_confirmed_at) return NextResponse.json([]);
    query = query.ilike("customer_email", user.email);
  }
  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json();
  const { data, error } = await db.from("bookings").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
