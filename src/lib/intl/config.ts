/*
 * The English and French site (/en, /fr): apartments only, booked and paid
 * online. Shared constants; no Next.js or network code here so both server
 * and client components can import it.
 */

export const LANGS = ["en", "fr"] as const;
export type Lang = (typeof LANGS)[number];
/** Every language of the site, Hebrew (the main site, no prefix) included. */
export type SiteLang = Lang | "he";

export const isLang = (s: string | undefined | null): s is Lang => s === "en" || s === "fr";

export const SITE_URL = "https://skisharebook.com";
export const CONTACT_EMAIL = "skishareteam@gmail.com";

/**
 * The card processing fee. Must stay equal to CARD_FEE_PCT in
 * src/components/CardPaymentButton.tsx (not exported there): the amount sent
 * to PayPlus is the total plus Math.round(total * CARD_FEE_PCT), exactly as
 * the Hebrew site charges it.
 */
export const CARD_FEE_PCT = 0.019;
export const cardFeeFor = (total: number) => Math.round(total * CARD_FEE_PCT);

/**
 * The dates that can be booked here: the Val Thorens lift season 2026/27
 * (21 Nov 2026 – 2 May 2027). Agency weeks (Saturday to Saturday) all fall
 * inside it.
 */
export const SEASON_START = "2026-11-21";
export const SEASON_END = "2027-05-02";

/** What the root layout (src/app/layout.tsx) puts on <html>; put back when leaving /en or /fr. */
export const HE_HTML = { lang: "he", dir: "rtl" } as const;

export const DEFAULT_GUESTS = 2;
export const MAX_SEARCH_GUESTS = 12;
/** Longest stay the dates picker and the URL accept (nights). */
export const MAX_NIGHTS = 60;

/** Session key: the apartment page the customer left for PayPlus (the failure page links back to it). */
export const LAST_APARTMENT_KEY = "skishare-intl-last-apartment";

/** "/en/apartments/x" → "/apartments/x"; "/en" → "". */
export function restOf(pathname: string): string {
  const m = pathname.match(/^\/(en|fr)(\/.*)?$/);
  return m ? (m[2] ?? "").replace(/\/$/, "") : pathname;
}

/** The Hebrew page with the same content, or null when there is none (then the Hebrew home). */
export function hebrewEquivalent(rest: string): string | null {
  if (rest === "") return "/";
  if (["/apartments", "/terms", "/privacy", "/pay/success", "/pay/failure"].includes(rest)) return rest;
  if (/^\/apartments\/[0-9a-f-]{36}$/i.test(rest)) return rest;
  return null;
}

const KEEP_QUERY = /^\/(apartments|pay\/)/;

/**
 * The same page in another language, for the language switch. The query
 * (dates, guests, booking code) is kept on the pages that use it.
 */
export function pathInLang(pathname: string, search: string, to: SiteLang): string {
  const rest = restOf(pathname);
  const known = hebrewEquivalent(rest) !== null;
  const q = known && KEEP_QUERY.test(rest) && search && search !== "?" ? (search.startsWith("?") ? search : `?${search}`) : "";
  if (to === "he") return (hebrewEquivalent(rest) ?? "/") + q;
  return `/${to}${known ? rest : ""}` + q;
}
