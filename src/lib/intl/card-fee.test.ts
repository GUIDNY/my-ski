import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// CARD_FEE_PCT isn't exported from CardPaymentButton, so the English/French
// checkout keeps its own copy (lib/intl/config.ts): the two must not drift.
test("the EN/FR card fee is the Hebrew checkout's card fee", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").match(/CARD_FEE_PCT = ([\d.]+)/)?.[1];
  const hebrew = read("../../components/CardPaymentButton.tsx");
  const intl = read("./config.ts");
  assert.ok(hebrew, "CARD_FEE_PCT found in CardPaymentButton.tsx");
  assert.equal(intl, hebrew);
});
