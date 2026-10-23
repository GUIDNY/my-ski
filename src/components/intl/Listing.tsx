"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyState, Skeleton, card, wrap } from "@/components/ui";
import { cardsFor, type ListItem } from "@/lib/intl/cards";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import { fmtRange } from "@/lib/intl/format";
import { parseSearch, type SearchState } from "@/lib/intl/search";
import ApartmentCard from "./ApartmentCard";
import Crumbs from "./Crumbs";
import { DatesChips, FilterGrid } from "./ListingControls";

type Props = { lang: Lang; items: ListItem[]; todayIso: string };

/**
 * The listing for one search. Rendered on the server for the plain page
 * (every apartment, clean links, prices from the season's lowest) and here in
 * the browser for ?checkin&checkout&guests.
 */
export function ListingView({ lang, items, todayIso, search, taken, checking }: Props & {
  search: SearchState; taken: string[] | null; checking: boolean;
}) {
  const t = DICT[lang];
  const cards = checking ? [] : cardsFor({ lang, items, search, taken, todayIso });
  const counts = {
    all: cards.length,
    own: cards.filter(c => c.kind === "own").length,
    agency: cards.filter(c => c.kind === "agency").length,
  };
  const summary = checking ? t.book.checking
    : search.hasDates ? t.list.countFor(cards.length, fmtRange(search.checkin, search.checkout, lang), t.common.guests(search.guests))
    : search.guestsSet ? t.list.countGuests(cards.length, t.common.guests(search.guests))
    : t.list.countAll(cards.length);

  return (
    <div className="flex-1 bg-white">
      <div className="bg-soft border-b border-line">
        <div className={`${wrap} pt-6 md:pt-8 pb-7 md:pb-9`}>
          <Crumbs lang={lang} items={[{ label: t.nav.home, href: `/${lang}` }, { label: t.nav.apartments }]} className="mb-3 md:mb-4" />
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className="font-display font-extrabold text-[32px] leading-[1.1] md:text-[44px] tracking-tight text-ink">{t.list.title}</h1>
            <p className="text-[16px] md:text-[17px] text-muted" aria-live="polite">{summary}</p>
          </div>
          <DatesChips lang={lang} todayIso={todayIso} checkin={search.checkin} checkout={search.checkout}
            guests={search.guests} hasDates={search.hasDates} guestsSet={search.guestsSet} />
          {search.datesError && (
            <p role="alert" className="mt-4 text-[15px] font-bold text-warn">
              {search.datesError === "tooLong" ? t.dates.tooLong : t.dates.invalid}
            </p>
          )}
        </div>
      </div>

      <div className={`${wrap} pt-6 md:pt-8 pb-16 md:pb-20`}>
        <h2 className="sr-only">{lang === "fr" ? "Les appartements" : "The apartments"}</h2>
        {!search.hasDates && cards.length > 0 && (
          <p className="mb-6 rounded-2xl bg-accent-soft border border-[#CFDAF7] px-4 py-3 text-[15px] text-ink">{t.list.pickPrompt}</p>
        )}
        {checking ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6" aria-hidden="true">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`${card} overflow-hidden`}>
                <Skeleton className="rounded-none h-[210px]" />
                <div className="p-5 flex flex-col gap-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-11 w-full mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : cards.length === 0 ? (
          <EmptyState title={search.hasDates ? t.list.emptyDates : t.list.empty} text={search.hasDates ? t.list.emptyDatesText : undefined} />
        ) : (
          // a new search starts on "all" again
          <FilterGrid key={`${search.checkin}|${search.checkout}|${search.guests}`} lang={lang} counts={counts}>
            {cards.map((c, i) => <ApartmentCard key={c.id} c={c} cta={t.common.viewApt} eager={i < 3} heading="h3" />)}
          </FilterGrid>
        )}
      </div>
    </div>
  );
}

/** Reads the search from the URL and checks the dates with /api/availability/blocked. */
export function ListingSearch(p: Props) {
  const sp = useSearchParams();
  const search = parseSearch(sp, p.todayIso);
  const key = search.hasDates ? `${search.checkin}|${search.checkout}` : "";
  const [blocked, setBlocked] = useState<{ key: string; ids: string[] | null } | null>(null);
  const known = !!key && blocked?.key === key;
  const { checkin, checkout } = search;

  useEffect(() => {
    if (!key || known) return;
    let cancelled = false;
    fetch(`/api/availability/blocked?checkin=${checkin}&checkout=${checkout}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setBlocked({ key, ids: Array.isArray(d?.blocked) ? d.blocked : null }); })
      .catch(() => { if (!cancelled) setBlocked({ key, ids: null }); });
    return () => { cancelled = true; };
  }, [key, known, checkin, checkout]);

  return <ListingView {...p} search={search} taken={known ? blocked!.ids : null} checking={!!key && !known} />;
}
