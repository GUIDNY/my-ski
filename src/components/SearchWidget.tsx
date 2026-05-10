"use client";
import { useState, useRef, useEffect } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const HE_DAYS   = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];
const fmt = (d?: Date) => d ? `${d.getDate()} ${HE_MONTHS[d.getMonth()]}` : null;

// Blue-600 theme via CSS variables — keeps all rdp-* base styles intact
const RDP_VARS: React.CSSProperties = {
  "--rdp-accent-color":                   "#2563eb",
  "--rdp-accent-background-color":        "#eff6ff",
  "--rdp-range_middle-background-color":  "#eff6ff",
  "--rdp-range_middle-color":             "#1d4ed8",
  "--rdp-day_button-border-radius":       "8px",
  "--rdp-day-height":                     "38px",
  "--rdp-day-width":                      "38px",
  "--rdp-day_button-height":              "36px",
  "--rdp-day_button-width":               "36px",
  "--rdp-today-color":                    "#2563eb",
} as React.CSSProperties;

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

  const openPicker = (which: "from" | "to") => { setPicking(which); setOpen(true); };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (range?.from) params.set("checkin",  range.from.toISOString().split("T")[0]);
    if (range?.to)   params.set("checkout", range.to.toISOString().split("T")[0]);
    params.set("guests", String(guests));
    window.location.href = `/book?${params.toString()}`;
  };

  return (
    <div ref={ref} className="relative w-full max-w-3xl" dir="rtl">
      {/* ── Search bar ─────────────────────────────────────────── */}
      <div className="bg-white flex items-stretch rounded-2xl" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>

        {/* Destination */}
        <div className="flex-1 px-6 py-5 text-right">
          <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">יעד</div>
          <div className="flex items-center gap-2">
            {/* Mountain SVG */}
            <svg width="18" height="16" viewBox="0 0 36 30" fill="none">
              <polygon points="18,2 36,30 0,30" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round"/>
              <polygon points="18,10 26,30 10,30" fill="white" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="9" cy="24" r="2.5" fill="#93c5fd"/>
              <circle cx="28" cy="20" r="2" fill="#93c5fd"/>
            </svg>
            <span className="text-gray-900 font-bold text-sm">Val Thorens</span>
          </div>
        </div>

        <div className="w-px bg-gray-100 my-4" />

        {/* Departure */}
        <button
          onClick={() => openPicker("from")}
          className={`flex-1 px-5 py-5 text-right transition-colors hover:bg-gray-50 ${open && picking === "from" ? "bg-blue-50/60" : ""}`}
        >
          <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">יציאה</div>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span className={`text-sm font-semibold ${range?.from ? "text-gray-900" : "text-gray-400"}`}>
              {fmt(range?.from) ?? "הוסף תאריך"}
            </span>
          </div>
        </button>

        <div className="w-px bg-gray-100 my-4" />

        {/* Return */}
        <button
          onClick={() => openPicker("to")}
          className={`flex-1 px-5 py-5 text-right transition-colors hover:bg-gray-50 ${open && picking === "to" ? "bg-blue-50/60" : ""}`}
        >
          <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">חזרה</div>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span className={`text-sm font-semibold ${range?.to ? "text-gray-900" : "text-gray-400"}`}>
              {fmt(range?.to) ?? "הוסף תאריך"}
            </span>
          </div>
          {nights && <div className="text-[10px] text-blue-500 font-bold mt-0.5">{nights} לילות</div>}
        </button>

        <div className="w-px bg-gray-100 my-4" />

        {/* Guests */}
        <div className="flex items-center px-4 py-5">
          <div>
            <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">אנשים</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600 font-bold text-sm transition-colors">
                −
              </button>
              <span className="font-bold text-gray-900 w-5 text-center text-sm">{guests}</span>
              <button onClick={() => setGuests(Math.min(12, guests + 1))}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600 font-bold text-sm transition-colors">
                +
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center px-3">
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-7 py-4 rounded-xl transition-all flex items-center gap-2 text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            חפש
          </button>
        </div>
      </div>

      {/* ── Calendar dropdown ───────────────────────────────────── */}
      {open && (
        <div
          className="absolute top-full mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-6"
          style={{ right: 0, left: 0 }}
        >
          {/* Tabs */}
          <div className="flex gap-3 mb-5">
            {(["from", "to"] as const).map((which) => (
              <button key={which} onClick={() => setPicking(which)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                  picking === which
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-100 text-gray-500 hover:border-gray-200"
                }`}
              >
                {which === "from" ? "✈️" : "🏠"}{" "}
                {which === "from" ? "יציאה" : "חזרה"} —{" "}
                {fmt(which === "from" ? range?.from : range?.to) ?? "בחר תאריך"}
              </button>
            ))}
          </div>

          {/* DayPicker — themed via CSS vars, rdp-* classes kept intact */}
          <div style={RDP_VARS} dir="ltr">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={(r) => {
                setRange(r);
                if (picking === "from" && r?.from && !r?.to) setPicking("to");
                if (r?.from && r?.to) { setOpen(false); setPicking(null); }
              }}
              disabled={{ before: new Date() }}
              numberOfMonths={2}
              showOutsideDays={false}
              formatters={{
                formatCaption:     (d) => `${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
                formatWeekdayName: (d) => HE_DAYS[d.getDay()],
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
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
