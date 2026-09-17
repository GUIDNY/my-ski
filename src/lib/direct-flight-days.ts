// Days of the week with a nonstop Tel Aviv (TLV) <-> Lyon (LYS) flight during
// ski season, based on last winter's (2025-26) published schedules:
// Transavia TO3461 (Tue/Sat) and the El Al-coded LY5177 (Wed/Sat) — see
// flightsfrom.com, flightconnections.com and flightmapper.net. Airlines
// haven't fully published the 2026-27 schedule this far out, but seasonal
// ski-charter patterns are typically renewed on the same weekdays year to
// year, so this is a "usually" indicator, not a guarantee — worth
// re-confirming close to the date.
// 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
export const DIRECT_FLIGHT_WEEKDAYS = [2, 3, 6];

export function hasDirectFlight(date: Date): boolean {
  return DIRECT_FLIGHT_WEEKDAYS.includes(date.getDay());
}
