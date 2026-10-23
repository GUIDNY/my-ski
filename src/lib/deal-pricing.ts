import type { SkiPass } from "@/types";
import { skiDaysFromNights } from "@/lib/pricing";

// Flat per-person add-ons, the same numbers the apartment page charges.
export const TRANSFER_PRICE = 180;
export const BAGGAGE_PRICE = 120; // one checked bag, there and back, per traveler
export const LA_CIME_NIGHTS = 7; // every La Cime week is a fixed Saturday-to-Saturday stay

export type PassArea = "val_thorens" | "trois_vallees";
export const PASS_AREA_LABEL: Record<PassArea, string> = { val_thorens: "ואל טורנס", trois_vallees: "שלושת העמקים" };

// Lift dates for the 2026/27 season (the same dates as the guides): Val
// Thorens on its own opens first and closes last, the whole 3 Vallées area
// runs in between.
export const LIFT_DATES: Record<PassArea, [string, string]> = {
  val_thorens: ["2026-11-21", "2027-05-02"],
  trois_vallees: ["2026-12-05", "2027-04-18"],
};

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** "5.12" from "2026-12-05" */
export const shortDate = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}`; };

/**
 * Whether an area's lifts are open on every ski day of a stay (the days
 * between arrival and departure). With no dates yet there is nothing to
 * check, so it says yes.
 */
export function liftsOpenForStay(area: PassArea, checkin: string, checkout: string): boolean {
  if (!checkin || !checkout) return true;
  const first = addDays(checkin, 1), last = addDays(checkout, -1);
  if (last < first) return false;
  const [open, close] = LIFT_DATES[area];
  return first >= open && last <= close;
}

/** The pass a package uses for these dates: all of 3 Vallées when it is open, else Val Thorens alone, else none. */
export function packagePassArea(checkin: string, checkout: string): PassArea | null {
  if (liftsOpenForStay("trois_vallees", checkin, checkout)) return "trois_vallees";
  if (liftsOpenForStay("val_thorens", checkin, checkout)) return "val_thorens";
  return null;
}

/**
 * The adult pass the apartment page sells for `skiDays` in an area: the
 * shortest tier that covers the days, else the longest one. Real prices from
 * the ski_passes table, never made up; null when there is no such tier.
 */
export function passTier(passes: SkiPass[] | null | undefined, area: PassArea, skiDays: number): SkiPass | null {
  const options = (passes ?? []).filter(p => p.area === area && p.type === "adult").sort((a, b) => a.duration_days - b.duration_days);
  if (!options.length || skiDays < 1) return null;
  return options.find(p => p.duration_days >= skiDays) ?? options[options.length - 1];
}

/**
 * What a "full deal" adds per person on top of the apartment, for a stay:
 * the ski pass that fits the dates and the transfer. The flight is not in
 * here: it only exists when there is a real direct flight, at its live price.
 */
export function packageExtras(passes: SkiPass[] | null | undefined, checkin: string, checkout: string, nights: number) {
  const area = packagePassArea(checkin, checkout);
  const tier = area ? passTier(passes, area, skiDaysFromNights(nights)) : null;
  const pass = tier?.price ?? 0;
  return { area, tier, pass, transfer: TRANSFER_PRICE, perPerson: pass + TRANSFER_PRICE };
}

/** The full-deal extras for one La Cime week (Saturday to Saturday). */
export function weekPackageExtras(passes: SkiPass[] | null | undefined, weekIso: string) {
  return packageExtras(passes, weekIso, addDays(weekIso, LA_CIME_NIGHTS), LA_CIME_NIGHTS);
}

/** Old name kept for the homepage packages: the 3 Vallées pass for a full week. */
export function skiPassPerPersonForWeek(passOptions: SkiPass[] | null | undefined): number {
  return passTier(passOptions, "trois_vallees", LA_CIME_NIGHTS - 1)?.price ?? 0;
}
