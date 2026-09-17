import type { SkiPass } from "@/types";

// Flat per-person add-ons used to fold a "full deal" price together
// wherever La Cime (שבת עד שבת) packages are shown without a real
// customer-picked date/quote flow — matches the numbers used elsewhere
// on the site (transfer add-on, business-set flight estimate).
export const TRANSFER_PRICE = 180;
export const FLIGHT_ESTIMATE = 350;
export const LA_CIME_NIGHTS = 7; // every La Cime week is a fixed Saturday-to-Saturday stay

// Real Trois Vallées ski-pass price for a full La Cime week (6 ski days),
// sourced from the same ski_passes table/pricing used on the apartment
// page — never invented. Returns 0 if no matching tier exists.
export function skiPassPerPersonForWeek(passOptions: SkiPass[] | null | undefined): number {
  const skiDays = LA_CIME_NIGHTS - 1;
  const passes = passOptions ?? [];
  const skiTier = passes.length ? (passes.find(p => p.duration_days >= skiDays) ?? passes[passes.length - 1]) : null;
  if (!skiTier) return 0;
  return skiDays > skiTier.duration_days ? Math.round((skiTier.price / skiTier.duration_days) * skiDays) : skiTier.price;
}
