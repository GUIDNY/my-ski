"use client";
import { useState, useRef, useEffect } from "react";
import { hasDirectFlight } from "@/lib/direct-flight-days";

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
    <div className="flex-1 min-w-0" dir="rtl">
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
              {!disabled && hasDirectFlight(date) && (
                <span className="absolute bottom-0 z-10 text-[8px] leading-none" title="בדרך כלל יש טיסה ישירה מתל אביב ליון ביום הזה">✈️</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────── */
const IconCal = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1652F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
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
  const [dealMode, setDealMode] = useState<"apartment" | "full">("apartment");
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
    const toIso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (from) p.set("checkin",  toIso(from));
    if (to)   p.set("checkout", toIso(to));
    p.set("guests", String(guests));
    if (dealMode === "full") p.set("deal", "full");
    window.location.href = `/search?${p.toString()}`;
  };

  const navBtn = (disabled: boolean, onClick: () => void, children: React.ReactNode) => (
    <button onClick={() => !disabled && onClick()}
      className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors
        ${disabled ? "border-gray-100 text-gray-300 cursor-not-allowed" : "border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"}`}>
      {children}
    </button>
  );

  const pill = (active: boolean) =>
    `min-h-[40px] rounded-xl border text-[15px] font-bold transition-colors ${
      active ? "border-[#0B1B33] bg-[#0B1B33] text-white" : "border-[#CBD5E3] bg-white text-[#0B1B33] hover:border-[#0B1B33]"}`;
  const stepBtn = "w-9 h-9 rounded-full border border-[#CBD5E3] flex items-center justify-center text-[#0B1B33] hover:border-[#1652F0] hover:text-[#1652F0] font-bold transition-colors";

  return (
    <div ref={ref} className="relative w-full max-w-5xl" dir="rtl">
      <form role="search" aria-label="חיפוש חופשה" onSubmit={e => { e.preventDefault(); handleSearch(); }}
        className="bg-white rounded-[22px] p-2.5 md:p-3 grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1.15fr_auto] gap-2 md:gap-2.5 text-right"
        style={{ boxShadow: "0 24px 60px rgba(8,18,38,0.35)" }}>

        {/* When */}
        <button type="button" onClick={() => openPicker(from && !to ? "to" : "from")} aria-expanded={open}
          className={`flex flex-col items-start justify-center gap-1 rounded-2xl border px-4 py-3 md:px-5 text-right transition-colors min-h-[64px] ${
            open ? "border-[#1652F0] bg-[#F5F8FF]" : "border-[#E3E9F2] hover:border-[#CBD5E3]"}`}>
          <span className="text-[13px] font-bold text-[#51607A]">מתי?</span>
          <span className="flex items-center gap-2 text-[16px] md:text-[17px] font-medium text-[#0B1B33]">
            <IconCal />
            {from && to
              ? <>{fmt(from)} – {fmt(to)}{nights ? <span className="text-[#51607A]"> · {nights} לילות</span> : null}</>
              : from ? <>{fmt(from)} – <span className="text-[#51607A]">בחרו חזרה</span></>
              : <span className="text-[#51607A]">בחרו תאריכים</span>}
          </span>
        </button>

        {/* Guests */}
        <div className="flex items-center justify-between md:flex-col md:items-start md:justify-center gap-1 rounded-2xl border border-[#E3E9F2] px-4 py-3 md:px-5 min-h-[64px]">
          <span className="text-[13px] font-bold text-[#51607A]">כמה אתם?</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="פחות אנשים" onClick={() => setGuests(g => Math.max(1, g - 1))} className={stepBtn}>−</button>
            <span className="font-bold text-[17px] text-[#0B1B33] w-6 text-center" aria-live="polite">{guests}</span>
            <button type="button" aria-label="יותר אנשים" onClick={() => setGuests(g => Math.min(12, g + 1))} className={stepBtn}>+</button>
          </div>
        </div>

        {/* What */}
        <div className="flex flex-col justify-center gap-1.5 rounded-2xl border border-[#E3E9F2] px-4 py-3 min-h-[64px]">
          <span className="text-[13px] font-bold text-[#51607A]">מה בא לכם?</span>
          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="סוג החיפוש">
            <button type="button" aria-pressed={dealMode === "full"} onClick={() => setDealMode("full")} className={pill(dealMode === "full")}>דיל שלם</button>
            <button type="button" aria-pressed={dealMode === "apartment"} onClick={() => setDealMode("apartment")} className={pill(dealMode === "apartment")}>רק דירה</button>
          </div>
        </div>

        <button type="submit"
          className="rounded-2xl bg-[#1652F0] hover:bg-[#0E3FC2] active:scale-[0.98] text-white font-bold text-[18px] md:text-[19px] px-7 min-h-[56px] md:min-h-[64px] flex items-center justify-center gap-2 transition-all">
          {dealMode === "full" ? "מצאו לי חבילה" : "מצאו לי דירה"}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        </button>
      </form>
      {dealMode === "full" && (
        <p className="text-center text-white/90 text-sm font-medium mt-3">דיל שלם: הדירה, הסעה מהשדה, סקי פס לשלושת העמקים, טיסה וכבודה</p>
      )}

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
              {navBtn(!canPrev, () => setBase(new Date(base.getFullYear(), base.getMonth() - 1, 1)), <IconChevR />)}
              <div className="flex-1" />
              {navBtn(!canNext, () => setBase(new Date(base.getFullYear(), base.getMonth() + 1, 1)), <IconChevL />)}
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

          <p className="text-[11px] text-gray-400 text-center mt-2">✈️ = בדרך כלל יש טיסה ישירה מתל אביב ליון ביום הזה</p>

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
