/*
 * Shared profit math for the admin-only badges (proposals + site quotes).
 * Agency apartments (la_cime/VTI) are sold at cost × 1.32; our own seasonal
 * apartments cost per night what the signed 2026-27 contracts say.
 */
export const AGENCY_MARKUP = 1.32;

// €/night from the signed season contracts (rent ÷ usable nights)
export const OWN_COST_NIGHT: [RegExp, number][] = [
  [/נבס 93|neves 93/i, 123], [/נבס 163|neves 163/i, 123], [/נבס 154|neves 154/i, 114],
  [/נבס 148|neves 148/i, 85], [/311/, 135], [/302/, 177],
  [/פולסה|polset/i, 99], [/גלסייר|glacier/i, 119], [/i3/i, 148], [/135/, 102],
];

export function apartmentProfit(name: string, source: string | null, sellTotal: number, nights: number): { cost: number | null; profit: number | null } {
  if (source === "la_cime") {
    const cost = Math.round(sellTotal / AGENCY_MARKUP);
    return { cost, profit: sellTotal - cost };
  }
  const own = OWN_COST_NIGHT.find(([re]) => re.test(name));
  if (own) { const cost = Math.round(own[1] * nights); return { cost, profit: sellTotal - cost }; }
  return { cost: null, profit: null };
}
