import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { syncApartmentIcal } from "@/lib/ical-sync";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apartment_id = searchParams.get("apartment_id");
  if (!apartment_id) return NextResponse.json({ error: "missing apartment_id" }, { status: 400 });

  const { data: sources } = await supabase.from("ical_sources").select("*").eq("apartment_id", apartment_id);
  return NextResponse.json(sources ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "add_source") {
    const { data, error } = await supabase.from("ical_sources").insert({
      apartment_id: body.apartment_id,
      platform: body.platform,
      ical_url: body.ical_url,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (body.action === "sync") {
    const { data: sources } = await supabase.from("ical_sources").select("*").eq("apartment_id", body.apartment_id);
    if (!sources?.length) return NextResponse.json({ synced: 0 });
    const totalBlocked = await syncApartmentIcal(supabase, body.apartment_id, sources);
    return NextResponse.json({ synced: totalBlocked });
  }

  if (body.action === "delete_source") {
    await supabase.from("ical_sources").delete().eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
