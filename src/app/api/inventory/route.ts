import { createServerClient } from "@/lib/supabase-server";
import { matchingWeek, stayBreakdown } from "@/lib/pricing";
import { rulesWithAirbnb } from "@/lib/airbnb-calendar";
import { takenApartmentIds } from "@/lib/inventory";
import type { Apartment } from "@/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/inventory?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD
 *
 * Read-only: the apartments that are free for the whole stay, exactly as
 * /search sees them (same takenApartmentIds rule), so the n8n quote bots can
 * price a stay without holding a database key of their own.
 *   - regular: our own apartments, with the site's total for the stay: Airbnb
 *     nights + cleaning minus commission where the Airbnb calendar covers the
 *     stay (price_source "airbnb"), otherwise the seasonal rules ("site")
 *   - la_cime: agency units whose fixed Saturday-to-Saturday week covers the stay,
 *     with that week's price (already includes our markup)
 * Only listing data that is public on the site anyway — no customer data.
 */

const APT_FIELDS = "id,name,price_per_night,max_guests,beds,baths,sqm,description,amenities,images,source,available_weeks";
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NIGHTS = 60;

function validDate(s: string | null): s is string {
  if (!s || !ISO.test(s)) return false;
  const d = new Date(s + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export async function GET(req: NextRequest) {
  const checkin = req.nextUrl.searchParams.get("checkin");
  const checkout = req.nextUrl.searchParams.get("checkout");
  if (!validDate(checkin) || !validDate(checkout)) {
    return NextResponse.json({ error: "checkin and checkout must be YYYY-MM-DD" }, { status: 400 });
  }
  const nights = Math.round((Date.parse(checkout + "T12:00:00Z") - Date.parse(checkin + "T12:00:00Z")) / 864e5);
  if (nights < 1 || nights > MAX_NIGHTS) {
    return NextResponse.json({ error: `stay must be 1-${MAX_NIGHTS} nights` }, { status: 400 });
  }

  const db = createServerClient();
  const [{ data: apts, error }, taken] = await Promise.all([
    db.from("apartments").select(APT_FIELDS).eq("available", true),
    takenApartmentIds(db, checkin, checkout),
  ]);
  // Never answer "free" when we couldn't actually check.
  if (error || !apts || taken === null) {
    return NextResponse.json({ error: "availability check failed" }, { status: 503 });
  }

  const free = (apts as Apartment[]).filter(a => !taken.has(a.id));
  const regularApts = free.filter(a => a.source !== "la_cime");

  const rulesByApt = await rulesWithAirbnb(db, regularApts.map(a => a.id));
  if (!rulesByApt) return NextResponse.json({ error: "pricing check failed" }, { status: 503 });

  const pick = (a: Apartment) => ({
    id: a.id, name: a.name, max_guests: a.max_guests ?? null, beds: a.beds, baths: a.baths, sqm: a.sqm,
    description: a.description, amenities: a.amenities ?? [], images: a.images ?? [],
    price_per_night: Number(a.price_per_night) || 0,
  });

  const regular = regularApts.map(a => {
    const stay = stayBreakdown(checkin, checkout, Number(a.price_per_night) || 0, rulesByApt.get(a.id) ?? []);
    return { ...pick(a), site_total: Math.round(stay.total), price_source: stay.source };
  });

  const la_cime = free
    .filter(a => a.source === "la_cime")
    .map(a => {
      const w = matchingWeek(a, checkin, checkout);
      return w ? { ...pick(a), week: w.week, total: Math.round(Number(w.price) || 0) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null && x.total > 0);

  return NextResponse.json(
    { checkin, checkout, nights, regular, la_cime },
    { headers: { "Cache-Control": "no-store" } },
  );
}
