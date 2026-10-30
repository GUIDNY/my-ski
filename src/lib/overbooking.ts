import type { SupabaseClient } from "@supabase/supabase-js";
import { getAirbnbCalendar } from "@/lib/airbnb-calendar";

/*
 * אובר-בוקינג check: every upcoming site order (approved/hold) on one of our
 * own Airbnb-listed apartments must have ALL its nights closed on Airbnb
 * (booked-or-blocked in the Hostex calendar n8n serves). A night still OPEN on
 * Airbnb means an Airbnb guest could book over an Israeli's site order.
 */
export type OverbookingIssue = {
  code: string; name: string; apartment: string;
  checkin: string; checkout: string; openDates: string[];
};
export type OverbookingReport = {
  ok: boolean; calendar: boolean; checked: number; covered: number;
  issues: OverbookingIssue[]; generatedAt: string;
};

const dayIndex = (start: string, iso: string) =>
  Math.round((Date.parse(iso + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) / 864e5);
const isoPlus = (start: string, days: number) => {
  const [y, m, d] = start.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

export async function checkOverbooking(db: SupabaseClient): Promise<OverbookingReport> {
  const today = new Date().toISOString().slice(0, 10);
  const [cal, { data: orders }] = await Promise.all([
    getAirbnbCalendar(),
    db.from("orders").select("code, customer_name, apartment_id, apartment_name, extra_apartment_id, extra_apartment_name, checkin, checkout, status")
      .in("status", ["approved", "hold"]).gte("checkout", today).not("checkin", "is", null),
  ]);
  if (!cal) return { ok: false, calendar: false, checked: 0, covered: 0, issues: [], generatedAt: new Date().toISOString() };

  const closedBy = new Map<string, Set<number>>();
  for (const l of cal.listings) closedBy.set(l.apartmentId, new Set(l.closed));

  const issues: OverbookingIssue[] = [];
  let covered = 0;
  for (const o of orders ?? []) {
    const stays: { id: string | null; name: string }[] = [
      { id: o.apartment_id, name: o.apartment_name || "" },
      { id: o.extra_apartment_id, name: o.extra_apartment_name || "" },
    ];
    for (const stay of stays) {
      if (!stay.id || !closedBy.has(stay.id)) continue; // not one of our Airbnb-listed apartments
      covered++;
      const closed = closedBy.get(stay.id)!;
      const from = dayIndex(cal.start, o.checkin), to = dayIndex(cal.start, o.checkout);
      const openDates: string[] = [];
      for (let i = Math.max(from, 0); i < Math.min(to, cal.days); i++) {
        if (!closed.has(i)) openDates.push(isoPlus(cal.start, i));
      }
      if (openDates.length) issues.push({
        code: o.code, name: o.customer_name || "", apartment: stay.name,
        checkin: o.checkin, checkout: o.checkout, openDates,
      });
    }
  }
  return { ok: true, calendar: true, checked: (orders ?? []).length, covered, issues, generatedAt: new Date().toISOString() };
}
