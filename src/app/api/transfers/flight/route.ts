import { NextRequest, NextResponse } from "next/server";
import { lookupFlight } from "@/lib/winteride";

/* A flight's time for the transfers form (read-only): GET ?flight_no&date&direction&airport_code.
   Answers { found, time } in Europe/Paris time, or { found: false }. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const flight_no = (sp.get("flight_no") || "").toUpperCase().replace(/\s+/g, "");
  const date = sp.get("date") || "";
  const direction = sp.get("direction") === "departure" ? "departure" : "arrival";
  const airport_code = sp.get("airport_code") === "LYS" ? "LYS" : "GVA";
  if (!/^[A-Z0-9]{2}\d{1,4}$/.test(flight_no) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ found: false });
  try {
    const r = await lookupFlight({ flight_no, date, direction, airport_code });
    // the schema isn't documented: take the first HH:MM-looking time it gives
    const f = (r.flight ?? r) as Record<string, unknown>;
    const raw = [f.time, f.scheduled_time, f.arrival_time, f.departure_time, f.scheduled].find(v => typeof v === "string") as string | undefined;
    const time = raw?.match(/(\d{2}):(\d{2})/)?.[0] ?? null;
    const found = f.found !== false && !!time;
    return NextResponse.json({ found, time: found ? time : null }, { headers: { "Cache-Control": "public, s-maxage=3600" } });
  } catch {
    return NextResponse.json({ found: false });
  }
}
