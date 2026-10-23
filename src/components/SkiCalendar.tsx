"use client";
import { useState } from "react";
import { hasDirectFlight } from "@/lib/direct-flight-days";

const MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const DAYS   = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];

export const SEASON_START = new Date(2026, 10, 21); // Val Thorens lifts open 21.11.2026
export const SEASON_END   = new Date(2027,  4, 31); // May 2027

const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function gridDays(y: number, m: number): (Date | null)[] {
  const pad  = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const out: (Date | null)[] = Array(pad).fill(null);
  for (let d = 1; d <= days; d++) out.push(new Date(y, m, d));
  while (out.length % 7) out.push(null);
  return out;
}

/** small plane under a day: usually a direct flight from Tel Aviv that day */
const PlaneDot = ({ className = "" }: { className?: string }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
  </svg>
);

function MonthGrid({ year, month, from, to, hov, onEnter, onLeave, onClick }: {
  year: number; month: number;
  from: Date | null; to: Date | null; hov: Date | null;
  onEnter(d: Date): void; onLeave(): void; onClick(d: Date): void;
}) {
  const cells = gridDays(year, month);
  const eff = (() => {
    if (!from) return { s: null, e: null };
    if (to)    return from <= to ? { s: from, e: to } : { s: to, e: from };
    if (!hov)  return { s: from, e: null };
    return from <= hov ? { s: from, e: hov } : { s: hov, e: from };
  })();

  return (
    <div className="flex-1 min-w-0" dir="rtl">
      <p className="text-[16px] font-bold text-ink text-center mb-2">{MONTHS[month]} {year}</p>
      <div className="grid grid-cols-7" aria-hidden="true">
        {DAYS.map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-[13px] font-bold text-muted">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="h-11" />;
          const disabled = date < SEASON_START || date > SEASON_END;
          const isStart  = !!(eff.s && same(date, eff.s));
          const isEnd    = !!(eff.e && same(date, eff.e));
          const between  = !!(eff.s && eff.e && date > eff.s && date < eff.e);
          const hasRange = !!(eff.s && eff.e);
          const flight   = !disabled && hasDirectFlight(date);

          return (
            <button key={i} type="button" disabled={disabled}
              aria-label={`${date.getDate()} ב${MONTHS[date.getMonth()]}${flight ? ", בדרך כלל יש טיסה ישירה" : ""}`}
              aria-pressed={isStart || isEnd}
              className={`relative h-11 flex items-center justify-center ${disabled ? "cursor-default" : "cursor-pointer"}`}
              onMouseEnter={() => !disabled && onEnter(date)}
              onMouseLeave={onLeave}
              onClick={() => !disabled && onClick(date)}
            >
              {between   && <span className="absolute inset-y-1 inset-x-0 bg-accent-soft" />}
              {isStart && hasRange && <span className="absolute inset-y-1 left-0 right-1/2 bg-accent-soft" />}
              {isEnd   && hasRange && <span className="absolute inset-y-1 left-1/2 right-0 bg-accent-soft" />}
              <span className={[
                "relative z-10 w-10 h-10 flex items-center justify-center rounded-full text-[15px] select-none transition-colors",
                disabled ? "text-line-strong" : "",
                !disabled && !isStart && !isEnd ? "text-ink font-medium hover:bg-soft-2" : "",
                isStart || isEnd ? "bg-accent text-white font-bold" : "",
              ].join(" ")}>
                {date.getDate()}
              </span>
              {flight && (
                <PlaneDot className={`absolute bottom-0 z-10 ${isStart || isEnd ? "text-accent" : "text-muted"}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const IconChevL = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
);
const IconChevR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
);

interface Props {
  initialFrom?: string;
  initialTo?: string;
  onSelect: (from: string, to: string) => void;
  onCancel?: () => void;
}

export default function SkiCalendar({ initialFrom, initialTo, onSelect, onCancel }: Props) {
  const [from, setFrom] = useState<Date | null>(initialFrom ? new Date(initialFrom + "T12:00:00") : null);
  const [to,   setTo]   = useState<Date | null>(initialTo   ? new Date(initialTo   + "T12:00:00") : null);
  const [hov,  setHov]  = useState<Date | null>(null);
  // open on the month of the chosen dates (inside the season), else on the first month of the season
  const [base, setBase] = useState(() => {
    const f = initialFrom ? new Date(initialFrom + "T12:00:00") : null;
    if (!f || f < SEASON_START || f > SEASON_END) return new Date(2026, 10, 1);
    const last = new Date(SEASON_END.getFullYear(), SEASON_END.getMonth() - 1, 1); // two months fit on desktop
    const m = new Date(f.getFullYear(), f.getMonth(), 1);
    return m > last ? last : m;
  });
  // a full range is already there: the next click starts a new one (the tabs above pick the end date explicitly)
  const [picking, setPicking] = useState<"from"|"to">(initialFrom && !initialTo ? "to" : "from");

  const next    = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  const nights  = from && to ? Math.round((to.getTime() - from.getTime()) / 86400000) : null;
  const canPrev = base > SEASON_START;
  const canNext = next < new Date(SEASON_END.getFullYear(), SEASON_END.getMonth(), 1);

  const fmtD = (d: Date | null) => d ? `${d.getDate()} ב${MONTHS[d.getMonth()]}` : null;

  const handleDay = (date: Date) => {
    if (picking === "from" || !from) {
      setFrom(date); setTo(null); setPicking("to");
    } else {
      const [a, b] = date < from ? [date, from] : [from, date];
      setFrom(a); setTo(b); setPicking("from");
      onSelect(toIso(a), toIso(b));
    }
  };

  const navBtn = (disabled: boolean, onClick: () => void, icon: React.ReactNode, label: string) => (
    <button type="button" onClick={() => !disabled && onClick()} disabled={disabled} aria-label={label}
      className={`w-11 h-11 flex items-center justify-center rounded-full border transition-colors
        ${disabled ? "border-line text-line-strong cursor-not-allowed" : "border-line-strong text-ink hover:border-ink"}`}>
      {icon}
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border border-line p-4 md:p-5" dir="rtl">
      {/* which date is being picked */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(["from","to"] as const).map(w => {
          const val = fmtD(w === "from" ? from : to);
          const on = picking === w;
          return (
            <button key={w} type="button" onClick={() => setPicking(w)} aria-pressed={on}
              className={`min-h-[52px] px-3 rounded-xl border text-right transition-colors ${
                on ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong"
              }`}>
              <span className="block text-[12px] font-bold text-muted">{w === "from" ? "יציאה" : "חזרה"}</span>
              <span className={`block text-[15px] ${val ? "text-ink font-bold" : "text-muted"}`}>{val ?? "בחרו יום"}</span>
            </button>
          );
        })}
      </div>

      {/* months */}
      <div className="relative">
        <div className="absolute top-[-6px] right-0 z-10">
          {navBtn(!canPrev, () => setBase(new Date(base.getFullYear(), base.getMonth() - 1, 1)), <IconChevR />, "החודש הקודם")}
        </div>
        <div className="absolute top-[-6px] left-0 z-10">
          {navBtn(!canNext, () => setBase(new Date(base.getFullYear(), base.getMonth() + 1, 1)), <IconChevL />, "החודש הבא")}
        </div>
        <div className="flex gap-6">
          <MonthGrid year={base.getFullYear()} month={base.getMonth()}
            from={from} to={to} hov={picking === "to" ? hov : null}
            onEnter={setHov} onLeave={() => setHov(null)} onClick={handleDay} />
          <div className="hidden md:block w-px bg-line" />
          <div className="hidden md:flex flex-1">
            <MonthGrid year={next.getFullYear()} month={next.getMonth()}
              from={from} to={to} hov={picking === "to" ? hov : null}
              onEnter={setHov} onLeave={() => setHov(null)} onClick={handleDay} />
          </div>
        </div>
      </div>

      <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] text-muted">
        <PlaneDot className="text-muted" /> בדרך כלל יש ביום הזה טיסה ישירה מתל אביב לליון
      </p>

      {/* footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-line">
        <button type="button" onClick={() => { setFrom(null); setTo(null); setPicking("from"); }}
          className="min-h-[44px] text-[15px] font-medium text-muted hover:text-ink">ניקוי</button>
        <div className="flex items-center gap-3">
          {nights ? (
            <span className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F7A4F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l4 4 10-10" /></svg>
              {nights} לילות
            </span>
          ) : (
            <span className="text-[14px] text-muted">{picking === "from" ? "בחרו את יום היציאה" : "עכשיו את יום החזרה"}</span>
          )}
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="min-h-[44px] px-4 rounded-xl border border-line-strong text-[15px] font-bold text-ink hover:border-ink transition-colors">
              סגירה
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
