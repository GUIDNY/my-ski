// Default seasonal pricing calendar for Val Thorens (base for every apartment).
// Each period: [start, end, weekday price (Sun–Thu), weekend price (Fri–Sat)].
export const SEASONAL_PERIODS: [string, string, number, number][] = [
  ["2026-12-01", "2026-12-11", 80, 120],
  ["2026-12-12", "2026-12-18", 105, 155],
  ["2026-12-19", "2026-12-25", 290, 430],   // Christmas
  ["2026-12-26", "2027-01-01", 480, 725],   // New Year
  ["2027-01-02", "2027-01-08", 210, 315],
  ["2027-01-09", "2027-01-15", 185, 275],
  ["2027-01-16", "2027-01-22", 165, 250],
  ["2027-01-23", "2027-01-29", 165, 250],
  ["2027-01-30", "2027-02-05", 190, 295],
  ["2027-02-06", "2027-02-12", 225, 345],
  ["2027-02-13", "2027-02-19", 260, 400],
  ["2027-02-20", "2027-02-26", 280, 420],
  ["2027-02-27", "2027-03-05", 245, 370],
  ["2027-03-06", "2027-03-12", 200, 305],
  ["2027-03-13", "2027-03-19", 190, 295],
  ["2027-03-20", "2027-03-26", 175, 260],
  ["2027-03-27", "2027-04-02", 200, 305],
  ["2027-04-03", "2027-04-09", 175, 260],
  ["2027-04-10", "2027-04-16", 130, 200],
  ["2027-04-17", "2027-04-23", 105, 155],
  ["2027-04-24", "2027-04-30", 80, 120],
];

const WEEKDAYS = [0, 1, 2, 3, 4]; // Sun–Thu
const WEEKEND = [5, 6];           // Fri–Sat
export const SEASONAL_LABEL = "עונתי (ברירת מחדל)";

// Build the default pricing_rules rows for one apartment (2 per period).
export function buildSeasonalRules(apartmentId: string) {
  const rows: Record<string, unknown>[] = [];
  for (const [start, end, wkday, wkend] of SEASONAL_PERIODS) {
    rows.push({
      apartment_id: apartmentId, label: `${SEASONAL_LABEL} · א׳-ה׳`, type: "date_range",
      price_type: "absolute", start_date: start, end_date: end, weekdays: WEEKDAYS, price: wkday, priority: 10,
    });
    rows.push({
      apartment_id: apartmentId, label: `${SEASONAL_LABEL} · ו׳-ש׳`, type: "date_range",
      price_type: "absolute", start_date: start, end_date: end, weekdays: WEEKEND, price: wkend, priority: 10,
    });
  }
  return rows;
}
