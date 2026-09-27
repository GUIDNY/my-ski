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
  type: string;        // "date_range" | "month" | "weekday"
  price_type: string;  // "absolute" | "add" | "subtract"
  start_date?: string;
  end_date?: string;
  months?: number[];
  weekdays?: number[];
  price: number;
  priority: number;
};

export function getEffectivePrice(date: Date, basePrice: number, rules: PricingRule[]): number {
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
  let price = absoluteRule ? absoluteRule.price : basePrice;

  for (const r of sorted) {
    if (!matches(r)) continue;
    if ((r.price_type ?? "absolute") === "add")      price += r.price;
    if ((r.price_type ?? "absolute") === "subtract") price -= r.price;
  }

  return Math.max(0, price);
}

export function calcTotalForRange(checkin: string, checkout: string, basePrice: number, rules: PricingRule[]): number {
  let total = 0;
  const start = new Date(checkin + "T12:00:00");
  const end   = new Date(checkout + "T12:00:00");
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1))
    total += getEffectivePrice(new Date(d), basePrice, rules);
  return total;
}
