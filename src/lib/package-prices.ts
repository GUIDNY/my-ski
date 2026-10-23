import type { Apartment, SkiPass } from "@/types";
import { weekPackageExtras, type PassArea } from "@/lib/deal-pricing";

/*
 * The "full deal" of every Saturday ahead, per person: the cheapest open
 * agency apartment that fits the group, split between them, plus the ski
 * pass that fits the week and the airport transfer. The same numbers as
 * "דיל שלם" on /weekly for that week and group (agency weeks only: our own
 * apartments are priced by the night and shown on /apartments).
 */

export const PACKAGE_GROUPS = [2, 4, 6] as const;
export type PackageGroup = (typeof PACKAGE_GROUPS)[number];

export type PackageWeek = {
  week: string;
  area: PassArea;
  passDays: number;
  /** per person for each group size; null when no open apartment fits */
  perPerson: Record<PackageGroup, number | null>;
};

type Apt = Pick<Apartment, "max_guests" | "available_weeks">;

export function packageWeeks(apartments: Apt[], passes: SkiPass[], todayISO: string): PackageWeek[] {
  const weeks = new Set<string>();
  for (const a of apartments) for (const w of a.available_weeks ?? []) if (w.week >= todayISO && w.price > 0) weeks.add(w.week);
  const out: PackageWeek[] = [];
  for (const week of [...weeks].sort()) {
    const ex = weekPackageExtras(passes, week);
    // a ski package needs a pass: weeks when no lifts are open (or no pass is on sale) aren't one
    if (!ex.area || !ex.tier) continue;
    const perPerson = {} as Record<PackageGroup, number | null>;
    for (const n of PACKAGE_GROUPS) {
      let best: number | null = null;
      for (const a of apartments) {
        if ((a.max_guests ?? 0) < n) continue;
        const w = (a.available_weeks ?? []).find(x => x.week === week && x.price > 0);
        if (!w) continue;
        const pp = Math.round(w.price / n + ex.perPerson);
        if (best === null || pp < best) best = pp;
      }
      perPerson[n] = best;
    }
    if (PACKAGE_GROUPS.some(n => perPerson[n] !== null)) out.push({ week, area: ex.area, passDays: ex.tier.duration_days, perPerson });
  }
  return out;
}
