"use client";
import { useState } from "react";

const MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const DAYS   = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];

export const SEASON_START = new Date(2026, 11, 1);  // Dec 2026
export const SEASON_END   = new Date(2027,  4, 31); // May 2027

const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const toIso = (d: Date) => d.toISOString().split("T")[0];

function gridDays(y: number, m: number): (Date | null)[] {
  const pad  = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const out: (Date | null)[] = Array(pad).fill(null);
  for (let d = 1; d <= days; d++) out.push(new Date(y, m, d));
  while (out.length % 7) out.push(null);
  return out;
}

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
    <div className="flex-1 min-w-0" dir="ltr">
      <p className="text-sm font-bold text-gray-900 text-center mb-3">{MONTHS[month]} {year}</p>
      <div className="grid grid-cols-7">
        {DAYS.map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-400">{d}</div>
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

          return (
            <div key={i}
              className={`relative h-11 flex items-center justify-center ${disabled ? "pointer-events-none" : "cursor-pointer"}`}
              onMouseEnter={() => !disabled && onEnter(date)}
              onMouseLeave={onLeave}
              onClick={() => !disabled && onClick(date)}
            >
              {between   && <div className="absolute top-1.5 bottom-1.5 left-0 right-0 bg-blue-50" />}
              {isStart && hasRange && <div className="absolute top-1.5 bottom-1.5 left-1/2 right-0 bg-blue-50" />}
              {isEnd   && hasRange && <div className="absolute top-1.5 bottom-1.5 left-0 right-1/2 bg-blue-50" />}
              <div className={[
                "relative z-10 w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium select-none transition-colors",
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

const IconChevL = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const IconChevR = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
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
  const [base, setBase] = useState(new Date(2026, 11, 1));
  const [picking, setPicking] = useState<"from"|"to">(initialFrom ? "to" : "from");

  const next    = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  const nights  = from && to ? Math.round((to.getTime() - from.getTime()) / 86400000) : null;
  const canPrev = base > SEASON_START;
  const canNext = next < new Date(SEASON_END.getFullYear(), SEASON_END.getMonth(), 1);

  const fmtD = (d: Date | null) => d ? `${d.getDate()} ${MONTHS[d.getMonth()]}` : null;

  const handleDay = (date: Date) => {
    if (picking === "from" || !from) {
      setFrom(date); setTo(null); setPicking("to");
    } else {
      const [a, b] = date < from ? [date, from] : [from, date];
      setFrom(a); setTo(b); setPicking("from");
      onSelect(toIso(a), toIso(b));
    }
  };

  const navBtn = (disabled: boolean, onClick: () => void, icon: React.ReactNode) => (
    <button type="button" onClick={() => !disabled && onClick()}
      className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors
        ${disabled ? "border-gray-100 text-gray-300 cursor-not-allowed" : "border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"}`}>
      {icon}
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5" dir="rtl">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["from","to"] as const).map(w => (
          <button key={w} type="button" onClick={() => setPicking(w)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${
              picking === w ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 text-gray-500 hover:border-gray-200"
            }`}>
            {w === "from" ? "✈️ יציאה" : "🏠 חזרה"} — {fmtD(w === "from" ? from : to) ?? "בחר"}
          </button>
        ))}
      </div>

      {/* Nav + grids */}
      <div className="flex items-center justify-between mb-3">
        {navBtn(canPrev, () => setBase(new Date(base.getFullYear(), base.getMonth() - 1, 1)), <IconChevL />)}
        <div className="flex-1" />
        {navBtn(canNext, () => setBase(new Date(base.getFullYear(), base.getMonth() + 1, 1)), <IconChevR />)}
      </div>

      <div className="flex gap-6">
        <MonthGrid year={base.getFullYear()} month={base.getMonth()}
          from={from} to={to} hov={picking === "to" ? hov : null}
          onEnter={setHov} onLeave={() => setHov(null)} onClick={handleDay} />
        <div className="hidden md:block w-px bg-gray-100" />
        <div className="hidden md:flex flex-1">
          <MonthGrid year={next.getFullYear()} month={next.getMonth()}
            from={from} to={to} hov={picking === "to" ? hov : null}
            onEnter={setHov} onLeave={() => setHov(null)} onClick={handleDay} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
        <button type="button" onClick={() => { setFrom(null); setTo(null); setPicking("from"); }}
          className="text-sm text-gray-400 hover:text-gray-600">נקה תאריכים</button>
        <div className="flex items-center gap-3">
          {nights ? (
            <span className="text-sm font-bold text-blue-600">{nights} לילות ✓</span>
          ) : (
            <span className="text-xs text-gray-400">{picking === "from" ? "בחר תאריך יציאה" : "עכשיו בחר חזרה"}</span>
          )}
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
              ביטול
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
