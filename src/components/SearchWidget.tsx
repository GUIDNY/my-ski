"use client";
import { useState, useRef, useEffect } from "react";

const MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const DAYS   = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];

const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const fmt  = (d?: Date | null)  => d ? `${d.getDate()} ${MONTHS[d.getMonth()]}` : null;

const SEASON_START = new Date(2026, 11, 1);
const SEASON_END   = new Date(2027,  4, 31);

function gridDays(y: number, m: number): (Date | null)[] {
  const pad  = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const out: (Date | null)[] = Array(pad).fill(null);
  for (let d = 1; d <= days; d++) out.push(new Date(y, m, d));
  while (out.length % 7) out.push(null);
  return out;
}

function MonthGrid({
  year, month, from, to, hov, onEnter, onLeave, onClick, big,
}: {
  year: number; month: number;
  from: Date | null; to: Date | null; hov: Date | null;
  onEnter(d: Date): void; onLeave(): void; onClick(d: Date): void;
  big?: boolean;
}) {
  const cells = gridDays(year, month);
  const eff = (() => {
    if (!from) return { s: null, e: null };
    if (to)    return from <= to ? { s: from, e: to } : { s: to, e: from };
    if (!hov)  return { s: from, e: null };
    return from <= hov ? { s: from, e: hov } : { s: hov, e: from };
  })();

  const cell = big ? "h-12" : "h-10";
  const circle = big ? "w-10 h-10 text-base" : "w-9 h-9 text-sm";

  return (
    <div className="flex-1 min-w-0" dir="ltr">
      <p className="text-sm font-bold text-gray-900 text-center mb-3">{MONTHS[month]} {year}</p>
      <div className="grid grid-cols-7">
        {DAYS.map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className={cell} />;
          const disabled = date < SEASON_START || date > SEASON_END;
          const isStart  = !!(eff.s && same(date, eff.s));
          const isEnd    = !!(eff.e && same(date, eff.e));
          const between  = !!(eff.s && eff.e && date > eff.s && date < eff.e);
          const hasRange = !!(eff.s && eff.e);

          return (
            <div key={i}
              className={`relative ${cell} flex items-center justify-center ${disabled ? "pointer-events-none" : "cursor-pointer"}`}
              onMouseEnter={() => !disabled && onEnter(date)}
              onMouseLeave={onLeave}
              onClick={() => !disabled && onClick(date)}
            >
              {between   && <div className="absolute top-1.5 bottom-1.5 left-0 right-0 bg-blue-50" />}
              {isStart && hasRange && <div className="absolute top-1.5 bottom-1.5 left-1/2 right-0 bg-blue-50" />}
              {isEnd   && hasRange && <div className="absolute top-1.5 bottom-1.5 left-0 right-1/2 bg-blue-50" />}
              <div className={[
                `relative z-10 ${circle} flex items-center justify-center rounded-full select-none transition-colors font-medium`,
                disabled ? "text-gray-300" : "",
                !disabled && !isStart && !isEnd ? "hover:bg-blue-100 hover:text-blue-700 text-gray-800" : "",
                isStart || isEnd ? "bg-blue-600 text-white font-bold shadow" : "",
              ].join(" ")}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────── */
const IconMountain = () => (
  <svg width="16" height="14" viewBox="0 0 32 28" fill="none">
    <polygon points="16,2 30,26 2,26" fill="#dbeafe" stroke="#2563eb" strokeWidth="2.2" strokeLinejoin="round"/>
    <polygon points="16,10 23,26 9,26" fill="white" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);
const IconCal = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const IconChevL = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const IconChevR = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
);

/* ── Main widget ───────────────────────────────────────────── */
export default function SearchWidget() {
  const [from,    setFrom]    = useState<Date | null>(null);
  const [to,      setTo]      = useState<Date | null>(null);
  const [hov,     setHov]     = useState<Date | null>(null);
  const [guests,  setGuests]  = useState(2);
  const [open,    setOpen]    = useState(false);
  const [picking, setPicking] = useState<"from" | "to">("from");
  const [base,    setBase]    = useState(() => new Date(2026, 11, 1));
  const ref = useRef<HTMLDivElement>(null);

  const next    = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  const nights  = from && to ? Math.round((to.getTime() - from.getTime()) / 86400000) : null;
  const canPrev = base > SEASON_START;
  const canNext = next < new Date(SEASON_END.getFullYear(), SEASON_END.getMonth(), 1);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const openPicker = (w: "from" | "to") => { setPicking(w); setOpen(true); };

  const handleDay = (date: Date) => {
    if (picking === "from" || !from) {
      setFrom(date); setTo(null); setPicking("to");
    } else {
      const [a, b] = date < from ? [date, from] : [from, date];
      setFrom(a); setTo(b); setOpen(false); setPicking("from");
    }
  };

  const handleSearch = () => {
    const p = new URLSearchParams();
    if (from) p.set("checkin",  from.toISOString().split("T")[0]);
    if (to)   p.set("checkout", to.toISOString().split("T")[0]);
    p.set("guests", String(guests));
    window.location.href = `/search?${p.toString()}`;
  };

  const navBtn = (disabled: boolean, onClick: () => void, children: React.ReactNode) => (
    <button onClick={() => !disabled && onClick()}
      className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors
        ${disabled ? "border-gray-100 text-gray-300 cursor-not-allowed" : "border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"}`}>
      {children}
    </button>
  );

  return (
    <div ref={ref} className="relative w-full max-w-3xl" dir="rtl">

      {/* ══ DESKTOP search bar (md+) ══════════════════════════ */}
      <div className="hidden md:flex bg-white items-stretch rounded-2xl" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div className="flex-1 px-6 py-5 text-right">
          <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">יעד</div>
          <div className="flex items-center gap-2">
            <IconMountain />
            <span className="text-gray-900 font-bold text-sm">Val Thorens</span>
          </div>
        </div>
        <div className="w-px bg-gray-100 my-4" />
        <button onClick={() => openPicker("from")}
          className={`flex-1 px-5 py-5 text-right transition-colors hover:bg-gray-50 ${open && picking === "from" ? "bg-blue-50/60" : ""}`}>
          <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">יציאה</div>
          <div className="flex items-center gap-2">
            <IconCal />
            <span className={`text-sm font-semibold ${from ? "text-gray-900" : "text-gray-400"}`}>{fmt(from) ?? "הוסף תאריך"}</span>
          </div>
        </button>
        <div className="w-px bg-gray-100 my-4" />
        <button onClick={() => openPicker("to")}
          className={`flex-1 px-5 py-5 text-right transition-colors hover:bg-gray-50 ${open && picking === "to" ? "bg-blue-50/60" : ""}`}>
          <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">חזרה</div>
          <div className="flex items-center gap-2">
            <IconCal />
            <span className={`text-sm font-semibold ${to ? "text-gray-900" : "text-gray-400"}`}>{fmt(to) ?? "הוסף תאריך"}</span>
          </div>
          {nights && <div className="text-[10px] text-blue-500 font-bold mt-0.5">{nights} לילות</div>}
        </button>
        <div className="w-px bg-gray-100 my-4" />
        <div className="flex items-center px-4 py-5">
          <div>
            <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">אנשים</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setGuests(g => Math.max(1, g - 1))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600 font-bold text-sm transition-colors">−</button>
              <span className="font-bold text-gray-900 w-5 text-center text-sm">{guests}</span>
              <button onClick={() => setGuests(g => Math.min(12, g + 1))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600 font-bold text-sm transition-colors">+</button>
            </div>
          </div>
        </div>
        <div className="flex items-center px-3">
          <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-7 py-4 rounded-xl transition-all flex items-center gap-2 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            חפש
          </button>
        </div>
      </div>

      {/* ══ MOBILE search bar (< md) ══════════════════════════ */}
      <div className="md:hidden bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        {/* Destination row */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
          <IconMountain />
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">יעד</div>
            <div className="text-sm font-bold text-gray-900">Val Thorens</div>
          </div>
        </div>
        {/* Dates row */}
        <div className="grid grid-cols-2 border-b border-gray-100">
          <button onClick={() => openPicker("from")}
            className={`px-5 py-3.5 text-right border-l border-gray-100 transition-colors ${open && picking === "from" ? "bg-blue-50" : "hover:bg-gray-50"}`}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">יציאה</div>
            <div className="flex items-center gap-1.5">
              <IconCal />
              <span className={`text-sm font-semibold ${from ? "text-gray-900" : "text-gray-400"}`}>{fmt(from) ?? "בחר"}</span>
            </div>
          </button>
          <button onClick={() => openPicker("to")}
            className={`px-5 py-3.5 text-right transition-colors ${open && picking === "to" ? "bg-blue-50" : "hover:bg-gray-50"}`}>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">חזרה</div>
            <div className="flex items-center gap-1.5">
              <IconCal />
              <span className={`text-sm font-semibold ${to ? "text-gray-900" : "text-gray-400"}`}>{fmt(to) ?? "בחר"}</span>
            </div>
            {nights && <div className="text-[10px] text-blue-500 font-bold mt-0.5">{nights} לילות</div>}
          </button>
        </div>
        {/* Guests + Search */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">אנשים</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setGuests(g => Math.max(1, g - 1))} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600 font-bold transition-colors">−</button>
              <span className="font-bold text-gray-900 w-6 text-center">{guests}</span>
              <button onClick={() => setGuests(g => Math.min(12, g + 1))} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600 font-bold transition-colors">+</button>
            </div>
          </div>
          <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            חפש
          </button>
        </div>
      </div>

      {/* ══ Calendar dropdown ══════════════════════════════════ */}
      {open && (
        <div className="absolute top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-4 md:p-6" style={{ right: 0, left: 0 }}>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {(["from","to"] as const).map(w => (
              <button key={w} onClick={() => setPicking(w)}
                className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all border-2 ${
                  picking === w ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-500 hover:border-gray-200"
                }`}>
                {w === "from" ? "✈️ יציאה" : "🏠 חזרה"} — {fmt(w === "from" ? from : to) ?? "בחר"}
              </button>
            ))}
          </div>

          {/* Navigation + grids */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              {navBtn(canPrev, () => setBase(new Date(base.getFullYear(), base.getMonth() - 1, 1)), <IconChevR />)}
              <div className="flex-1" />
              {navBtn(canNext, () => setBase(new Date(base.getFullYear(), base.getMonth() + 1, 1)), <IconChevL />)}
            </div>

            {/* Desktop: 2 months | Mobile: 1 month */}
            <div className="flex gap-4">
              <MonthGrid year={base.getFullYear()} month={base.getMonth()}
                from={from} to={to} hov={picking === "to" ? hov : null}
                onEnter={setHov} onLeave={() => setHov(null)} onClick={handleDay}
                big={true}
              />
              <div className="hidden md:block w-px bg-gray-100 self-stretch" />
              <div className="hidden md:block flex-1">
                <MonthGrid year={next.getFullYear()} month={next.getMonth()}
                  from={from} to={to} hov={picking === "to" ? hov : null}
                  onEnter={setHov} onLeave={() => setHov(null)} onClick={handleDay}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
            <button onClick={() => { setFrom(null); setTo(null); setPicking("from"); }}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors">נקה תאריכים</button>
            {nights
              ? <span className="text-sm font-bold text-blue-600">{nights} לילות ✓</span>
              : <span className="text-sm text-gray-400">{picking === "from" ? "בחר תאריך יציאה" : "בחר תאריך חזרה"}</span>
            }
          </div>
        </div>
      )}
    </div>
  );
}
