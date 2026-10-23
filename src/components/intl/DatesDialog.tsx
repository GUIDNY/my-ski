"use client";
import { useState } from "react";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import { nightsBetween } from "@/lib/intl/format";
import Dialog from "./Dialog";
import DateRangeCalendar from "./DateRangeCalendar";
import Stepper from "./Stepper";

/** "When are you coming?": the calendar, optionally the number of guests, and Apply. */
export default function DatesDialog({
  lang, min, max, checkin, checkout, guests, showGuests = false, maxGuests = 12, allowEmpty = false,
  applyLabel, onApply, onClose,
}: {
  lang: Lang; min: string; max: string; checkin: string; checkout: string; guests: number;
  showGuests?: boolean; maxGuests?: number; allowEmpty?: boolean; applyLabel?: string;
  onApply: (checkin: string, checkout: string, guests: number) => void; onClose: () => void;
}) {
  const t = DICT[lang];
  const [from, setFrom] = useState(checkin);
  const [to, setTo] = useState(checkout);
  const [g, setG] = useState(Math.min(Math.max(guests, 1), maxGuests));
  const nights = from && to ? nightsBetween(from, to) : 0;
  const ready = (from && to) || (allowEmpty && !from && !to);

  return (
    <Dialog lang={lang} title={t.dates.title} sub={t.dates.season} onClose={onClose} wide
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => { setFrom(""); setTo(""); }}
            className="min-h-[44px] px-1 text-[15px] font-medium text-muted hover:text-ink underline-offset-4 hover:underline">
            {t.dates.clear}
          </button>
          <div className="flex items-center gap-3">
            {nights > 0 && <span className="text-[15px] font-bold text-ink">{t.dates.selected(nights)}</span>}
            <button type="button" disabled={!ready} onClick={() => onApply(from, to, g)}
              className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-[14px] bg-accent hover:bg-accent-hover text-white font-bold text-[16px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {applyLabel ?? t.dates.apply}
            </button>
          </div>
        </div>
      }>
      <div className="flex flex-col gap-4">
        {showGuests && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-line px-4 py-2.5">
            <span className="text-[15px] font-bold text-ink">{t.common.guestsLabel}</span>
            <Stepper lang={lang} value={g} onChange={setG} max={maxGuests} label={t.common.guestsLabel} />
          </div>
        )}
        <DateRangeCalendar lang={lang} min={min} max={max} from={from} to={to}
          onChange={(a, b) => { setFrom(a); setTo(b); }} />
      </div>
    </Dialog>
  );
}
