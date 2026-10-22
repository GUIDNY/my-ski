import { test } from "node:test";
import assert from "node:assert/strict";
import { calcTotalForRange, getEffectivePrice, stayBreakdown, type PricingRule } from "./pricing.ts";
import { airbnbClosedApartments, airbnbRules, parseAirbnbCalendar } from "./airbnb-rules.ts";

const APT = "12f063c0-20f2-4a07-b2dd-442790b92533";
const OTHER = "39d46036-cba2-48ee-b0db-087d25788dc7";

// 10 days from 2027-01-14: three nights at 300, then 345 (weekend), then 280
const PRICES = [300, 300, 300, 345, 345, 280, 280, 280, 280, 0];
const cal = parseAirbnbCalendar({
  ok: true, start: "2027-01-14", days: PRICES.length, commission: 0.155, generatedAt: "x",
  listings: [
    { apartmentId: APT, listingId: "1458596834217631897", cleaning: 46, prices: PRICES, closed: [7] },
    { apartmentId: OTHER, listingId: "1467994517433360583", cleaning: 34, prices: PRICES.map(() => 200), closed: [] },
  ],
});

const seasonal: PricingRule[] = [
  { id: "s1", label: "עונתי", type: "date_range", price_type: "absolute", start_date: "2027-01-01", end_date: "2027-01-31", price: 165, priority: 10 },
  { id: "s2", label: "+20", type: "weekday", price_type: "add", weekdays: [5, 6], price: 20, priority: 5 },
];

// what the n8n "Price stay" node charges for the same stay
const botTotal = (nights: number[], cleaning: number) => Math.round((nights.reduce((s, n) => s + n, 0) + cleaning) * (1 - 0.155));

test("a stay fully on the Airbnb calendar costs exactly what the bots charge", () => {
  const rules = [...seasonal, ...airbnbRules(cal, APT)];
  const b = stayBreakdown("2027-01-14", "2027-01-19", 250, rules); // 5 nights: 300,300,300,345,345
  assert.equal(b.source, "airbnb");
  assert.equal(b.total, botTotal([300, 300, 300, 345, 345], 46));
  assert.equal(calcTotalForRange("2027-01-14", "2027-01-19", 250, rules), b.total);
  // shown nights are whole euros and nights + cleaning add up to the total
  assert.deepEqual(b.nights.map(n => n.price), [254, 254, 254, 292, 292]);
  assert.equal(b.nights.reduce((s, n) => s + n.price, 0) + b.fee, b.total);
  // the cleaning line (46 net of commission = 38.87) absorbs up to half a euro of rounding per night
  assert.ok(Math.abs(b.fee - 46 * 0.845) <= 0.5 * b.nights.length + 0.5);
});

test("site add-on rules and the December floor don't touch Airbnb nights", () => {
  const rules = [...seasonal, ...airbnbRules(cal, APT)];
  // 2027-01-15 is a Friday: the +20 weekend rule would apply to a site night
  assert.equal(getEffectivePrice(new Date("2027-01-15T12:00:00"), 250, rules), Math.round(300 * 0.845));
  assert.equal(getEffectivePrice(new Date("2027-01-15T12:00:00"), 250, seasonal), 185);
  const dec = parseAirbnbCalendar({ ok: true, start: "2026-12-01", days: 1, commission: 0.155, listings: [{ apartmentId: APT, cleaning: 46, prices: [100] }] });
  assert.equal(getEffectivePrice(new Date("2026-12-01T12:00:00"), 250, airbnbRules(dec, APT)), 85); // not lifted to the €90 December floor
});

test("only site add-ons ranked above the Airbnb calendar adjust an Airbnb night", () => {
  const plus60: PricingRule = { id: "p", label: "+15", type: "date_range", price_type: "add", start_date: "2027-01-14", end_date: "2027-01-14", price: 15, priority: 60 };
  const rules = [...seasonal, ...airbnbRules(cal, APT), plus60];
  assert.equal(getEffectivePrice(new Date("2027-01-14T12:00:00"), 250, rules), Math.round(300 * 0.845 + 15));
  assert.equal(stayBreakdown("2027-01-14", "2027-01-16", 250, rules).total, Math.round((300 + 300 + 46) * 0.845 + 15));
});

test("a site rule with a higher priority still beats the Airbnb price, night by night", () => {
  // a special price on the Friday only: Thursday and Saturday stay on the calendar, and so does cleaning
  const friday: PricingRule = { id: "o", label: "מבצע", type: "date_range", price_type: "absolute", start_date: "2027-01-15", end_date: "2027-01-15", price: 199, priority: 60 };
  const b = stayBreakdown("2027-01-14", "2027-01-17", 250, [...seasonal, ...airbnbRules(cal, APT), friday]);
  assert.equal(b.source, "airbnb");
  assert.deepEqual(b.nights.map(n => n.price), [254, 219, 254]); // the special night gets the site's +20 Friday rule
  assert.equal(b.total, Math.round(300 * 0.845 + 219 + 300 * 0.845 + 46 * 0.845));
  assert.equal(b.nights.reduce((s, n) => s + n.price, 0) + b.fee, b.total);

  // the whole stay on a special price: the site's nights, plus the cleaning
  const all: PricingRule = { ...friday, start_date: "2027-01-14", end_date: "2027-01-16" };
  const w = stayBreakdown("2027-01-14", "2027-01-17", 250, [...seasonal, ...airbnbRules(cal, APT), all]);
  assert.deepEqual(w.nights.map(n => n.price), [199, 219, 219]);
  assert.equal(w.total, Math.round(199 + 219 + 219 + 46 * 0.845));
});

test("a stay that runs past the Airbnb calendar is priced by the site, like the bots' fallback", () => {
  const rules = [...seasonal, ...airbnbRules(cal, APT)];
  const b = stayBreakdown("2027-01-20", "2027-01-24", 250, rules); // last night has no Airbnb price
  assert.equal(b.source, "site");
  assert.equal(b.fee, 0);
  assert.equal(b.total, calcTotalForRange("2027-01-20", "2027-01-24", 250, seasonal));
});

test("apartments without Airbnb rules price exactly as before", () => {
  // the old calcTotalForRange: sum of each night's price
  let old = 0;
  for (let d = new Date("2027-01-10T12:00:00"); d < new Date("2027-01-17T12:00:00"); d.setDate(d.getDate() + 1)) old += getEffectivePrice(new Date(d), 250, seasonal);
  assert.equal(calcTotalForRange("2027-01-10", "2027-01-17", 250, seasonal), old);
  assert.equal(stayBreakdown("2027-01-10", "2027-01-17", 250, seasonal).source, "site");
  assert.equal(calcTotalForRange("", "", 250, seasonal), 0);
});

test("the calendar becomes one rule per run of equal prices, plus cleaning", () => {
  const rules = airbnbRules(cal, APT);
  const ranges = rules.filter(r => r.type === "date_range").map(r => [r.start_date, r.end_date, Math.round(r.price * 1000) / 1000]);
  assert.deepEqual(ranges, [
    ["2027-01-14", "2027-01-16", 253.5],
    ["2027-01-17", "2027-01-18", 291.525],
    ["2027-01-19", "2027-01-22", 236.6],
  ]);
  const fee = rules.find(r => r.type === "stay_fee");
  assert.ok(fee && Math.abs(fee.price - 46 * 0.845) < 1e-9);
  assert.ok(rules.every(r => r.source === "airbnb" && r.priority === 50));
  assert.deepEqual(airbnbRules(cal, "00000000-0000-0000-0000-000000000000"), []);
  assert.deepEqual(airbnbRules(null, APT), []);
});

test("nights booked or blocked on Airbnb make the apartment taken", () => {
  assert.deepEqual(airbnbClosedApartments(cal, "2027-01-20", "2027-01-22"), [APT]); // day 7 = 2027-01-21
  assert.deepEqual(airbnbClosedApartments(cal, "2027-01-14", "2027-01-21"), []);   // checkout day is free
  assert.deepEqual(airbnbClosedApartments(null, "2027-01-20", "2027-01-22"), []);
});

test("a malformed calendar is rejected instead of cached", () => {
  assert.throws(() => parseAirbnbCalendar({ ok: false }));
  assert.throws(() => parseAirbnbCalendar({ ok: true, start: "2027-01-14", days: 2, commission: 0.155, listings: [{ apartmentId: APT, cleaning: 46, prices: [300] }] }));
  assert.throws(() => parseAirbnbCalendar({ ok: true, start: "2027-01-14", days: 1, commission: 0.9, listings: [{ apartmentId: APT, cleaning: 46, prices: [300] }] }));
  assert.throws(() => parseAirbnbCalendar({ ok: true, start: "2027-01-14", days: 1, commission: 0.155, listings: [{ apartmentId: "x", cleaning: 46, prices: [300] }] }));
});
