"use client";
import { useState, useRef, useEffect } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";

type Props = {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
};

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const HE_DAYS  = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];

const fmt = (d?: Date) =>
  d ? `${d.getDate()} ${HE_MONTHS[d.getMonth()]}` : null;

export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const nights =
    value?.from && value?.to
      ? Math.round((value.to.getTime() - value.from.getTime()) / 86400000)
      : null;

  const label = value?.from
    ? value.to
      ? `${fmt(value.from)} — ${fmt(value.to)}`
      : fmt(value.from)!
    : "בחר תאריכים";

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="w-full text-right">
        <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--stone-soft)" }}>תאריכים</div>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--stone-soft)" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span className="font-medium text-[15px]" style={{ color: value?.from ? "var(--charcoal)" : "var(--stone-soft)" }}>
            {label}
          </span>
          {nights && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: "var(--gold-deep)", background: "var(--gold-wash)" }}>
              {nights} לילות
            </span>
          )}
        </div>
      </button>

      {open && (
        <div
          className="absolute top-full mt-3 rounded z-50 p-4"
          style={{ right: "-120px", background: "var(--paper)", border: "1px solid rgba(28,27,23,0.08)", boxShadow: "0 24px 48px -24px rgba(11,15,20,0.35)" }}
        >
          <DayPicker
            mode="range"
            selected={value}
            onSelect={(r) => {
              onChange(r);
              if (r?.from && r?.to) setOpen(false);
            }}
            disabled={{ before: new Date() }}
            numberOfMonths={2}
            formatters={{
              formatCaption: (d) => `${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
              formatWeekdayName: (d) => HE_DAYS[d.getDay()],
            }}
            classNames={{
              today:        "font-black !text-[var(--gold-deep)]",
              selected:     "!bg-[var(--gold)] !text-[var(--ink)] rounded-lg",
              range_middle: "!bg-[var(--gold-wash)] !text-[var(--charcoal)]",
              range_start:  "!bg-[var(--gold)] !text-[var(--ink)] rounded-lg",
              range_end:    "!bg-[var(--gold)] !text-[var(--ink)] rounded-lg",
              day_button:   "w-9 h-9 text-sm hover:bg-[var(--gold-wash)] rounded-lg transition-colors cursor-pointer",
              months:       "flex gap-6",
              nav:          "flex items-center justify-between mb-2",
            }}
          />
          <div className="flex justify-between items-center pt-3 mt-2" style={{ borderTop: "1px solid rgba(28,27,23,0.08)" }}>
            <button onClick={() => { onChange(undefined); }} className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--stone-soft)" }}>נקה</button>
            {nights && <span className="text-sm font-bold" style={{ color: "var(--gold-deep)" }}>{nights} לילות נבחרו</span>}
          </div>
        </div>
      )}
    </div>
  );
}
