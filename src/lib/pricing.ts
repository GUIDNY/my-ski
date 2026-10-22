import type { Apartment } from "@/types";

/**
 * La Cime ("שבת עד שבת") apartments are only actually available in fixed
 * Saturday-to-Saturday blocks — real cost to us is per full week, not per
 * night. A stay can fall anywhere inside one of those weeks (it doesn't have
 * to start/end on the Saturdays), but it can't span across two different
 * weeks, and it's always charged the full week's price regardless of how
 * many of its nights are actually used.
 */
export function matchingWeek(apt: Apartment, checkin: string, checkout: string) {
  if (apt.source !== "la_cime" || !apt.available_weeks?.length || !checkin || !checkout) return null;
  const ci = new Date(checkin + "T12:00:00");
  const co = new Date(checkout + "T12:00:00");
  if (!(co > ci)) return null;
  return apt.available_weeks.find(w => {
    const start = new Date(w.week + "T12:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return ci >= start && co <= end;
  }) ?? null;
}

/**
 * A stay of N nights only yields N-1 actual ski days (arrival/departure days
 * aren't spent on the slopes), so ski pass tiers and equipment rental should
 * be priced off this, not the raw night count.
 */
export function skiDaysFromNights(nights: number): number {
  return Math.max(nights - 1, 0);
}

/**
 * Ski/snowboard equipment rental: €30/day, or €120 for a full week (6 ski
 * days) plus €20/day beyond that. The day rate is capped at the week rate —
 * without the cap, 5 days (30*5=150) priced out higher than a full 6-day
 * week (120), which is backwards: fewer days should never cost more.
 */
export function equipCost(days: number): number {
  if (days <= 0) return 0;
  if (days <= 6) return Math.min(30 * days, 120);
  return 120 + 20 * (days - 6);
}

export type PricingRule = {
  id: string;
  label: string;
  type: string;        // "date_range" | "month" | "weekday" | "stay_fee" (once per stay, Airbnb cleaning)
  price_type: string;  // "absolute" | "add" | "subtract"
  start_date?: string;
  end_date?: string;
  months?: number[];
  weekdays?: number[];
  price: number;
  priority: number;
  // "airbnb": not a database row but generated from the apartment's Airbnb
  // calendar, already net of the host commission (lib/airbnb-calendar.ts)
  source?: string;
};

export const AIRBNB_SOURCE = "airbnb";
const isAirbnb = (r: PricingRule) => r.source === AIRBNB_SOURCE;

// December is peak season — regardless of base price or any discount rules
// stacked on top, no apartment should ever show below this per night.
const DECEMBER_MIN_NIGHTLY_PRICE = 90;

/**
 * One night's price, unrounded. A night covered by the apartment's Airbnb
 * calendar is what the bots charge for it (Airbnb price minus the
 * commission), with no December floor; only site rules ranked above the
 * Airbnb calendar (priority over 50) still replace or adjust it.
 */
function nightPrice(date: Date, basePrice: number, rules: PricingRule[]): { price: number; airbnb: boolean } {
  const sorted  = [...rules].sort((a, b) => b.priority - a.priority);
  const iso     = date.toISOString().split("T")[0];
  const wd      = date.getDay();
  const mo      = date.getMonth();

  const matches = (r: PricingRule) =>
    (r.type === "date_range" && !!r.start_date && !!r.end_date && iso >= r.start_date && iso <= r.end_date
      && (!r.weekdays || r.weekdays.length === 0 || r.weekdays.includes(wd))) ||
    (r.type === "month"      && !!r.months?.includes(mo)) ||
    (r.type === "weekday"    && !!r.weekdays?.includes(wd));

  /* Highest-priority absolute rule sets the base; then all delta rules stack */
  const absoluteRule = sorted.find(r => matches(r) && (r.price_type ?? "absolute") === "absolute");
  const airbnb = !!absoluteRule && isAirbnb(absoluteRule);
  let price = absoluteRule ? absoluteRule.price : basePrice;

  for (const r of sorted) {
    if (!matches(r) || isAirbnb(r)) continue;
    if (airbnb && r.priority <= absoluteRule!.priority) continue;
    if ((r.price_type ?? "absolute") === "add")      price += r.price;
    if ((r.price_type ?? "absolute") === "subtract") price -= r.price;
  }

  price = Math.max(0, price);
  if (!airbnb && mo === 11) price = Math.max(price, DECEMBER_MIN_NIGHTLY_PRICE);
  return { price, airbnb };
}

/** The price shown for one night (an Airbnb-priced night is rounded to whole euros). */
export function getEffectivePrice(date: Date, basePrice: number, rules: PricingRule[]): number {
  const n = nightPrice(date, basePrice, rules);
  return n.airbnb ? Math.round(n.price) : n.price;
}

export type StayBreakdown = {
  nights: { date: Date; price: number }[];
  fee: number;               // Airbnb cleaning, once per stay (0 for site-priced stays)
  total: number;
  source: "airbnb" | "site";
};

/**
 * Price of a whole stay, the same way the bots price it: when the Airbnb
 * calendar has a price for every night, (Airbnb nights + cleaning) minus the
 * commission, rounded once; otherwise the site's own rules for every night.
 * A night replaced by a site rule ranked above the calendar (a special price)
 * takes that price and the rest of the stay stays on the calendar.
 * The shown nights are rounded, and the cleaning line absorbs the rounding so
 * nights + cleaning always add up to the total.
 */
export function stayBreakdown(checkin: string, checkout: string, basePrice: number, rules: PricingRule[]): StayBreakdown {
  const dates: Date[] = [];
  if (checkin && checkout) {
    const end = new Date(checkout + "T12:00:00");
    for (let d = new Date(checkin + "T12:00:00"); d < end; d.setDate(d.getDate() + 1)) dates.push(new Date(d));
  }
  const calendar = rules.filter(isAirbnb);
  const onCalendar = dates.length > 0 && calendar.length > 0
    && dates.every(d => nightPrice(d, basePrice, calendar).airbnb);
  if (onCalendar) {
    const priced = dates.map(d => nightPrice(d, basePrice, rules));
    const feeRule = calendar.find(r => r.type === "stay_fee");
    const nights = dates.map((date, i) => ({ date, price: Math.round(priced[i].price) }));
    const shown = nights.reduce((s, n) => s + n.price, 0);
    if (!feeRule) return { nights, fee: 0, total: shown, source: "airbnb" };
    const total = Math.round(priced.reduce((s, p) => s + p.price, 0) + feeRule.price);
    return { nights, fee: total - shown, total, source: "airbnb" };
  }
  const siteRules = rules.filter(r => !isAirbnb(r));
  const nights = dates.map(date => ({ date, price: nightPrice(date, basePrice, siteRules).price }));
  return { nights, fee: 0, total: nights.reduce((s, n) => s + n.price, 0), source: "site" };
}

export function calcTotalForRange(checkin: string, checkout: string, basePrice: number, rules: PricingRule[]): number {
  return stayBreakdown(checkin, checkout, basePrice, rules).total;
}
