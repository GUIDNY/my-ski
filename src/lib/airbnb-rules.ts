import type { PricingRule } from "./pricing";

/**
 * Pure helpers for the Airbnb calendar (no Next.js or network here, so they
 * can be unit-tested): validate what n8n sends, and turn it into pricing
 * rules and closed nights. Fetching and caching live in airbnb-calendar.ts.
 */

// same value as AIRBNB_SOURCE in pricing.ts
const AIRBNB = "airbnb";

export type AirbnbListingCalendar = {
  apartmentId: string;
  listingId: string;
  cleaning: number;   // the listing's cleaning fee on Airbnb (before commission)
  prices: number[];   // Airbnb nightly price for start + i days (0 = no price)
  closed: number[];   // day indexes that are booked or blocked on Airbnb
};

export type AirbnbCalendar = {
  start: string;      // YYYY-MM-DD, day 0
  days: number;
  commission: number; // e.g. 0.155
  generatedAt: string;
  listings: AirbnbListingCalendar[];
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isoPlus(start: string, days: number): string {
  const [y, m, d] = start.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function dayIndex(start: string, iso: string): number {
  return Math.round((Date.parse(iso + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) / 864e5);
}

/** Throws on anything that doesn't look like the calendar, so a bad answer is never cached. */
export function parseAirbnbCalendar(j: unknown): AirbnbCalendar {
  const o = j as Record<string, unknown> | null;
  if (!o || o.ok !== true || typeof o.start !== "string" || !ISO.test(o.start)) throw new Error("airbnb calendar: bad header");
  const days = Number(o.days);
  const commission = Number(o.commission);
  if (!Number.isInteger(days) || days < 1 || days > 800) throw new Error("airbnb calendar: bad days");
  if (!(commission >= 0 && commission < 0.5)) throw new Error("airbnb calendar: bad commission");
  if (!Array.isArray(o.listings) || o.listings.length === 0) throw new Error("airbnb calendar: no listings");
  const listings: AirbnbListingCalendar[] = o.listings.map((raw: unknown) => {
    const l = raw as Record<string, unknown>;
    const prices = Array.isArray(l.prices) ? l.prices.map(Number) : [];
    const cleaning = Number(l.cleaning);
    if (typeof l.apartmentId !== "string" || !UUID.test(l.apartmentId)) throw new Error("airbnb calendar: bad apartment");
    if (prices.length !== days || prices.some(p => !Number.isFinite(p) || p < 0)) throw new Error("airbnb calendar: bad prices");
    if (!(cleaning >= 0 && cleaning < 1000)) throw new Error("airbnb calendar: bad cleaning");
    const closed = Array.isArray(l.closed) ? l.closed.map(Number).filter(i => Number.isInteger(i) && i >= 0 && i < days) : [];
    return { apartmentId: l.apartmentId, listingId: String(l.listingId ?? ""), cleaning, prices, closed };
  });
  return { start: o.start, days, commission, generatedAt: String(o.generatedAt ?? ""), listings };
}

/**
 * The apartment's Airbnb calendar as pricing rules: one absolute rule per run
 * of nights with the same price (net of commission, unrounded, priority 50)
 * plus its cleaning fee as a once-per-stay rule. Empty for apartments that
 * aren't on Airbnb.
 */
export function airbnbRules(cal: AirbnbCalendar | null, apartmentId: string): PricingRule[] {
  const l = cal?.listings.find(x => x.apartmentId === apartmentId);
  if (!cal || !l) return [];
  const keep = 1 - cal.commission;
  const rules: PricingRule[] = [];
  let i = 0;
  while (i < l.prices.length) {
    const p = l.prices[i];
    if (!(p > 0)) { i++; continue; }
    let j = i;
    while (j + 1 < l.prices.length && l.prices[j + 1] === p) j++;
    const start = isoPlus(cal.start, i);
    rules.push({
      id: `airbnb:${apartmentId}:${start}`, label: "Airbnb (אוטומטי)", type: "date_range", price_type: "absolute",
      start_date: start, end_date: isoPlus(cal.start, j), price: p * keep, priority: 50, source: AIRBNB,
    });
    i = j + 1;
  }
  if (rules.length) {
    rules.push({
      id: `airbnb:${apartmentId}:cleaning`, label: "ניקיון (Airbnb)", type: "stay_fee", price_type: "absolute",
      price: l.cleaning * keep, priority: 50, source: AIRBNB,
    });
  }
  return rules;
}

/** Apartments with a night in checkin..checkout-1 that is booked or blocked on Airbnb. */
export function airbnbClosedApartments(cal: AirbnbCalendar | null, checkin: string, checkout: string): string[] {
  if (!cal || !ISO.test(checkin) || !ISO.test(checkout)) return [];
  const from = dayIndex(cal.start, checkin), to = dayIndex(cal.start, checkout);
  return cal.listings.filter(l => l.closed.some(i => i >= from && i < to)).map(l => l.apartmentId);
}
