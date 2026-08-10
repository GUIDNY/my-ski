import { test } from "node:test";
import assert from "node:assert/strict";
import { computeTotals, money } from "./proposal-pricing.ts";

const items = [
  { label: "טיסות", qty: 4, unitPrice: 320 },
  { label: "לינה", qty: 1, unitPrice: 2100 },
  { label: "הסעות", qty: 4, unitPrice: 75 },
  { label: "סקי פס", qty: 4, unitPrice: 290 },
];

test("subtotal with no discount / no VAT matches the demo fixture", () => {
  const t = computeTotals(items);
  assert.equal(t.subtotal, 4840);
  assert.equal(t.total, 4840);
});

test("negative discount reduces the total", () => {
  const t = computeTotals(items, -340);
  assert.equal(t.afterDiscount, 4500);
  assert.equal(t.total, 4500);
});

test("VAT is applied on the amount after discount", () => {
  const t = computeTotals(items, -340, 0.17);
  assert.equal(t.afterDiscount, 4500);
  assert.equal(t.vat, 765);
  assert.equal(t.total, 5265);
});

test("VAT only, no discount", () => {
  const t = computeTotals(items, 0, 0.17);
  assert.equal(t.vat, Math.round(4840 * 0.17)); // 823
  assert.equal(t.total, 4840 + 823);
});

test("money formats with the right symbol and sign", () => {
  assert.equal(money(4840, "EUR"), "€4,840");
  assert.equal(money(-100, "EUR"), "−€100");
  assert.equal(money(500, "ILS"), "₪500");
});
