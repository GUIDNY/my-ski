/*
 * Flight check-in in the personal area. Idan enters the airline, the airline's
 * booking code (PNR) and the flight times in the admin (orders.ops.x_flight);
 * the guest gets a button to the airline's check-in page with the code to copy,
 * and an email 24 hours before each flight (cron /api/cron/flight-checkin).
 */
export type FlightLeg = { date: string; time: string; no: string };
export type FlightInfo = { airline: string; pnr: string; url: string; out: FlightLeg; ret: FlightLeg; remOut?: string; remRet?: string };

/** the airline's check-in page (Transavia checked 28.10.2026; the others open the airline's site,
 *  where check-in is on the first screen: a better link can be set on the order) */
export const AIRLINES: { key: string; name: string; url: string }[] = [
  { key: "transavia", name: "Transavia", url: "https://www.transavia.com/en-EU/my-transavia/check-in/login/" },
  { key: "elal", name: "אל על", url: "https://www.elal.com/" },
  { key: "israir", name: "ישראייר", url: "https://www.israir.co.il/" },
  { key: "arkia", name: "ארקיע", url: "https://www.arkia.co.il/" },
  { key: "easyjet", name: "easyJet", url: "https://www.easyjet.com/en/" },
  { key: "wizz", name: "Wizz Air", url: "https://wizzair.com/" },
  { key: "swiss", name: "Swiss", url: "https://www.swiss.com/" },
  { key: "lufthansa", name: "Lufthansa", url: "https://www.lufthansa.com/" },
  { key: "airfrance", name: "Air France", url: "https://www.airfrance.com/" },
  { key: "other", name: "חברה אחרת", url: "" },
];

const s = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const leg = (v: unknown): FlightLeg => {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(o.date ?? "")) ? String(o.date) : "";
  const time = /^\d{1,2}:\d{2}$/.test(String(o.time ?? "")) ? String(o.time).padStart(5, "0") : "";
  return { date, time, no: s(o.no, 12).toUpperCase().replace(/\s+/g, "") };
};

export function cleanFlight(v: unknown): FlightInfo | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const url = /^https:\/\/[^\s"'<>]+$/.test(s(o.url, 400)) ? s(o.url, 400) : "";
  const f: FlightInfo = { airline: s(o.airline, 30), pnr: s(o.pnr, 20).toUpperCase(), url, out: leg(o.out), ret: leg(o.ret) };
  if (typeof o.remOut === "string") f.remOut = o.remOut;
  if (typeof o.remRet === "string") f.remRet = o.remRet;
  return f.airline || f.pnr || f.out.date || f.ret.date ? f : null;
}

export const airlineOf = (key: string) => AIRLINES.find(a => a.key === key);
export const checkinUrl = (f: FlightInfo) => f.url || airlineOf(f.airline)?.url || "";
export const airlineName = (f: FlightInfo) => airlineOf(f.airline)?.name || f.airline || "חברת התעופה";

/** what the guest sees (no reminder bookkeeping) */
export function flightView(v: unknown) {
  const f = cleanFlight(v);
  if (!f) return null;
  return { airline: airlineName(f), pnr: f.pnr, url: checkinUrl(f), out: f.out, ret: f.ret };
}

/** a wall-clock time in a time zone → epoch ms */
export function zonedMs(date: string, time: string, tz: string): number {
  const [y, m, d] = date.split("-").map(Number), [hh, mm] = (time || "12:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .formatToParts(new Date(guess)).reduce<Record<string, number>>((a, p) => (p.type !== "literal" ? { ...a, [p.type]: Number(p.value) } : a), {});
  const asTz = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return guess - (asTz - guess);
}
