import { test } from "node:test";
import assert from "node:assert/strict";
import { resultRows, cheapest, pickReturn, airlineFromInfo } from "./google-flights-parse.ts";

// Compact (800×600) layout, as documented in /api/flight-price.
const outbound = [
  "Departing flights", "Prices include required taxes + fees for 1 adult.",
  "Cheapest from €351",
  "7:25 PM", "TLV", "11:15 PM", "LYS", "€351", "round trip", "Nonstop4 hr 50 minTransavia", "Low emissions",
  "6:00 AM", "TLV", "9:45 AM", "LYS", "€512", "round trip", "Nonstop4 hr 45 minEl Al",
  "2 results returned.",
];
const returning = [
  "Departing flight", "7:25 PM", "TLV", "11:15 PM", "LYS", "€351", "round trip",
  "Returning flights",
  "12:05 PM", "LYS", "4:50 PM", "TLV", "€351", "round trip", "Nonstop3 hr 45 minTransavia",
  "8:10 AM", "LYS", "12:55 PM", "TLV", "€420", "round trip", "Nonstop3 hr 45 minEl Al",
];

test("reads every row of the right direction with times and airline", () => {
  const rows = resultRows(outbound, "TLV", "LYS");
  assert.equal(rows.length, 2);
  assert.deepEqual([rows[0].departTime, rows[0].arriveTime, rows[0].airline, rows[0].nonstop, rows[0].price], ["7:25 PM", "11:15 PM", "Transavia", true, 351]);
  assert.equal(cheapest(rows)?.airline, "Transavia");
});

test("ignores the 'Cheapest from' tab and the other direction", () => {
  assert.equal(resultRows(outbound, "LYS", "TLV").length, 0);
  const back = resultRows(returning, "LYS", "TLV");
  assert.equal(back.length, 2);
  assert.equal(back[0].departTime, "12:05 PM");
});

test("prefers the outbound's airline for the return, else the cheapest", () => {
  const back = resultRows(returning, "LYS", "TLV");
  assert.equal(pickReturn(back, "El Al")?.departTime, "8:10 AM");
  assert.equal(pickReturn(back, "Transavia")?.departTime, "12:05 PM");
  assert.equal(pickReturn(back, "Wizz Air")?.departTime, "12:05 PM");
  assert.equal(pickReturn(back, null)?.departTime, "12:05 PM");
});

test("one-way rows without a 'round trip' line, and next-day arrivals", () => {
  const ow = ["10:40 PM", "LYS", "3:25 AM+1", "TLV", "€189", "Nonstop3 hr 45 minTransavia"];
  const rows = resultRows(ow, "LYS", "TLV");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].arriveTime, "3:25 AM+1");
});

test("airline text after stops and duration", () => {
  assert.equal(airlineFromInfo("Nonstop4 hr 5 minTransavia"), "Transavia");
  assert.equal(airlineFromInfo("Nonstop50 minAir France"), "Air France");
  assert.equal(airlineFromInfo("1 stop7 hr 10 minITA, Lufthansa"), "ITA, Lufthansa");
  assert.equal(airlineFromInfo("Nonstop4 hr"), null);
});
