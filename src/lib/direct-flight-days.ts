// Days with a nonstop Tel Aviv (TLV) <-> Lyon (LYS) flight during ski
// season. Verified directly against live Google Flights results (via the
// same TLV-LYS URL builder used in FlightSearch.tsx), checked one date at a
// time across the whole 2026-27 season rather than trusted from aggregator
// sites (flightsfrom.com etc. turned out to reflect last season's schedule,
// not this one):
//
// - Tuesday and Thursday: a nonstop option (Transavia and/or an El Al-coded
//   flight actually operated by Klasjet on behalf of the tour operator Sun
//   Or) showed up in essentially every week checked from 2026-12-01 through
//   2027-04-29 — the closest thing to a standing weekly slot on this route.
// - Saturday: a real, consistent nonstop Transavia flight, but only across
//   the CORE season — every Saturday from 2026-12-12 through 2027-03-06 had
//   one. The season's opening Saturday (2026-12-05) and every Saturday from
//   2027-03-13 onward had none — this reads as a "שבת עד שבת" ski-charter
//   block bounded to high season, not a year-round Saturday slot.
// - Wednesday, Friday, Sunday, Monday: no nonstop option in any check.
const SATURDAY_CHARTER_START = "2026-12-12";
const SATURDAY_CHARTER_END = "2027-03-06";

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function hasDirectFlight(date: Date): boolean {
  const day = date.getDay(); // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
  if (day === 2 || day === 4) return true;
  if (day === 6) {
    const iso = toIso(date);
    return iso >= SATURDAY_CHARTER_START && iso <= SATURDAY_CHARTER_END;
  }
  return false;
}
