import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Export our own occupied dates as an .ics feed, so Airbnb/Booking.com can
// import it (their side: listing → calendar → sync calendars → import) and
// stay in sync with bookings taken on our own site. Only exports dates that
// originated here (real bookings, manual admin blocks, paid orders) — never
// re-exports blocks that came FROM an external ical sync, to avoid an
// external platform importing back its own data.

function toIcsDate(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// Collapse a sorted list of individual dates into contiguous [start, end) ranges.
function groupConsecutiveDates(dates: string[]): { start: string; end: string }[] {
  const ranges: { start: string; end: string }[] = [];
  for (const d of dates) {
    const last = ranges[ranges.length - 1];
    const prevDay = new Date(d + "T12:00:00");
    prevDay.setDate(prevDay.getDate() - 1);
    const prevDayStr = prevDay.toISOString().slice(0, 10);
    if (last && last.end === prevDayStr) {
      const next = new Date(d + "T12:00:00");
      next.setDate(next.getDate() + 1);
      last.end = next.toISOString().slice(0, 10);
    } else {
      const next = new Date(d + "T12:00:00");
      next.setDate(next.getDate() + 1);
      ranges.push({ start: d, end: next.toISOString().slice(0, 10) });
    }
  }
  return ranges;
}

export async function GET(req: NextRequest) {
  const apartment_id = req.nextUrl.searchParams.get("apartment_id");
  if (!apartment_id) return NextResponse.json({ error: "missing apartment_id" }, { status: 400 });

  const [{ data: bookings }, { data: blocks }] = await Promise.all([
    supabase.from("bookings").select("check_in,check_out,status").eq("apartment_id", apartment_id).neq("status", "cancelled"),
    supabase.from("availability_blocks").select("date").eq("apartment_id", apartment_id).in("source", ["manual", "order"]),
  ]);

  const events: { start: string; end: string; summary: string }[] = [];
  for (const b of bookings ?? []) {
    if (b.check_in && b.check_out) events.push({ start: b.check_in, end: b.check_out, summary: "Booked — SkiShare" });
  }
  const blockedDates = (blocks ?? []).map(b => b.date).sort();
  for (const r of groupConsecutiveDates(blockedDates)) {
    events.push({ start: r.start, end: r.end, summary: "Blocked — SkiShare" });
  }

  const now = toIcsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SkiShare//Availability Export//EN",
    "CALSCALE:GREGORIAN",
    ...events.flatMap((e, i) => [
      "BEGIN:VEVENT",
      `UID:skishare-${apartment_id}-${i}-${e.start}@skisharebook.com`,
      `DTSTAMP:${now}T000000Z`,
      `DTSTART;VALUE=DATE:${e.start.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${e.end.replace(/-/g, "")}`,
      `SUMMARY:${e.summary}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="skishare-${apartment_id}.ics"`,
      "Cache-Control": "public, max-age=1800",
    },
  });
}
