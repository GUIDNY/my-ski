import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

// Admin only: a booking holds the guest's name, email and phone. (The old
// /book/confirm page read it without signing in; that page is gone.)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const db = createServerClient();
  const { id } = await params;
  const { data, error } = await db.from("bookings").select("*, apartment:apartments(name,type)").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const db = createServerClient();
  const { id } = await params;
  const body = await req.json();
  const { data, error } = await db.from("bookings").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
