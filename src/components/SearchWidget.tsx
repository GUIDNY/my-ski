"use client";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import DateRangePicker from "./DateRangePicker";

export default function SearchWidget() {
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);

  const nights = range?.from && range?.to
    ? Math.round((range.to.getTime() - range.from.getTime()) / 86400000)
    : null;

  return (
    <div
      dir="rtl"
      className="bg-white w-full max-w-3xl flex items-stretch overflow-visible"
      style={{ borderRadius: "16px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
    >
      {/* Destination */}
      <button className="flex-1 px-6 py-5 text-right hover:bg-gray-50 transition-colors rounded-r-2xl">
        <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">יעד</div>
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
            <path d="M3 20l4.5-9L12 15l3.5-7L20 20H3Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-gray-900 font-semibold text-[15px]">Val Thorens</span>
        </div>
      </button>

      <div className="w-px bg-gray-200 my-4" />

      {/* Calendar date picker */}
      <div className="flex-[1.6] px-6 py-5 hover:bg-gray-50 transition-colors relative">
        <DateRangePicker value={range} onChange={setRange} />
        {nights && (
          <div className="absolute top-2 left-3 text-xs text-blue-500 font-semibold">
            {nights} לילות
          </div>
        )}
      </div>

      <div className="w-px bg-gray-200 my-4" />

      {/* Guests */}
      <div className="flex items-center px-4 py-5 hover:bg-gray-50 transition-colors gap-0">
        <div className="w-full">
          <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">אנשים</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 hover:text-gray-900 transition-colors font-bold text-sm">−</button>
            <span className="font-bold text-gray-900 text-[15px] w-5 text-center">{guests}</span>
            <button onClick={() => setGuests(Math.min(12, guests + 1))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 hover:text-gray-900 transition-colors font-bold text-sm">+</button>
          </div>
        </div>
      </div>

      {/* Search button */}
      <div className="flex items-center px-3">
        <button
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-7 py-4 transition-all flex items-center gap-2.5 text-[15px]"
          style={{ borderRadius: "12px" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          חפש
        </button>
      </div>
    </div>
  );
}
