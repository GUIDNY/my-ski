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
        <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">תאריכים</div>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span className={`font-medium text-[15px] ${value?.from ? "text-gray-900" : "text-gray-400"}`}>
            {label}
          </span>
          {nights && (
            <span className="text-xs text-blue-500 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
              {nights} לילות
            </span>
          )}
        </div>
      </button>

      {open && (
        <div
          className="absolute top-full mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-4"
          style={{ right: "-120px" }}
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
              today:        "font-black !text-blue-600",
              selected:     "!bg-blue-600 !text-white rounded-lg",
              range_middle: "!bg-blue-50 !text-blue-900",
              range_start:  "!bg-blue-600 !text-white rounded-lg",
              range_end:    "!bg-blue-600 !text-white rounded-lg",
              day_button:   "w-9 h-9 text-sm hover:bg-blue-50 rounded-lg transition-colors cursor-pointer",
              months:       "flex gap-6",
              nav:          "flex items-center justify-between mb-2",
            }}
          />
          <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-2">
            <button onClick={() => { onChange(undefined); }} className="text-sm text-gray-400 hover:text-gray-600">נקה</button>
            {nights && <span className="text-sm font-bold text-blue-600">{nights} לילות נבחרו</span>}
          </div>
        </div>
      )}
    </div>
  );
}
