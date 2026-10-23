"use client";
import { useState } from "react";
import { MAX_NIGHTS, type Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import { WEEK_HEADS, addDays, dayOf, fmtDay, fmtLong, isoOf, monthName } from "@/lib/intl/format";

/*
 * Check-in / check-out picker, left to right, weeks from Monday: one month on
 * the phone, two side by side from 768px. Days outside [min, max] are off;
 * the check-out can be at most MAX_NIGHTS after the check-in.
 */

type Props = {
  lang: Lang;
  min: string;          // first possible check-in (YYYY-MM-DD)
  max: string;          // last possible check-out
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
};

const monthStart = (iso: string) => iso.slice(0, 8) + "01";
const nextMonth = (first: string) => { const d = dayOf(first); d.setMonth(d.getMonth() + 1, 1); return isoOf(d); };
const prevMonth = (first: string) => { const d = dayOf(first); d.setMonth(d.getMonth() - 1, 1); return isoOf(d); };

function cells(first: string): (string | null)[] {
  const d = dayOf(first);
  const pad = (d.getDay() + 6) % 7; // Monday first
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const out: (string | null)[] = Array(pad).fill(null);
  for (let i = 0; i < days; i++) out.push(addDays(first, i));
  while (out.length % 7) out.push(null);
  return out;
}

const Chev = ({ dir }: { dir: "l" | "r" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <polyline points={dir === "l" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
  </svg>
);

export default function DateRangeCalendar({ lang, min, max, from, to, onChange }: Props) {
  const t = DICT[lang].dates;
  const [picking, setPicking] = useState<"from" | "to">(from && !to ? "to" : "from");
  const [hover, setHover] = useState<string | null>(null);
  const [base, setBase] = useState(() => monthStart(from && from >= min && from <= max ? from : min));

  const lastCheckout = from && picking === "to" ? [max, addDays(from, MAX_NIGHTS)].sort()[0] : max;
  const off = (d: string) => {
    if (d < min) return true;
    if (picking === "to" && from) return d > lastCheckout; // a day before the check-in starts a new stay
    return d >= max;
  };

  const pick = (d: string) => {
    if (picking === "from" || !from || d <= from) {
      onChange(d, "");
      setPicking("to");
    } else {
      onChange(from, d);
      setPicking("from");
      setHover(null);
    }
  };

  const end = to || (picking === "to" && hover && from && hover > from ? hover : "");
  const second = nextMonth(base);
  const canPrev = base > monthStart(min);
  const canNext = base < monthStart(max);

  const grid = (first: string, extra = "") => (
    <div className={`flex-1 min-w-0 ${extra}`}>
      <p className="text-[16px] font-bold text-ink text-center mb-2 capitalize">
        {`${monthName(dayOf(first).getMonth(), lang)} ${dayOf(first).getFullYear()}`}
      </p>
      <div className="grid grid-cols-7" aria-hidden="true">
        {WEEK_HEADS[lang].map(h => <div key={h} className="h-8 flex items-center justify-center text-[13px] font-bold text-muted">{h}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells(first).map((d, i) => {
          if (!d) return <div key={i} className="h-11" />;
          const disabled = off(d);
          const isStart = d === from, isEnd = !!end && d === end;
          const between = !!from && !!end && d > from && d < end;
          const span = !!from && !!end;
          return (
            <button key={d} type="button" disabled={disabled}
              aria-label={fmtLong(d, lang)} aria-pressed={isStart || isEnd}
              onClick={() => pick(d)}
              // the range preview follows a mouse only: on a phone a tap sends a
              // "hover" first, and iOS drops the tap itself when the hover changes
              // the page (the day, or the next tap on the month arrows, needed two taps)
              onPointerEnter={e => { if (e.pointerType === "mouse" && !disabled) setHover(d); }}
              onPointerLeave={e => { if (e.pointerType === "mouse") setHover(null); }}
              className={`relative h-11 flex items-center justify-center touch-manipulation ${disabled ? "cursor-default" : "cursor-pointer"}`}>
              {between && <span className="absolute inset-y-1 inset-x-0 bg-accent-soft" />}
              {isStart && span && <span className="absolute inset-y-1 left-1/2 right-0 bg-accent-soft" />}
              {isEnd && span && <span className="absolute inset-y-1 left-0 right-1/2 bg-accent-soft" />}
              <span className={[
                "relative z-10 w-10 h-10 flex items-center justify-center rounded-full text-[15px] select-none transition-colors",
                disabled ? "text-line-strong" : "",
                !disabled && !isStart && !isEnd ? "text-ink font-medium hover:bg-soft-2" : "",
                isStart || isEnd ? "bg-accent text-white font-bold" : "",
              ].join(" ")}>
                {dayOf(d).getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const tab = (w: "from" | "to") => {
    const v = w === "from" ? from : to;
    const on = picking === w;
    return (
      <button type="button" onClick={() => { if (w === "from" || from) setPicking(w); }} aria-pressed={on}
        className={`min-h-[56px] px-3.5 rounded-xl border text-start transition-colors touch-manipulation ${on ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong"}`}>
        <span className="block text-[12px] font-bold text-muted">{w === "from" ? t.checkin : t.checkout}</span>
        <span className={`block text-[15px] ${v ? "text-ink font-bold" : "text-muted"}`}>{v ? fmtDay(v, lang) : t.addDate}</span>
      </button>
    );
  };

  return (
    // translate="no": a browser's page translation (Chrome's Google Translate) swaps
    // the text for its own copy, and React's later updates then go to text that is
    // no longer on the page: the month title stayed "November" while the days moved on
    <div className="flex flex-col gap-4" translate="no">
      <div className="grid grid-cols-2 gap-2">{tab("from")}{tab("to")}</div>
      <div className="relative">
        <button type="button" onClick={() => canPrev && setBase(prevMonth(base))} disabled={!canPrev} aria-label={t.prevMonth}
          className="absolute -top-2 left-0 z-10 w-11 h-11 flex items-center justify-center rounded-full border border-line-strong text-ink hover:border-ink transition-colors touch-manipulation disabled:border-line disabled:text-line-strong disabled:cursor-not-allowed">
          <Chev dir="l" />
        </button>
        <button type="button" onClick={() => canNext && setBase(nextMonth(base))} disabled={!canNext} aria-label={t.nextMonth}
          className="absolute -top-2 right-0 z-10 w-11 h-11 flex items-center justify-center rounded-full border border-line-strong text-ink hover:border-ink transition-colors touch-manipulation disabled:border-line disabled:text-line-strong disabled:cursor-not-allowed">
          <Chev dir="r" />
        </button>
        <div className="flex gap-6">
          {grid(base)}
          <div className="hidden md:block w-px bg-line" />
          {grid(second, "hidden md:block")}
        </div>
      </div>
      <p className="text-[14px] text-muted text-center" aria-live="polite">
        {/* both days chosen: say so (a new click starts a new stay) */}
        {from && to && picking === "from"
          ? `${fmtDay(from, lang)} – ${fmtDay(to, lang)} · ${DICT[lang].common.nights(Math.round((Date.parse(to) - Date.parse(from)) / 864e5))}`
          : picking === "from" ? t.pickCheckin : t.pickCheckout}
      </p>
    </div>
  );
}
