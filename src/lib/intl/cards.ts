import type { PricingRule } from "@/lib/pricing";
import type { Lang } from "./config";
import { DICT } from "./dict";
import { fmtDayRange, fmtEur } from "./format";
import { fromNight, fromWeek, quoteFor, type Week } from "./pricing-view";
import { searchQuery, type SearchState } from "./search";

/*
 * The apartment cards of the home and listing pages. The server prepares one
 * ListItem per apartment (texts, photo, the data its price needs); cardsFor()
 * then picks and prices the cards for a search, on the server for the plain
 * page and in the browser for ?checkin&checkout&guests (so the listing can be
 * a static page): free for the dates, big enough, agency apartments only when
 * one of their weeks holds the dates. Prices only via pricing-view.ts.
 */

export type ListItem = {
  id: string;
  kind: "own" | "agency";
  name: string;
  meta: string;
  img: string;
  badge: string;
  maxGuests: number | null;
  price_per_night: number;
  weeks: Week[];                  // agency: the free weeks ahead
  rules: PricingRule[] | null;    // own: pricing rules with the Airbnb calendar (null: couldn't be read)
  facts: CardFacts;
};

/** what the listing's filters and the card's facts row read */
export type CardFacts = {
  bed: string;                    // "studio" | "1" | "2" | "3" | "4" (4+) | "" unknown
  beds: number;                   // bedrooms (0: studio or unknown)
  residence: string | null;       // the building
  quarter: string | null;         // the village quarter (lib/residences Q)
  sqm: number | null;
  code: string | null;            // weekly apartments: their reference
  amen: string[];                 // translated amenities only
};

export type CardPrice =
  | { prefix?: string; amount: string; unit?: string; sub?: string }
  | { text: string };

export type CardData = {
  id: string;
  kind: "own" | "agency";
  href: string;
  img: string;
  name: string;
  badge: string;
  meta: string;
  price: CardPrice;
  guests: number | null;
  facts: CardFacts;
  /** the card's price as a week (nightly × 7), for sorting and the price filter; Infinity: unknown */
  week: number;
};

export function cardsFor(o: {
  lang: Lang;
  items: ListItem[];
  search: SearchState;
  taken: string[] | null;       // for the search dates (null: unknown)
  todayIso: string;
}): CardData[] {
  const { lang, search, todayIso } = o;
  const t = DICT[lang].common;
  const takenSet = new Set(o.taken ?? []);
  const rows: { card: CardData; sort: number }[] = [];

  for (const it of o.items) {
    if (search.guestsSet && it.maxGuests && search.guests > it.maxGuests) continue;
    if (search.hasDates && takenSet.has(it.id)) continue;
    const priceApt = { id: it.id, source: it.kind === "agency" ? "la_cime" : null, price_per_night: it.price_per_night, available_weeks: it.weeks };
    const base = `/${lang}/apartments/${it.id}`;
    // the plain listing links to the clean apartment URL; a search carries its dates and guests along
    let href = search.guestsSet ? `${base}${searchQuery({ guests: search.guests })}` : base;
    let price: CardPrice = { text: t.priceOnPage };
    let sort = Number.MAX_SAFE_INTEGER;
    let week = Infinity;

    if (it.kind === "agency") {
      if (!it.weeks.length) continue; // nothing left to book
      if (search.hasDates) {
        const q = quoteFor(priceApt, [], search.checkin, search.checkout, todayIso);
        if (!q || q.kind !== "week") continue;
        price = { amount: fmtEur(q.total, lang), unit: t.fullWeek, sub: fmtDayRange(q.checkin, q.checkout, lang) };
        href = `${base}${searchQuery({ checkin: q.checkin, checkout: q.checkout, guests: search.guests })}`;
        sort = q.total; week = q.total;
      } else {
        const min = fromWeek(priceApt, todayIso);
        if (min !== null) { price = { prefix: t.from, amount: fmtEur(min, lang), unit: t.perWeek, sub: t.satToSat }; sort = min; week = min; }
      }
    } else if (search.hasDates) {
      href = `${base}${searchQuery(search)}`;
      const q = it.rules ? quoteFor(priceApt, it.rules, search.checkin, search.checkout, todayIso) : null;
      if (q && q.kind === "nights") {
        price = { amount: fmtEur(q.total, lang), unit: t.forNights(q.nights), sub: t.avgNight(fmtEur(q.avg, lang)) };
        sort = q.total; week = q.avg * 7;
      }
    } else if (it.rules) {
      const min = fromNight(priceApt, it.rules, todayIso);
      if (min !== null) { price = { prefix: t.from, amount: fmtEur(min, lang), unit: t.perNight }; sort = min; week = min * 7; }
    }

    rows.push({ sort, card: { id: it.id, kind: it.kind, href, img: it.img, name: it.name, badge: it.badge, meta: it.meta, price, guests: it.maxGuests, facts: it.facts, week } });
  }

  // our own apartments first, then the agency ones; cheapest first in each
  rows.sort((x, y) => (x.card.kind === y.card.kind ? x.sort - y.sort : x.card.kind === "own" ? -1 : 1));
  return rows.map(r => r.card);
}
