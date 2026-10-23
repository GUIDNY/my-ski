// Shared by the browser and the server (the quote PDF): plain data and
// formatting for the direct flight we offer. No "use client" here on purpose.

export type FlightAirport = "GVA" | "LYS";
export const AIRPORT_CITY: Record<FlightAirport, string> = { GVA: "ז'נבה", LYS: "ליון" };

/** The cheapest direct round trip of the two airports we fly to. */
export type DirectFlight = {
  airport: FlightAirport;
  city: string;
  price: number;
  airline: string | null;
  url: string | null;
  departTime: string | null;
  arriveTime: string | null;
};

export type ReturnLeg = { departTime: string | null; arriveTime: string | null; airline: string | null };

/** "6:15 AM" → "06:15", "1:05 AM+1" → "01:05 (+1)" */
export function time24(t: string | null | undefined): string | null {
  if (!t) return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)(\+\d)?$/i);
  if (!m) return t;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return `${String(h).padStart(2, "0")}:${m[2]}${m[4] ? ` (${m[4]})` : ""}`;
}

const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
/** "שבת 16.1" */
export const dayLabel = (iso: string) => { const d = new Date(iso + "T12:00:00"); return `${WEEKDAYS[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}`; };

/** The flight as one line for the order and the WhatsApp message: route, airline, both legs, price. */
export function flightOrderText(f: DirectFlight, ret: ReturnLeg | null, checkin: string, checkout: string, qty: number, bag?: { qty: number; unit: number } | null): string {
  const leg = (label: string, date: string, d: string | null, a: string | null) => {
    const dd = time24(d), aa = time24(a);
    return `${label} ${dayLabel(date)}${dd && aa ? ` ${dd}–${aa}` : ""}`;
  };
  return [
    `טיסה ישירה הלוך וחזור TLV-${f.airport}${f.airline ? ` (${f.airline})` : ""}`,
    leg("הלוך", checkin, f.departTime, f.arriveTime),
    leg("חזור", checkout, ret?.departTime ?? null, ret?.arriveTime ?? null),
    `€${f.price} לאדם × ${qty}`,
    bag ? `מזוודה €${bag.unit} × ${bag.qty}` : null,
  ].filter(Boolean).join(" · ");
}
