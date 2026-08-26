import type { SupabaseClient } from "@supabase/supabase-js";

export function parseIcal(text: string): { start: string; end: string; summary: string }[] {
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

type IcalSource = { id: string; apartment_id: string; platform: string; ical_url: string };

// Pulls every source's feed fresh, replacing (not just adding to) that
// source's previously-synced blocks so dates freed upstream actually clear.
export async function syncApartmentIcal(db: SupabaseClient, apartment_id: string, sources: IcalSource[]): Promise<number> {
  let totalBlocked = 0;
  for (const src of sources) {
    try {
      const res  = await fetch(src.ical_url, { signal: AbortSignal.timeout(8000) });
      const text = await res.text();
      const events = parseIcal(text);

      await db.from("availability_blocks").delete()
        .eq("apartment_id", apartment_id).eq("source", src.platform);

      const rows: { apartment_id: string; date: string; status: string; source: string; note: string }[] = [];
      for (const ev of events) {
        const start = new Date(ev.start);
        const end   = new Date(ev.end);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          rows.push({ apartment_id, date: d.toISOString().split("T")[0], status: "booked_external", source: src.platform, note: ev.summary });
        }
      }
      // One bulk upsert instead of one round-trip per date — a source with a
      // year-long blocked range used to mean hundreds of sequential queries.
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        await db.from("availability_blocks").upsert(chunk, { onConflict: "apartment_id,date" });
        totalBlocked += chunk.length;
      }

      await db.from("ical_sources").update({ last_synced: new Date().toISOString() }).eq("id", src.id);
    } catch { /* skip source on error */ }
  }
  return totalBlocked;
}
