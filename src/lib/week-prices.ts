/*
 * The cheapest open agency apartment of every Saturday ahead, for the price
 * table in the "when to go" guide. The guide pages are built once per deploy
 * (a guide address is Hebrew, and a page with a Hebrew address can't be
 * rebuilt on the server: the cache header Vercel sets from it is rejected,
 * and search engines got an error), so the page carries the prices of its
 * build and the browser refreshes them from /api/week-prices.
 */

/** a Saturday, the cheapest open apartment that week, and how many are open */
export type WeekMin = [week: string, price: number, open: number];
export type WeekPrices = { asOf: string; weeks: WeekMin[] };

type Row = { available_weeks: { week: string; price: number }[] | null };

export function weekMins(rows: Row[], todayISO: string): WeekMin[] {
  const mins = new Map<string, { price: number; open: number }>();
  for (const a of rows)
    for (const w of a.available_weeks ?? []) {
      if (!(w.week >= todayISO && w.price > 0)) continue;
      const m = mins.get(w.week);
      mins.set(w.week, m ? { price: Math.min(m.price, w.price), open: m.open + 1 } : { price: w.price, open: 1 });
    }
  return [...mins.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([w, m]) => [w, Math.round(m.price), m.open]);
}
