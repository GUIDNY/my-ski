import type { Lang } from "./config";

/*
 * Money and dates for the English and French pages. Written out by hand
 * (no Intl) so the server and the browser always produce the same text.
 * Dates are ISO days ("2027-01-16") read at local noon, like the rest of the
 * site (lib/pricing.ts), so a timezone never shifts a day.
 */

const MONTHS: Record<Lang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
};
const MONTHS_SHORT: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
};
const DAYS: Record<Lang, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
};
const DAYS_SHORT: Record<Lang, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  fr: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
};
/** Calendar column heads, weeks start on Monday. */
export const WEEK_HEADS: Record<Lang, string[]> = {
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  fr: ["lu", "ma", "me", "je", "ve", "sa", "di"],
};

export const isIsoDay = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s + "T12:00:00").getTime())
  && new Date(s + "T12:00:00").getDate() === Number(s.slice(8, 10));

export const dayOf = (iso: string) => new Date(iso + "T12:00:00");
export const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (iso: string, n: number) => { const d = dayOf(iso); d.setDate(d.getDate() + n); return isoOf(d); };
export const nightsBetween = (ci: string, co: string) => Math.round((dayOf(co).getTime() - dayOf(ci).getTime()) / 86400000);

export const monthName = (m: number, lang: Lang) => MONTHS[lang][m];

/** "Sat 16 Jan" / "sam. 16 janv." (with the year when asked). */
export function fmtDay(iso: string, lang: Lang, withYear = false): string {
  const d = dayOf(iso);
  const s = `${DAYS_SHORT[lang][d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[lang][d.getMonth()]}`;
  return withYear ? `${s} ${d.getFullYear()}` : s;
}

/** "Saturday 16 January 2027" / "samedi 16 janvier 2027" (screen readers, the calendar). */
export function fmtLong(iso: string, lang: Lang): string {
  const d = dayOf(iso);
  return `${DAYS[lang][d.getDay()]} ${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;
}

/** "16 Jan" / "16 janv." */
export function fmtShort(iso: string, lang: Lang): string {
  const d = dayOf(iso);
  return `${d.getDate()} ${MONTHS_SHORT[lang][d.getMonth()]}`;
}

/** "16–23 Jan" / "28 Nov – 5 Dec" (fr: "16–23 janv." / "28 nov. – 5 déc."). */
export function fmtRange(ci: string, co: string, lang: Lang): string {
  const a = dayOf(ci), b = dayOf(co);
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
    ? `${a.getDate()}–${b.getDate()} ${MONTHS_SHORT[lang][b.getMonth()]}`
    : `${fmtShort(ci, lang)} – ${fmtShort(co, lang)}`;
}

/** "Sat 16 Jan – Sat 23 Jan" */
export const fmtDayRange = (ci: string, co: string, lang: Lang, withYear = false) =>
  `${fmtDay(ci, lang)} – ${fmtDay(co, lang, withYear)}`;

const group = (digits: string, sep: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep);

/**
 * Euros, exact to the cent when there are cents: "€1,234" / "€1,234.50"
 * (en) and "1 234 €" / "1 234,50 €" (fr).
 */
export function fmtEur(n: number, lang: Lang): string {
  const cents = Math.round(Math.abs(n) * 100);
  const int = group(String(Math.floor(cents / 100)), lang === "fr" ? " " : ",");
  const frac = cents % 100 ? (lang === "fr" ? "," : ".") + String(cents % 100).padStart(2, "0") : "";
  const sign = n < 0 ? "−" : "";
  return lang === "fr" ? `${sign}${int}${frac} €` : `${sign}€${int}${frac}`;
}

/** "1.9%" / "1,9 %" */
export const fmtPct = (p: number, lang: Lang) => {
  const s = String(Math.round(p * 1000) / 10);
  return lang === "fr" ? `${s.replace(".", ",")} %` : `${s}%`;
};

/** "2,300" / "2 300" */
export const fmtInt = (n: number, lang: Lang) => group(String(Math.round(n)), lang === "fr" ? " " : ",");
