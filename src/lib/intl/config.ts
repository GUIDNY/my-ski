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

/**
 * The guides of /en/guide and /fr/guide, paired by topic: the address of
 * each one in English and in French, and the Hebrew guide (/guide/…) on the
 * same topic when the Hebrew site has one. Those three are the same page in
 * three languages (hreflang, the language switch). In the order of the
 * guide list. The texts are in lib/intl/guides/<key>.<lang>.json.
 */
export type GuidePair = { key: string; en: string; fr: string; he?: string };
export const GUIDE_PAIRS: readonly GuidePair[] = [
  { key: "when-to-go", en: "best-time-to-ski-in-val-thorens", fr: "quand-partir-a-val-thorens", he: "מתי-לנסוע-לואל-טורנס" },
  { key: "apartment-prices", en: "val-thorens-apartment-prices", fr: "prix-location-appartement-val-thorens" },
  { key: "ski-pass", en: "val-thorens-ski-pass-prices", fr: "prix-forfait-val-thorens", he: "מחיר-סקי-פס-ואל-טורנס" },
  { key: "where-to-stay", en: "where-to-stay-in-val-thorens", fr: "ou-loger-a-val-thorens", he: "איפה-לגור-בואל-טורנס" },
  { key: "getting-there", en: "how-to-get-to-val-thorens", fr: "comment-aller-a-val-thorens", he: "איך-מגיעים-לואל-טורנס-מישראל" },
  { key: "weather", en: "val-thorens-weather-and-snow", fr: "meteo-enneigement-val-thorens", he: "מזג-אוויר-ושלג-בואל-טורנס" },
  { key: "pistes", en: "val-thorens-pistes-and-ski-area", fr: "pistes-domaine-skiable-val-thorens", he: "מסלולי-סקי-בואל-טורנס" },
  { key: "apres-ski", en: "val-thorens-apres-ski", fr: "apres-ski-val-thorens", he: "אפרה-סקי-ומסעדות-בואל-טורנס" },
];

/** The pair of the guide with this address in this language (a Hebrew slug may still be percent-encoded). */
export function guidePair(lang: SiteLang, slug: string): GuidePair | undefined {
  let s = slug;
  try { s = decodeURIComponent(slug); } catch { /* not encoded */ }
  return GUIDE_PAIRS.find(p => p[lang] === s);
}

/** A guide's address in each language: /guide/<he> (percent-encoded), /en/guide/<en>, /fr/guide/<fr>. */
export function guidePath(p: GuidePair, lang: SiteLang): string | null {
  if (lang !== "he") return `/${lang}/guide/${p[lang]}`;
  return p.he ? encodeURI(`/guide/${p.he}`) : null;
}

/**
 * The language switch on a guide or a guide list (/guide, /guide/x,
 * /en/guide, /en/guide/x, /fr/…): the same guide in that language, or that
 * language's list of guides when it has no such guide. null for any other page.
 */
function guideInLang(pathname: string, to: SiteLang): string | null {
  let p = pathname;
  try { p = decodeURIComponent(pathname); } catch { /* not encoded */ }
  const m = p.match(/^(?:\/(en|fr))?\/guide(?:\/([^/]+))?\/?$/);
  if (!m) return null;
  const from: SiteLang = m[1] === "en" || m[1] === "fr" ? m[1] : "he";
  const pair = m[2] ? guidePair(from, m[2]) : undefined;
  return (pair && guidePath(pair, to)) ?? (to === "he" ? "/guide" : `/${to}/guide`);
}

/** The Hebrew page with the same content, or null when there is none (then the Hebrew home). */
export function hebrewEquivalent(rest: string): string | null {
  if (rest === "") return "/";
  if (["/apartments", "/terms", "/privacy", "/pay/success", "/pay/failure", "/guide"].includes(rest)) return rest;
  if (/^\/apartments\/[0-9a-f-]{36}$/i.test(rest)) return rest;
  return null;
}

const KEEP_QUERY = /^\/(apartments|pay\/)/;

/**
 * The same page in another language, for the language switch. The query
 * (dates, guests, booking code) is kept on the pages that use it.
 */
export function pathInLang(pathname: string, search: string, to: SiteLang): string {
  const guide = guideInLang(pathname, to);
  if (guide) return guide;
  const rest = restOf(pathname);
  const known = hebrewEquivalent(rest) !== null;
  const q = known && KEEP_QUERY.test(rest) && search && search !== "?" ? (search.startsWith("?") ? search : `?${search}`) : "";
  if (to === "he") return (hebrewEquivalent(rest) ?? "/") + q;
  return `/${to}${known ? rest : ""}` + q;
}
