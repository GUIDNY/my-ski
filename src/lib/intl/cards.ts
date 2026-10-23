import type { PricingRule } from "@/lib/pricing";
import { aptText, isAgency, typeWorthShowing } from "./apartment-text";
import type { Lang } from "./config";
import type { PublicApartment } from "./data";
import { DICT } from "./dict";
import { fmtDayRange, fmtEur } from "./format";
import { fromNight, fromWeek, quoteFor, upcomingWeeks } from "./pricing-view";
import { searchQuery, type SearchState } from "./search";

/*
 * The apartment cards of the home and listing pages, built on the server:
 * which apartments to show for a search (free for the dates, big enough,
 * agency ones only when one of their weeks holds the dates) and their price,
 * from lib/pricing.ts via pricing-view.ts.
 */

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
};

const FALLBACK_IMG = "/apt1.jpg";

export function buildCards(o: {
  lang: Lang;
  apartments: PublicApartment[];
  rules: Record<string, PricingRule[]> | null;   // our own apartments' rules (null: couldn't be read)
  search: SearchState;
  taken: string[] | null;                       // for the search dates (null: unknown)
  todayIso: string;
  ownOnly?: boolean;
}): CardData[] {
  const { lang, search, todayIso } = o;
  const t = DICT[lang].common;
  const takenSet = new Set(o.taken ?? []);
  const rows: { card: CardData; sort: number }[] = [];

  for (const a of o.apartments) {
    const agency = isAgency(a);
    if (o.ownOnly && agency) continue;
    if (search.guestsSet && a.max_guests && search.guests > a.max_guests) continue;
    if (search.hasDates && takenSet.has(a.id)) continue;

    const text = aptText(a, lang);
    const base = `/${lang}/apartments/${a.id}`;
    // the default listing links to the clean apartment URL; a search carries its dates and guests along
    const plain = search.guestsSet ? `${base}${searchQuery({ guests: search.guests })}` : base;
    let price: CardPrice = { text: t.priceOnPage };
    let href = plain;
    let sort = Number.MAX_SAFE_INTEGER;

    if (agency) {
      if (!upcomingWeeks(a, todayIso).length) continue; // nothing left to book
      if (search.hasDates) {
        const q = quoteFor(a, [], search.checkin, search.checkout, todayIso);
        if (!q || q.kind !== "week") continue;
        price = { amount: fmtEur(q.total, lang), unit: t.fullWeek, sub: fmtDayRange(q.checkin, q.checkout, lang) };
        href = `${base}${searchQuery({ checkin: q.checkin, checkout: q.checkout, guests: search.guests })}`;
        sort = q.total;
      } else {
        const min = fromWeek(a, todayIso);
        if (min !== null) { price = { prefix: t.from, amount: fmtEur(min, lang), unit: t.perWeek, sub: t.satToSat }; sort = min / 7; }
      }
    } else {
      const rules = o.rules?.[a.id];
      if (search.hasDates) {
        href = `${base}${searchQuery(search)}`;
        const q = rules ? quoteFor(a, rules, search.checkin, search.checkout, todayIso) : null;
        if (q && q.kind === "nights") {
          price = { amount: fmtEur(q.total, lang), unit: t.forNights(q.nights), sub: t.avgNight(fmtEur(q.avg, lang)) };
          sort = q.total;
        }
      } else if (rules) {
        const min = fromNight(a, rules, todayIso);
        if (min !== null) { price = { prefix: t.from, amount: fmtEur(min, lang), unit: t.perNight }; sort = min; }
      }
    }

    const meta = [
      typeWorthShowing(text),
      a.max_guests ? t.upTo(Number(a.max_guests)) : "",
      a.sqm ? t.sqm(Number(a.sqm)) : "",
    ].filter(Boolean).join(" · ");

    rows.push({
      sort,
      card: {
        id: a.id, kind: agency ? "agency" : "own", href,
        img: a.images?.[0] || FALLBACK_IMG,
        name: text.name,
        badge: agency ? t.agencyBadge : t.ourApt,
        meta: meta || t.valThorens,
        price,
      },
    });
  }

  // our own apartments first, then the agency ones; cheapest first in each
  rows.sort((x, y) => (x.card.kind === y.card.kind ? x.sort - y.sort : x.card.kind === "own" ? -1 : 1));
  return rows.map(r => r.card);
}
