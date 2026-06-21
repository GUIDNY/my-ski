import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Public lookup of an order by its personal-area code.
export async function GET(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const db = createServerClient();
  const { code } = await params;
  const { data, error } = await db
    .from("orders")
    .select("code, apartment_name, area, checkin, checkout, guests, nights, ski_pass, transfer, cancel, service, total_eur, status, customer_name")
    .eq("code", code.toLowerCase())
    .single();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}
