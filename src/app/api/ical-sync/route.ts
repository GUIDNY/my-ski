import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseIcal(text: string): { start: string; end: string; summary: string }[] {
  const events: { start: string; end: string; summary: string }[] = [];
  const blocks = text.split("BEGIN:VEVENT");
  for (const block of blocks.slice(1)) {
    const getVal = (key: string) => {
      const m = block.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
      return m ? m[1].trim() : "";
    };
    const dtstart = getVal("DTSTART");
    const dtend   = getVal("DTEND");
    const summary = getVal("SUMMARY");
    if (dtstart && dtend) {
      const fmt = (s: string) => s.length === 8
        ? `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`
        : s.slice(0,10);
      events.push({ start: fmt(dtstart), end: fmt(dtend), summary });
    }
  }
  return events;
}

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

    let totalBlocked = 0;
    for (const src of sources) {
      try {
        const res  = await fetch(src.ical_url, { signal: AbortSignal.timeout(8000) });
        const text = await res.text();
        const events = parseIcal(text);

        for (const ev of events) {
          const start = new Date(ev.start);
          const end   = new Date(ev.end);
          for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split("T")[0];
            await supabase.from("availability_blocks").upsert(
              { apartment_id: body.apartment_id, date: dateStr, status: "booked_external", source: src.platform, note: ev.summary },
              { onConflict: "apartment_id,date" }
            );
            totalBlocked++;
          }
        }

        await supabase.from("ical_sources").update({ last_synced: new Date().toISOString() }).eq("id", src.id);
      } catch { /* skip source on error */ }
    }
    return NextResponse.json({ synced: totalBlocked });
  }

  if (body.action === "delete_source") {
    await supabase.from("ical_sources").delete().eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
