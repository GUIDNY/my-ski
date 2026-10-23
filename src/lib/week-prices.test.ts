import { test } from "node:test";
import assert from "node:assert/strict";
import { weekMins } from "./week-prices.ts";

test("weekMins: the cheapest open apartment of every Saturday ahead, and how many are open", () => {
  const rows = [
    { available_weeks: [{ week: "2026-12-05", price: 1500.4 }, { week: "2026-12-12", price: 900 }] },
    { available_weeks: [{ week: "2026-12-12", price: 810.6 }, { week: "2026-10-17", price: 500 }] },
    { available_weeks: [{ week: "2026-12-12", price: 0 }] }, // no price: not open
    { available_weeks: null },
  ];
  assert.deepEqual(weekMins(rows, "2026-10-23"), [
    ["2026-12-05", 1500, 1],
    ["2026-12-12", 811, 2],
  ]);
});
