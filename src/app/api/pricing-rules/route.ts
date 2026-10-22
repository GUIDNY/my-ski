import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getAirbnbCalendar } from "@/lib/airbnb-calendar";
import { airbnbRules } from "@/lib/airbnb-rules";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apartment_id = searchParams.get("apartment_id");
  if (!apartment_id) return NextResponse.json({ error: "missing apartment_id" }, { status: 400 });

  const [{ data, error }, cal] = await Promise.all([
    supabase.from("pricing_rules").select("*").eq("apartment_id", apartment_id).order("priority", { ascending: false }),
    // ?source=db: only the rules stored in the database (no Airbnb calendar)
    searchParams.get("source") === "db" ? Promise.resolve(null) : getAirbnbCalendar(),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Our own apartments: the Airbnb calendar (net of commission) as rules, so
  // every page prices the stay like the bots do (lib/airbnb-calendar.ts)
  const airbnb = airbnbRules(cal, apartment_id).map(r => ({ ...r, apartment_id }));
  return NextResponse.json([...airbnb, ...(data ?? [])]);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase.from("pricing_rules").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  if (id.startsWith("airbnb:")) return NextResponse.json({ error: "Airbnb prices update automatically" }, { status: 400 });
  await supabase.from("pricing_rules").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
