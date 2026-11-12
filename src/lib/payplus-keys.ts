/*
 * Which PayPlus terminal the site charges through.
 * New terminal (the company's bank account): PAYPLUS2_API_KEY + PAYPLUS2_SECRET_KEY
 * (+ PAYPLUS2_PAGE_UID, PAYPLUS2_TERMINAL_UID). As soon as both keys are set, new
 * payments go there by themselves. Until then: the old PAYPLUS_* terminal.
 * Checking and charging a transaction tries both, so payments made on the old
 * terminal still confirm and charge after the switch.
 */
export type PayplusKeys = { which: "new" | "old"; apiKey: string; secret: string; pageUid: string; terminalUid: string };

function newKeys(): PayplusKeys | null {
  const apiKey = process.env.PAYPLUS2_API_KEY, secret = process.env.PAYPLUS2_SECRET_KEY;
  if (!apiKey || !secret) return null;
  return { which: "new", apiKey, secret, pageUid: process.env.PAYPLUS2_PAGE_UID || "", terminalUid: process.env.PAYPLUS2_TERMINAL_UID || "" };
}
function oldKeys(): PayplusKeys | null {
  const apiKey = process.env.PAYPLUS_API_KEY, secret = process.env.PAYPLUS_SECRET_KEY;
  if (!apiKey || !secret) return null;
  return { which: "old", apiKey, secret, pageUid: process.env.PAYPLUS_PAGE_UID || "", terminalUid: process.env.PAYPLUS_TERMINAL_UID || "" };
}

/** the terminal new payments go to */
export const activeKeys = (): PayplusKeys | null => newKeys() ?? oldKeys();
/** every configured terminal, the active one first (to check / charge an existing payment) */
export const allKeys = (): PayplusKeys[] => [newKeys(), oldKeys()].filter((k): k is PayplusKeys => !!k);
