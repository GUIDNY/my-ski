"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCalendar } from "@/components/Icons";
import { DEFAULT_GUESTS, MAX_SEARCH_GUESTS, SEASON_END, type Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import { fmtRange, nightsBetween } from "@/lib/intl/format";
import { firstBookable, searchQuery } from "@/lib/intl/search";
import DatesDialog from "./DatesDialog";
import Stepper from "./Stepper";

const IcoArrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

/** The home page search: dates and guests, then the free apartments with their price. */
export default function SearchBar({ lang, todayIso }: { lang: Lang; todayIso: string }) {
  const t = DICT[lang];
  const router = useRouter();
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState(DEFAULT_GUESTS);
  const [open, setOpen] = useState(false);
  const nights = checkin && checkout ? nightsBetween(checkin, checkout) : 0;

  const go = (ci = checkin, co = checkout, g = guests) =>
    router.push(`/${lang}/apartments${searchQuery({ checkin: ci, checkout: co, guests: g })}`);

  return (
    <div className="w-full max-w-[880px]">
      <form role="search" aria-label={t.home.searchAria} onSubmit={e => { e.preventDefault(); go(); }}
        className="bg-white rounded-[22px] p-2.5 md:p-3 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_auto] gap-2 md:gap-2.5 text-start"
        style={{ boxShadow: "0 24px 60px rgba(8,18,38,0.35)" }}>
        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
          className="flex flex-col items-start justify-center gap-1 rounded-2xl border border-line hover:border-line-strong px-4 py-3 md:px-5 min-h-[64px] text-start transition-colors">
          <span className="text-[13px] font-bold text-muted">{t.dates.checkin} – {t.dates.checkout}</span>
          <span className="flex items-center gap-2 text-[16px] md:text-[17px] font-medium text-ink">
            <IconCalendar size={18} className="text-accent shrink-0" />
            {checkin && checkout
              ? <>{fmtRange(checkin, checkout, lang)}<span className="text-muted"> · {t.common.nights(nights)}</span></>
              : <span className="text-muted">{t.dates.addDates}</span>}
          </span>
        </button>

        <div className="flex items-center justify-between md:flex-col md:items-start md:justify-center gap-1 rounded-2xl border border-line px-4 py-2 md:px-5 min-h-[64px]">
          <span className="text-[13px] font-bold text-muted">{t.common.guestsLabel}</span>
          <Stepper lang={lang} value={guests} onChange={setGuests} max={MAX_SEARCH_GUESTS} label={t.common.guestsLabel} />
        </div>

        <button type="submit"
          className="rounded-2xl bg-accent hover:bg-accent-hover active:scale-[0.98] text-white font-bold text-[18px] px-7 min-h-[56px] md:min-h-[64px] flex items-center justify-center gap-2 transition-all">
          {t.dates.search} <IcoArrow />
        </button>
      </form>

      {open && (
        <DatesDialog lang={lang} min={firstBookable(todayIso)} max={SEASON_END}
          checkin={checkin} checkout={checkout} guests={guests} allowEmpty applyLabel={t.dates.search}
          onClose={() => setOpen(false)}
          onApply={(ci, co) => { setCheckin(ci); setCheckout(co); setOpen(false); go(ci, co, guests); }} />
      )}
    </div>
  );
}
