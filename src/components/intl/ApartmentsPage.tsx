import { Suspense } from "react";
import type { Lang } from "@/lib/intl/config";
import { getApartments, getRules, todayIso } from "@/lib/intl/data";
import { buildItems } from "@/lib/intl/items";
import { isAgencyApt } from "@/lib/intl/pricing-view";
import { parseSearch } from "@/lib/intl/search";
import { loadWeekPrices } from "@/lib/week-prices-server";
import { ListingSearch, ListingView } from "./Listing";
import ApartmentsInfo from "./ApartmentsInfo";

/*
 * /en/apartments, /fr/apartments: a static page (regenerated every few
 * minutes), so the HTML already lists every apartment with a plain link to
 * its page and its price from the season's lowest. A search
 * (?checkin&checkout&guests) is applied on top in the browser: only the
 * apartments free for the dates (/api/availability/blocked) and big enough,
 * with the total for the stay from the same rules.
 */
export default async function ApartmentsPage({ lang }: { lang: Lang }) {
  const today = todayIso();
  const apartments = await getApartments();
  if (!apartments) throw new Error("apartments: database unavailable");
  const [rules, weekPrices] = await Promise.all([
    getRules(apartments.filter(a => !isAgencyApt(a)).map(a => a.id)),
    loadWeekPrices(),
  ]);
  const items = buildItems(lang, apartments, rules, today);
  const props = { lang, items, todayIso: today };
  return (
    <>
      <Suspense fallback={<ListingView {...props} search={parseSearch({}, today)} taken={null} checking={false} />}>
        <ListingSearch {...props} />
      </Suspense>
      <ApartmentsInfo lang={lang} weekPrices={weekPrices} apartments={items.map(x => ({ id: x.id, name: x.name }))} />
    </>
  );
}
