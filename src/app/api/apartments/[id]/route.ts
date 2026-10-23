import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, sessionUser, isAdminUser } from "@/lib/api-auth";
import { PUBLIC_APARTMENT_COLUMNS } from "@/lib/apartment-fields";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = createServerClient();
  const { id } = await params;
  // the admin editor gets every column; everyone else only the public ones
  const admin = req.headers.get("authorization") ? isAdminUser(await sessionUser(req)) : false;
  const { data, error } = await db.from("apartments").select(admin ? "*" : PUBLIC_APARTMENT_COLUMNS).eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const db = createServerClient();
  const { id } = await params;
  const body = await req.json();
  const { data, error } = await db.from("apartments").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const db = createServerClient();
  const { id } = await params;
  const { error } = await db.from("apartments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
