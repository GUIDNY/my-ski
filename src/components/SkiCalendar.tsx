"use client";
import { useState } from "react";

const MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const DAYS   = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"];

export const SEASON_START = new Date(2026, 11, 1);  // Dec 2026
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
      <p className="text-sm font-bold text-center mb-3" style={{ color: "var(--charcoal)" }}>{MONTHS[month]} {year}</p>
      <div className="grid grid-cols-7">
        {DAYS.map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-xs font-semibold" style={{ color: "var(--stone-soft)" }}>{d}</div>
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
              {between   && <div className="absolute top-1.5 bottom-1.5 left-0 right-0" style={{ background: "var(--accent-wash)" }} />}
              {isStart && hasRange && <div className="absolute top-1.5 bottom-1.5 left-1/2 right-0" style={{ background: "var(--accent-wash)" }} />}
              {isEnd   && hasRange && <div className="absolute top-1.5 bottom-1.5 left-0 right-1/2" style={{ background: "var(--accent-wash)" }} />}
              <div
                className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-full text-sm select-none transition-colors ${
                  !disabled && !isStart && !isEnd ? "hover:bg-[var(--accent-wash)]" : ""
                }`}
                style={
                  isStart || isEnd
                    ? { background: "var(--accent)", color: "var(--ink)", fontWeight: 700 }
                    : disabled
                      ? { color: "#d4cfc2" }
                      : { color: "var(--charcoal)", fontWeight: 500 }
                }
              >
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
        ${disabled ? "border-gray-100 text-gray-300 cursor-not-allowed" : "hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"}`}
      style={!disabled ? { borderColor: "rgba(22,32,46,0.14)", color: "var(--stone)" } : undefined}>
      {icon}
    </button>
  );

  return (
    <div className="card-luxury p-5" dir="rtl" style={{ boxShadow: "0 24px 48px -24px rgba(10,27,51,0.3)" }}>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["from","to"] as const).map(w => (
          <button key={w} type="button" onClick={() => setPicking(w)}
            className="flex-1 py-2.5 rounded text-xs font-bold transition-all border"
            style={
              picking === w
                ? { borderColor: "var(--accent)", background: "var(--accent-wash)", color: "var(--accent-deep)" }
                : { borderColor: "rgba(22,32,46,0.1)", color: "var(--stone)" }
            }>
            {w === "from" ? "✈️ יציאה" : "🏠 חזרה"} — {fmtD(w === "from" ? from : to) ?? "בחר"}
          </button>
        ))}
      </div>

      {/* Nav + grids */}
      <div className="flex items-center justify-between mb-3">
        {navBtn(!canPrev, () => setBase(new Date(base.getFullYear(), base.getMonth() - 1, 1)), <IconChevR />)}
        <div className="flex-1" />
        {navBtn(!canNext, () => setBase(new Date(base.getFullYear(), base.getMonth() + 1, 1)), <IconChevL />)}
      </div>

      <div className="flex gap-6">
        <MonthGrid year={base.getFullYear()} month={base.getMonth()}
          from={from} to={to} hov={picking === "to" ? hov : null}
          onEnter={setHov} onLeave={() => setHov(null)} onClick={handleDay} />
        <div className="hidden md:block w-px" style={{ background: "rgba(22,32,46,0.08)" }} />
        <div className="hidden md:flex flex-1">
          <MonthGrid year={next.getFullYear()} month={next.getMonth()}
            from={from} to={to} hov={picking === "to" ? hov : null}
            onEnter={setHov} onLeave={() => setHov(null)} onClick={handleDay} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-4" style={{ borderTop: "1px solid rgba(22,32,46,0.08)" }}>
        <button type="button" onClick={() => { setFrom(null); setTo(null); setPicking("from"); }}
          className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--stone-soft)" }}>נקה תאריכים</button>
        <div className="flex items-center gap-3">
          {nights ? (
            <span className="text-sm font-bold" style={{ color: "var(--accent-deep)" }}>{nights} לילות ✓</span>
          ) : (
            <span className="text-xs" style={{ color: "var(--stone-soft)" }}>{picking === "from" ? "בחר תאריך יציאה" : "עכשיו בחר חזרה"}</span>
          )}
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="text-sm px-3 py-1.5 rounded border hover:bg-[var(--accent-wash)] transition-colors"
              style={{ color: "var(--stone)", borderColor: "rgba(22,32,46,0.14)" }}>
              ביטול
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
