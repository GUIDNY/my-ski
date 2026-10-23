import { DEFAULT_GUESTS, MAX_NIGHTS, MAX_SEARCH_GUESTS, SEASON_END, SEASON_START } from "./config";
import { isIsoDay, nightsBetween } from "./format";

/* ?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&guests=N, checked: dates inside the
   bookable season (from today), check-out after check-in, at most MAX_NIGHTS. */

export type SearchState = {
  checkin: string;
  checkout: string;
  guests: number;
  /** the URL asked for a number of guests */
  guestsSet: boolean;
  hasDates: boolean;
  /** dates were given but can't be used */
  datesError: "invalid" | "tooLong" | null;
};

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

const one = (p: Params, k: string): string => {
  const v = p instanceof URLSearchParams ? p.get(k) : p[k];
  return (Array.isArray(v) ? v[0] : v) ?? "";
};

/** The first day that can be booked as check-in. */
export const firstBookable = (todayIso: string) => (todayIso > SEASON_START ? todayIso : SEASON_START);

export function checkDates(checkin: string, checkout: string, todayIso: string): SearchState["datesError"] {
  if (!isIsoDay(checkin) || !isIsoDay(checkout) || checkout <= checkin) return "invalid";
  if (checkin < firstBookable(todayIso) || checkout > SEASON_END) return "invalid";
  if (nightsBetween(checkin, checkout) > MAX_NIGHTS) return "tooLong";
  return null;
}

export function parseSearch(p: Params, todayIso: string): SearchState {
  const ci = one(p, "checkin"), co = one(p, "checkout");
  const g = parseInt(one(p, "guests"), 10);
  const guestsSet = Number.isFinite(g) && g > 0;
  const guests = guestsSet ? Math.min(g, MAX_SEARCH_GUESTS) : DEFAULT_GUESTS;
  if (!ci && !co) return { checkin: "", checkout: "", guests, guestsSet, hasDates: false, datesError: null };
  const err = checkDates(ci, co, todayIso);
  return err
    ? { checkin: "", checkout: "", guests, guestsSet, hasDates: false, datesError: err }
    : { checkin: ci, checkout: co, guests, guestsSet, hasDates: true, datesError: null };
}

/** "?checkin=…&checkout=…&guests=…" (empty values left out). */
export function searchQuery(s: { checkin?: string; checkout?: string; guests?: number }): string {
  const q = new URLSearchParams();
  if (s.checkin && s.checkout) { q.set("checkin", s.checkin); q.set("checkout", s.checkout); }
  if (s.guests) q.set("guests", String(s.guests));
  const str = q.toString();
  return str ? `?${str}` : "";
}
