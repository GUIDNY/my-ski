import { getQuote, type WinterideQuote } from "@/lib/winteride";

/*
 * Every transfer we can offer for a trip, priced live by Winteride (no markup):
 * a seat on the shared shuttle when the flight has one, and every private car
 * that takes the group. One call for both legs; the deals, the quote pages,
 * the transfers page and the bots all read the same answer.
 * "best": the shared shuttle when there is one, else the cheapest car that
 * fits the people and the bags and is confirmed at once.
 */

export type TransferOption = {
  key: string;                 // "shared" or the vehicle class id
  kind: "shared" | "private";
  name: string;                // Hebrew name
  className: string;           // Winteride's class name ("shared" for the shuttle)
  total: number;               // EUR, all active legs, the whole group
  perPerson: number;
  maxPax: number | null;
  maxBags: number | null;
  fits: boolean;               // people and bags fit
  onRequest: boolean;          // the office confirms it by hand
  seatsLeft: number | null;    // shared only
};

export type TransferAnswer = {
  ok: boolean;
  airport: "GVA" | "LYS";
  options: TransferOption[];
  best: string | null;
  driveMinutes: number | null;
  km: number | null;
  legs: { out: string | null; ret: string | null };
  sharedReason: string | null; // why there is no shuttle (no flight number, flight not found…)
};

export const CLASS_HE: Record<string, string> = {
  sedan: "רכב פרטי (סדאן)", minivan: "מיניוואן", van: "ואן", "Premium minivan": "מיניוואן פרימיום",
  minibus: "מיניבוס", coach: "אוטובוס",
};

/** short codes for the quote link (?x=t4mvg): the class a customer picked */
export const CLASS_CODE: Record<string, string> = {
  shared: "sh", sedan: "se", minivan: "mv", van: "va", "Premium minivan": "pm", minibus: "mb", coach: "co",
};
export const codeOf = (o: Pick<TransferOption, "className">) => CLASS_CODE[o.className] ?? "";
export const byCode = (a: TransferAnswer, code?: string) => (code ? a.options.find(o => codeOf(o) === code) : undefined);

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const flightNo = (v?: string | null) => { const s = String(v || "").toUpperCase().replace(/\s+/g, ""); return /^[A-Z0-9]{2}\d{1,4}$/.test(s) ? s : undefined; };

export async function transferOptions(p: {
  airport?: string; outDate?: string | null; retDate?: string | null;
  outFlight?: string | null; retFlight?: string | null;
  pax: number; luggage?: number; ski?: number;
}): Promise<TransferAnswer> {
  const airport = p.airport === "LYS" ? "LYS" : "GVA";
  const pax = Math.max(1, Math.min(49, Math.round(Number(p.pax) || 1)));
  const luggage = Math.max(0, Math.round(Number(p.luggage ?? pax) || 0));
  const ski = Math.max(0, Math.round(Number(p.ski) || 0));
  const out = p.outDate && ISO.test(p.outDate) ? p.outDate : null;
  const ret = p.retDate && ISO.test(p.retDate) ? p.retDate : null;
  const empty: TransferAnswer = { ok: false, airport, options: [], best: null, driveMinutes: null, km: null, legs: { out, ret }, sharedReason: null };
  if (!out && !ret) return empty;

  const ask = (date: string, dir: "arrival" | "departure", fl?: string) =>
    getQuote({ airport_code: airport, resort_slug: "val-thorens", date, pax, out_direction: dir, flight_no: fl, luggage, ski }).catch(() => null);
  const outFl = flightNo(p.outFlight), retFl = flightNo(p.retFlight);
  const [qo, qr] = await Promise.all([out ? ask(out, "arrival", outFl) : null, ret ? ask(ret, "departure", retFl) : null]);
  if ((out && !qo) || (ret && !qr)) return empty;
  const legs = [qo, qr].filter(Boolean) as WinterideQuote[];

  const options: TransferOption[] = [];
  // the shuttle: a seat for everyone on every active leg
  const seats = legs.map(q => (q.shared?.available && q.shared.price_cents ? q.shared : null));
  if (seats.length && seats.every(Boolean)) {
    const cents = seats.reduce((s, x) => s + (x!.price_cents || 0), 0);
    const left = seats.map(x => x!.seats_remaining).filter((n): n is number => typeof n === "number");
    options.push({
      key: "shared", kind: "shared", name: "שאטל משותף", className: "shared",
      total: Math.round((cents * pax) / 100), perPerson: Math.round(cents / 100),
      maxPax: null, maxBags: null, fits: !left.length || Math.min(...left) >= pax,
      onRequest: seats.some(x => x!.on_request), seatsLeft: left.length ? Math.min(...left) : null,
    });
  }
  const sharedReason = options.length ? null
    : !(outFl || retFl) ? "no_flight"
    : (legs.map(q => q.shared?.reason).find(Boolean) as string | undefined) ?? "not_available";

  // private cars: offered on every active leg, priced for the whole car
  for (const c of legs[0].private) {
    const per = legs.map(q => q.private.find(x => x.vehicle_class_id === c.vehicle_class_id));
    if (per.some(x => !x) || c.max_pax < pax) continue;
    const cents = per.reduce((s, x) => s + x!.price_cents, 0);
    options.push({
      key: c.vehicle_class_id, kind: "private", name: CLASS_HE[c.class] ?? c.class, className: c.class,
      total: Math.round(cents / 100), perPerson: Math.round(cents / 100 / pax),
      maxPax: c.max_pax, maxBags: c.max_luggage, fits: c.max_luggage >= luggage + ski,
      onRequest: per.some(x => x!.on_request), seatsLeft: null,
    });
  }
  options.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "shared" ? -1 : 1) || Number(b.fits) - Number(a.fits) || Number(a.onRequest) - Number(b.onRequest) || a.total - b.total);
  const best = options.find(o => o.fits && !o.onRequest) ?? options.find(o => !o.onRequest) ?? null;
  const travel = legs.find(q => q.travel)?.travel;
  return { ok: options.length > 0, airport, options, best: best?.key ?? null, driveMinutes: travel?.drive_minutes ?? null, km: travel?.km ?? null, legs: { out, ret }, sharedReason };
}
