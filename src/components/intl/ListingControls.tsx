"use client";
import { useState, type ReactNode } from "react";
import { IconCalendar, IconUsers } from "@/components/Icons";
import { EmptyState, btn } from "@/components/ui";
import { MAX_SEARCH_GUESTS, SEASON_END, SEASON_START, type Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import { addDays, fmtRange, nightsBetween } from "@/lib/intl/format";
import { firstBookable, searchQuery } from "@/lib/intl/search";
import DatesDialog from "./DatesDialog";

const chipCls = "inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-white border border-line-strong text-[15px] font-bold text-ink hover:border-ink transition-colors";

/** A new search changes the URL only (the list is re-filtered here, no page load). */
export const goToSearch = (lang: Lang, s: { checkin?: string; checkout?: string; guests?: number }) =>
  window.history.pushState(null, "", `/${lang}/apartments${searchQuery(s)}`);

/** every Saturday-to-Saturday week of the season from today */
function seasonWeeks(todayIso: string): { ci: string; co: string }[] {
  const out: { ci: string; co: string }[] = [];
  for (let d = SEASON_START; addDays(d, 7) <= SEASON_END; d = addDays(d, 7)) if (d >= todayIso) out.push({ ci: d, co: addDays(d, 7) });
  return out;
}
const WEEK_L = {
  en: { pick: "Saturday to Saturday week", week: "Week", choose: "Choose a week", sat: "Sat." },
  fr: { pick: "Semaine samedi–samedi", week: "Semaine", choose: "Choisir une semaine", sat: "Sam." },
};

/** The dates and guests of the listing. */
export function DatesChips({ lang, todayIso, checkin, checkout, guests, hasDates, guestsSet }: {
  lang: Lang; todayIso: string; checkin: string; checkout: string; guests: number; hasDates: boolean; guestsSet: boolean;
}) {
  const t = DICT[lang];
  const [open, setOpen] = useState(false);
  return (
    <div role="group" aria-label={t.list.datesAria} translate="no" className="mt-5 flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={chipCls}>
        <span className="text-accent" aria-hidden="true"><IconCalendar size={16} /></span>
        {hasDates ? <>{fmtRange(checkin, checkout, lang)} · {t.common.nights(nightsBetween(checkin, checkout))}</> : t.dates.addDates}
      </button>
      {(() => {
        const wl = WEEK_L[lang], weeks = seasonWeeks(todayIso);
        const sel = weeks.find(w => w.ci === checkin && w.co === checkout);
        return (
          <label className={`relative ${chipCls} pe-9 cursor-pointer`}>
            <span className="text-accent" aria-hidden="true"><IconCalendar size={16} /></span>
            {sel ? `${wl.week} ${fmtRange(sel.ci, sel.co, lang)}` : wl.pick}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="absolute end-3.5 text-muted"><path d="M6 9l6 6 6-6" /></svg>
            <select aria-label={wl.pick} value={sel ? sel.ci : ""} className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={e => { const w = weeks.find(x => x.ci === e.target.value); if (w) goToSearch(lang, { checkin: w.ci, checkout: w.co, guests }); }}>
              <option value="" disabled>{wl.choose}</option>
              {weeks.map(w => <option key={w.ci} value={w.ci}>{wl.sat} {fmtRange(w.ci, w.co, lang)}</option>)}
            </select>
          </label>
        );
      })()}
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={chipCls}>
        <span className="text-accent" aria-hidden="true"><IconUsers size={16} /></span>
        {t.common.guests(guests)}
      </button>
      {hasDates && (
        <button type="button" onClick={() => goToSearch(lang, guestsSet ? { guests } : {})} className={`${btn.link} min-h-[44px] px-2 text-[15px]`}>
          {t.list.clearDates}
        </button>
      )}
      {open && (
        <DatesDialog lang={lang} min={firstBookable(todayIso)} max={SEASON_END}
          checkin={checkin} checkout={checkout} guests={guests} showGuests maxGuests={MAX_SEARCH_GUESTS} allowEmpty
          applyLabel={t.dates.search} onClose={() => setOpen(false)}
          onApply={(ci, co, g) => { setOpen(false); goToSearch(lang, { checkin: ci, checkout: co, guests: g }); }} />
      )}
    </div>
  );
}

type Filter = "all" | "own" | "agency";

/** Our apartments / weekly ones: shows or hides the cards (each has data-kind). */
export function FilterGrid({ lang, counts, children }: {
  lang: Lang; counts: Record<Filter, number>; children: ReactNode;
}) {
  const t = DICT[lang].list;
  const [filter, setFilter] = useState<Filter>("all");
  const both = counts.own > 0 && counts.agency > 0;
  const hide = filter === "own" ? "[&>[data-kind=agency]]:hidden" : filter === "agency" ? "[&>[data-kind=own]]:hidden" : "";
  return (
    <>
      {both && (
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label={t.filterAria}>
          {(["all", "own", "agency"] as const).map(f => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
              className={`min-h-[44px] px-4 rounded-full border text-[15px] font-bold transition-colors ${
                filter === f ? "bg-ink border-ink text-white" : "bg-white border-line-strong text-ink hover:border-ink"}`}>
              {t.filters[f]} <span className={filter === f ? "text-white/70" : "text-muted"}>{counts[f]}</span>
            </button>
          ))}
        </div>
      )}
      {counts[filter] === 0 && (
        <EmptyState title={t.empty} text={t.emptyFilter}
          action={<button type="button" onClick={() => setFilter("all")} className={btn.outline}>{t.showAll}</button>} />
      )}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 ${hide}`}>{children}</div>
    </>
  );
}
