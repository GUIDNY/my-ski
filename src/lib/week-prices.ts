/*
 * The cheapest open agency apartment of every Saturday ahead, for the price
 * table in the "when to go" guide. The guide pages are built once per deploy
 * (a guide address is Hebrew, and a page with a Hebrew address can't be
 * rebuilt on the server: the cache header Vercel sets from it is rejected,
 * and search engines got an error), so the page carries the prices of its
 * build and the browser refreshes them from /api/week-prices.
 */

export type WeekMin = [week: string, price: number];
export type WeekPrices = { asOf: string; weeks: WeekMin[] };

type Row = { available_weeks: { week: string; price: number }[] | null };

export function weekMins(rows: Row[], todayISO: string): WeekMin[] {
  const mins = new Map<string, number>();
  for (const a of rows)
    for (const w of a.available_weeks ?? [])
      if (w.week >= todayISO && w.price > 0) mins.set(w.week, Math.min(mins.get(w.week) ?? Infinity, w.price));
  return [...mins.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([w, p]) => [w, Math.round(p)]);
}
