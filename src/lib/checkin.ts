import { flightView } from "./flight-checkin";

/*
 * Online check-in, kept in orders.ops (jsonb; x_ keys are not checklist items):
 *   ops.x_checkin : what the guest filled in the personal area
 *   ops.x_stay    : what Idan entered in the admin (address, booking code, how to get in)
 * The guest sees x_stay only after the check-in is done.
 */
export type CheckinData = { guests: string[]; arrival: string; phone: string; notes: string; at: string };
export type StayInfo = { address: string; ref: string; notes: string };

const str = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

export function cleanCheckin(b: Record<string, unknown>, guests: number): CheckinData | null {
  const names = (Array.isArray(b.guests) ? b.guests : []).map(x => str(x, 80)).filter(Boolean).slice(0, Math.max(1, guests));
  const phone = str(b.phone, 30);
  if (!names.length || !phone) return null;
  return { guests: names, arrival: str(b.arrival, 60), phone, notes: str(b.notes, 600), at: new Date().toISOString() };
}

export function cleanStay(v: unknown): StayInfo | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const s = { address: str(o.address, 200), ref: str(o.ref, 80), notes: String(o.notes ?? "").trim().slice(0, 1500) };
  return s.address || s.ref || s.notes ? s : null;
}

/** what the personal area gets from ops */
export function guestView(ops: unknown) {
  const o = (ops && typeof ops === "object" ? ops : {}) as Record<string, unknown>;
  const checkin = (o.x_checkin && typeof o.x_checkin === "object" ? o.x_checkin : null) as CheckinData | null;
  const stay = cleanStay(o.x_stay);
  // (not "checkin": that is the arrival date on the order)
  return { pass3v: !!o.x_pass3v, onlineCheckin: checkin, stay: checkin ? stay : null, stayReady: !!stay, flightCheckin: flightView(o.x_flight) };
}
