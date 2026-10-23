import { getEffectivePrice, matchingWeek, stayBreakdown, type PricingRule } from "@/lib/pricing";
import type { Apartment } from "@/types";
import { SEASON_END, SEASON_START } from "./config";
import { addDays, isoOf } from "./format";

/*
 * Every price on the English and French pages comes from here, and here only
 * from lib/pricing.ts, exactly like the Hebrew apartment page:
 *  - agency apartments (source "la_cime"): the week of available_weeks that
 *    holds the dates (matchingWeek), always the whole week's price;
 *  - our own apartments: stayBreakdown (nights + cleaning, the Airbnb calendar
 *    when it covers the stay, else the site's rules).
 * Used by the server pages and by the client booking card alike.
 */

export type PriceApt = Pick<Apartment, "id" | "source" | "price_per_night" | "available_weeks">;
export type Week = { week: string; price: number };

export const isAgencyApt = (a: { source?: string | null }) => a.source === "la_cime";

export type Quote =
  | {
      kind: "nights";
      checkin: string; checkout: string; nights: number;
      nightly: { date: string; price: number }[];
      fee: number;     // cleaning, once per stay (0 for site-priced stays)
      total: number;
      avg: number;     // per night without the cleaning, as the Hebrew page shows it
      airbnb: boolean;
    }
  | { kind: "week"; checkin: string; checkout: string; nights: number; total: number; snapped: boolean }
  | { kind: "noWeek" };

/** The price of a stay, or null without valid dates. */
export function quoteFor(apt: PriceApt, rules: PricingRule[], checkin: string, checkout: string, todayIso: string): Quote | null {
  if (!checkin || !checkout || checkout <= checkin) return null;
  if (isAgencyApt(apt)) {
    // matchingWeek only reads source and available_weeks
    const w = matchingWeek(apt as Apartment, checkin, checkout);
    // a week already under way can't be booked any more
    if (!w || w.week < todayIso || !(Number(w.price) > 0)) return { kind: "noWeek" };
    const end = addDays(w.week, 7);
    return { kind: "week", checkin: w.week, checkout: end, nights: 7, total: w.price, snapped: w.week !== checkin || end !== checkout };
  }
  const b = stayBreakdown(checkin, checkout, apt.price_per_night, rules);
  const nightly = b.nights.map(n => ({ date: isoOf(n.date), price: n.price }));
  const nights = nightly.length;
  return {
    kind: "nights", checkin, checkout, nights, nightly, fee: b.fee, total: b.total,
    avg: nights ? Math.round((b.total - b.fee) / nights) : 0, airbnb: b.source === "airbnb",
  };
}

/** The free weeks still ahead in the season (see SEASON_END in config.ts), earliest first. */
export function upcomingWeeks(apt: Pick<Apartment, "available_weeks">, todayIso: string): Week[] {
  return (apt.available_weeks ?? [])
    .filter(w => w && typeof w.week === "string" && w.week >= todayIso && addDays(w.week, 7) <= SEASON_END && Number(w.price) > 0)
    .map(w => ({ week: w.week, price: Number(w.price) }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

/** Agency apartments: the cheapest free week ahead. */
export function fromWeek(apt: Pick<Apartment, "available_weeks">, todayIso: string): number | null {
  const ws = upcomingWeeks(apt, todayIso);
  return ws.length ? Math.min(...ws.map(w => w.price)) : null;
}

/**
 * Our own apartments: the lowest night price (getEffectivePrice, the same
 * per-night price the stay is built from) over the rest of the season.
 */
export function fromNight(apt: Pick<Apartment, "price_per_night">, rules: PricingRule[], todayIso: string): number | null {
  const start = todayIso > SEASON_START ? todayIso : SEASON_START;
  let min = Infinity;
  for (let d = start; d < SEASON_END; d = addDays(d, 1)) {
    const p = getEffectivePrice(new Date(d + "T12:00:00"), apt.price_per_night, rules);
    if (p > 0 && p < min) min = p;
  }
  return Number.isFinite(min) ? min : null;
}
