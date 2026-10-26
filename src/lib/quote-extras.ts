import type { PassArea } from "@/lib/deal-pricing";

/**
 * What was picked on the apartment page, carried in the quote link (?x=...)
 * so the quote opens with the same package: which ski pass and for how many,
 * how many need the transfer, equipment, the direct flight and a checked bag.
 * Only choices travel here, never prices: the quote page prices everything
 * again from the live data, the same way the apartment page does.
 *
 *   p3v4-t4-e2-f4-b4  →  3 Vallées pass ×4, transfer ×4, equipment ×2, flight ×4, bag ×4
 */
export type QuoteExtras = {
  pass?: { area: PassArea; qty: number };
  /** kind: the transfer picked (lib/transfer-options CLASS_CODE), airport: "GVA" | "LYS" */
  transfer?: { qty: number; kind?: string; airport?: "GVA" | "LYS" };
  equipment?: { qty: number };
  flight?: { qty: number };
  bag?: { qty: number };
};

const AREA_CODE: Record<PassArea, string> = { trois_vallees: "3v", val_thorens: "vt" };
const clampQty = (n: number) => Math.min(Math.max(Math.round(n) || 1, 1), 40);

export function encodeExtras(x: QuoteExtras): string {
  const parts: string[] = [];
  if (x.pass) parts.push(`p${AREA_CODE[x.pass.area]}${clampQty(x.pass.qty)}`);
  if (x.transfer) parts.push(`t${clampQty(x.transfer.qty)}${x.transfer.kind && /^[a-z]{2}$/.test(x.transfer.kind) ? x.transfer.kind : ""}${x.transfer.airport === "LYS" ? "l" : x.transfer.kind ? "g" : ""}`);
  if (x.equipment) parts.push(`e${clampQty(x.equipment.qty)}`);
  if (x.flight) parts.push(`f${clampQty(x.flight.qty)}`);
  if (x.flight && x.bag) parts.push(`b${clampQty(x.bag.qty)}`);
  return parts.join("-");
}

/** null when the link has no ?x (an older quote, or one made by the bots). */
export function decodeExtras(s: string | null | undefined): QuoteExtras | null {
  if (!s || !/^[a-z0-9-]{1,60}$/i.test(s)) return null;
  const x: QuoteExtras = {};
  for (const part of s.split("-")) {
    let m: RegExpMatchArray | null;
    if ((m = part.match(/^p(3v|vt)(\d{1,2})$/))) x.pass = { area: m[1] === "3v" ? "trois_vallees" : "val_thorens", qty: clampQty(Number(m[2])) };
    else if ((m = part.match(/^t(\d{1,2})([a-z]{2})?([gl])?$/))) x.transfer = { qty: clampQty(Number(m[1])), ...(m[2] ? { kind: m[2] } : {}), ...(m[3] ? { airport: m[3] === "l" ? "LYS" as const : "GVA" as const } : {}) };
    else if ((m = part.match(/^e(\d{1,2})$/))) x.equipment = { qty: clampQty(Number(m[1])) };
    else if ((m = part.match(/^f(\d{1,2})$/))) x.flight = { qty: clampQty(Number(m[1])) };
    else if ((m = part.match(/^b(\d{1,2})$/))) x.bag = { qty: clampQty(Number(m[1])) };
  }
  if (!x.flight) delete x.bag;
  return x;
}
