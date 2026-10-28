import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Public lookup of an order by its personal-area code.
export async function GET(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const db = createServerClient();
  const { code } = await params;
  const { data, error } = await db
    .from("orders")
    .select("code, apartment_id, apartment_name, extra_apartment_id, extra_apartment_name, area, checkin, checkout, guests, nights, ski_pass, transfer, equipment, flight, flight_details, transfer_details, ops, cancel, service, total_eur, status, customer_name")
    .eq("code", code.toLowerCase())
    .single();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  const ids = [data.apartment_id, data.extra_apartment_id].filter(Boolean) as string[];
  const { data: apts } = ids.length ? await db.from("apartments").select("id, images").in("id", ids) : { data: [] as { id: string; images: string[] | null }[] };
  const images = ids.flatMap(id => (apts ?? []).find(a => a.id === id)?.images ?? []).slice(0, 12);
  const { ops, apartment_id: _a, extra_apartment_id: _b, ...rest } = data;
  void _a; void _b;
  return NextResponse.json({ ...rest, pass3v: !!(ops && (ops as Record<string, boolean>).x_pass3v), apartment: { images } });
}
