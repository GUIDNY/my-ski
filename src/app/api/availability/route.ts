import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apartment_id = searchParams.get("apartment_id");
  const month = searchParams.get("month"); // YYYY-MM
  if (!apartment_id || !month) return NextResponse.json({ error: "missing params" }, { status: 400 });

  const start = `${month}-01`;
  const end   = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0)
    .toISOString().split("T")[0];

  const [blocks, bookings] = await Promise.all([
    supabase.from("availability_blocks").select("*").eq("apartment_id", apartment_id).gte("date", start).lte("date", end),
    supabase.from("bookings").select("check_in,check_out,status,customer_name,guests").eq("apartment_id", apartment_id)
      .or(`check_in.lte.${end},check_out.gte.${start}`),
  ]);

  return NextResponse.json({ blocks: blocks.data ?? [], bookings: bookings.data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { apartment_id, date, status, note } = body;
  if (!apartment_id || !date) return NextResponse.json({ error: "missing params" }, { status: 400 });

  const { data, error } = await supabase.from("availability_blocks").upsert(
    { apartment_id, date, status: status ?? "blocked", note: note ?? null, source: "manual" },
    { onConflict: "apartment_id,date" }
  ).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apartment_id = searchParams.get("apartment_id");
  const date = searchParams.get("date");
  if (!apartment_id || !date) return NextResponse.json({ error: "missing params" }, { status: 400 });

  await supabase.from("availability_blocks").delete().eq("apartment_id", apartment_id).eq("date", date);
  return NextResponse.json({ ok: true });
}
