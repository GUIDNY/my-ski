// Days of the week with a nonstop Tel Aviv (TLV) <-> Lyon (LYS) flight during
// ski season. Verified directly against live Google Flights results for
// three separate sample weeks spanning the 2026-27 season (early Dec,
// mid-Jan, and end of March/start of April) — Tuesday and Thursday had a
// nonstop option (Transavia and/or an El Al-coded flight operated by
// Klasjet on behalf of Sun Or) in all three weeks; Wednesday, Friday and
// Monday had none in any of them. Weekends were inconsistent — nonstop in
// some weeks, absent in others (likely an irregular extra charter, not a
// standing weekly slot) — so they're deliberately left off this list rather
// than over-promising. (Note: aggregator sites like flightsfrom.com show a
// different Tue/Wed/Sat pattern, but that reflects last season's schedule,
// not what's actually bookable for 2026-27 — always trust a live check.)
// 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
export const DIRECT_FLIGHT_WEEKDAYS = [2, 4];

export function hasDirectFlight(date: Date): boolean {
  return DIRECT_FLIGHT_WEEKDAYS.includes(date.getDay());
}
