import { createServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  const db = createServerClient();
  const { data, error } = await db
    .from("ski_passes")
    .select("*")
    .eq("available", true)
    .order("price");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
