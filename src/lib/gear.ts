import { equipCost } from "./pricing";

/*
 * Ski / snowboard rental ordered on its own (/equipment), open to anyone in
 * Val Thorens. The gear waits at Caron Skishop: the customer shows the order
 * email there. Priced like the add-on on an apartment: €30 a day, €120 for 6
 * days, €20 for every day after that, per person (lib/pricing equipCost).
 */

export const GEAR_SHOP = {
  name: "Caron Skishop",
  area: "Val Thorens",
  maps: "https://www.google.com/maps/search/?api=1&query=Caron+Skishop+Val+Thorens",
};

export type GearKind = "ski" | "snowboard";
export type GearPerson = { name: string; kind: GearKind; height: string; weight: string; shoe: string };
export type GearOrder = { from: string; to: string; days: number; people: GearPerson[]; shop: string };

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const clip = (v: unknown, n: number) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, n);

/** ski days from the first to the last day, both included */
export function gearDays(from: string, to: string): number {
  if (!ISO.test(from) || !ISO.test(to) || to < from) return 0;
  return Math.round((Date.parse(to + "T12:00:00Z") - Date.parse(from + "T12:00:00Z")) / 864e5) + 1;
}

export const gearTotal = (days: number, people: number) => equipCost(days) * people;

/** what the browser sent, cleaned; null when it isn't a usable order */
export function cleanGear(raw: unknown): GearOrder | null {
  const g = raw as Partial<GearOrder> | null;
  if (!g || typeof g !== "object") return null;
  const from = clip(g.from, 10), to = clip(g.to, 10);
  const days = gearDays(from, to);
  if (days < 1 || days > 30 || !Array.isArray(g.people)) return null;
  const people = g.people.slice(0, 20).map(p => ({
    name: clip(p?.name, 60),
    kind: (p?.kind === "snowboard" ? "snowboard" : "ski") as GearKind,
    height: clip(p?.height, 5), weight: clip(p?.weight, 5), shoe: clip(p?.shoe, 5),
  })).filter(p => p.name);
  if (!people.length) return null;
  return { from, to, days, people, shop: GEAR_SHOP.name };
}

/** the order's line in admin and in the payment description */
export const gearTitle = (g: GearOrder) => {
  const ski = g.people.filter(p => p.kind === "ski").length;
  const board = g.people.length - ski;
  return `השכרת ציוד · ${[ski && `${ski} סקי`, board && `${board} סנובורד`].filter(Boolean).join(", ")} · ${GEAR_SHOP.name}`;
};
