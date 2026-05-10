"use client";
import { useState, useRef, useEffect } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const HE_DAYS   = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];
const fmt = (d?: Date) => d ? `${d.getDate()} ${HE_MONTHS[d.getMonth()]}` : null;

export default function SearchWidget() {
  const [range, setRange]     = useState<DateRange | undefined>();
  const [guests, setGuests]   = useState(2);
  const [open, setOpen]       = useState(false);
  const [picking, setPicking] = useState<"from" | "to" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const nights = range?.from && range?.to
    ? Math.round((range.to.getTime() - range.from.getTime()) / 86400000)
    : null;

  const openPicker = (which: "from" | "to") => {
    setPicking(which);
    setOpen(true);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (range?.from) params.set("checkin",  range.from.toISOString().split("T")[0]);
    if (range?.to)   params.set("checkout", range.to.toISOString().split("T")[0]);
    params.set("guests", String(guests));
    window.location.href = `/book?${params.toString()}`;
  };

  return (
    <div ref={ref} className="relative w-full max-w-3xl" dir="rtl">
      {/* Main bar */}
      <div
        className="bg-white flex items-stretch overflow-visible"
        style={{ borderRadius: "16px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
      >
        {/* Destination */}
        <div className="flex-1 px-6 py-5 text-right">
          <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">יעד</div>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
              <path d="M3 20l4-10 5 4 3.5-7L20 20H3Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-gray-900 font-semibold text-[15px]">Val Thorens</span>
          </div>
        </div>

        <div className="w-px bg-gray-200 my-4"/>

        {/* Departure date */}
        <button
          onClick={() => openPicker("from")}
          className={`flex-1 px-5 py-5 text-right transition-colors hover:bg-gray-50 ${open && picking === "from" ? "bg-blue-50/60" : ""}`}
        >
          <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">יציאה</div>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span className={`text-[15px] font-medium ${range?.from ? "text-gray-900" : "text-gray-400"}`}>
              {fmt(range?.from) ?? "הוסף תאריך"}
            </span>
          </div>
        </button>

        <div className="w-px bg-gray-200 my-4"/>

        {/* Return date */}
        <button
          onClick={() => openPicker("to")}
          className={`flex-1 px-5 py-5 text-right transition-colors hover:bg-gray-50 ${open && picking === "to" ? "bg-blue-50/60" : ""}`}
        >
          <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">חזרה</div>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span className={`text-[15px] font-medium ${range?.to ? "text-gray-900" : "text-gray-400"}`}>
              {fmt(range?.to) ?? "הוסף תאריך"}
            </span>
          </div>
          {nights && (
            <div className="text-xs text-blue-500 font-semibold mt-0.5">{nights} לילות</div>
          )}
        </button>

        <div className="w-px bg-gray-200 my-4"/>

        {/* Guests */}
        <div className="flex items-center px-4 py-5">
          <div>
            <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">אנשים</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 font-bold text-sm transition-colors">
                −
              </button>
              <span className="font-bold text-gray-900 w-4 text-center text-[15px]">{guests}</span>
              <button onClick={() => setGuests(Math.min(12, guests + 1))}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 font-bold text-sm transition-colors">
                +
              </button>
            </div>
          </div>
        </div>

        {/* Search button */}
        <div className="flex items-center px-3">
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-7 py-4 transition-all flex items-center gap-2 text-[15px]"
            style={{ borderRadius: "12px" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            חפש
          </button>
        </div>
      </div>

      {/* Calendar dropdown */}
      {open && (
        <div
          className="absolute top-full mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-5"
          style={{ right: "0", left: "0" }}
        >
          {/* Header tabs */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setPicking("from")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                picking === "from"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-100 text-gray-500 hover:border-gray-200"
              }`}
            >
              ✈️ יציאה — {fmt(range?.from) ?? "בחר תאריך"}
            </button>
            <button
              onClick={() => setPicking("to")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                picking === "to"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-100 text-gray-500 hover:border-gray-200"
              }`}
            >
              🏠 חזרה — {fmt(range?.to) ?? "בחר תאריך"}
            </button>
          </div>

          <DayPicker
            mode="range"
            selected={range}
            onSelect={(r) => {
              setRange(r);
              if (picking === "from" && r?.from) setPicking("to");
              if (r?.from && r?.to) { setOpen(false); setPicking(null); }
            }}
            disabled={{ before: new Date() }}
            numberOfMonths={2}
            showOutsideDays={false}
            formatters={{
              formatCaption:     (d) => `${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
              formatWeekdayName: (d) => HE_DAYS[d.getDay()],
            }}
            classNames={{
              months:       "flex gap-6",
              day_button:   "w-9 h-9 text-sm hover:bg-blue-50 rounded-lg transition-colors cursor-pointer",
              today:        "font-black !text-blue-600",
              selected:     "!bg-blue-600 !text-white !rounded-lg",
              range_middle: "!bg-blue-50 !text-blue-800",
              range_start:  "!bg-blue-600 !text-white !rounded-lg",
              range_end:    "!bg-blue-600 !text-white !rounded-lg",
              outside:      "opacity-0 pointer-events-none",
            }}
          />

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
            <button onClick={() => { setRange(undefined); setPicking("from"); }}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              נקה תאריכים
            </button>
            {nights ? (
              <span className="text-sm font-bold text-blue-600">{nights} לילות נבחרו ✓</span>
            ) : (
              <span className="text-sm text-gray-400">
                {picking === "from" ? "בחר תאריך יציאה" : "בחר תאריך חזרה"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
