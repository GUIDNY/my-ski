"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

/*
 * Bookings calendar (/seller/calendar, sellers and admins). Read-only.
 *   - "היום" strip: who leaves (cleaning), who arrives, turnovers, free tonight.
 *   - Two views: a Hostex-style board (row per apartment, bar per stay) and a month
 *     calendar (one apartment, or all apartments by day). Tap a stay or a day for details.
 * Data: /api/seller/calendar (Airbnb/Hostex guests + site orders).
 */
type Bar = {
  id: string; row: string; start: string; end: string; title: string;
  source: "site" | "airbnb" | "other"; channel: string;
  codes?: string[]; status?: string; guests?: number | null; clash?: boolean;
};
type Row = { id: string; title: string; hostex: boolean };
type Data = { ok: boolean; from: string; days: number; today: string; hostex: boolean; rows: Row[]; bars: Bar[] };
type View = "board" | "month";

const DAY = 86400000;
const t = (s: string) => Date.parse(s + "T12:00:00Z");
const iso = (n: number) => new Date(n).toISOString().slice(0, 10);
const add = (s: string, n: number) => iso(t(s) + n * DAY);
const diff = (a: string, b: string) => Math.round((t(b) - t(a)) / DAY);
const WD = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const WD_LONG = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
const parisToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const dm = (s: string) => `${Number(s.slice(8, 10))}.${Number(s.slice(5, 7))}`;
const wd = (s: string) => new Date(t(s)).getUTCDay();
const ymOf = (s: string) => s.slice(0, 7);
const monthAdd = (ym: string, n: number) => { const d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1)); return iso(d.getTime()).slice(0, 7); };
const monthLen = (ym: string) => new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate();
const monthName = (ym: string) => `${MONTHS[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
const covers = (b: Bar, d: string) => b.start <= d && b.end > d;

const STYLE: Record<Bar["source"], { bar: string; soft: string; dot: string; label: string }> = {
  site: { bar: "bg-gradient-to-l from-emerald-500 to-emerald-600 text-white", soft: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500", label: "הזמנת אתר" },
  airbnb: { bar: "bg-gradient-to-l from-rose-500 to-pink-500 text-white", soft: "bg-rose-50 text-rose-800 border-rose-200", dot: "bg-rose-500", label: "Airbnb" },
  other: { bar: "bg-gradient-to-l from-sky-500 to-blue-600 text-white", soft: "bg-sky-50 text-sky-800 border-sky-200", dot: "bg-sky-500", label: "ערוץ אחר" },
};
const barClass = (b: Bar) => b.clash ? "bg-gradient-to-l from-red-600 to-red-700 text-white ring-2 ring-red-300" : STYLE[b.source].bar;

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => { const f = () => setM(window.innerWidth < 768); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return m;
}

function useCalendar(from: string, days: number) {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [nonce, setNonce] = useState(0);
  const key = `${from}|${days}|${nonce}`;
  const [doneKey, setDoneKey] = useState("");
  const seq = useRef(0); // only the latest request may paint
  useEffect(() => {
    const my = ++seq.current;
    authFetch(`/api/seller/calendar?days=${days}&from=${from}`)
      .then(r => r.json())
      .then(j => { if (my !== seq.current) return; if (!j?.ok) throw new Error(j?.error || "שגיאה"); setData(j); setErr(""); })
      .catch(e => { if (my === seq.current) setErr(e instanceof Error ? e.message : "שגיאה"); })
      .finally(() => { if (my === seq.current) setDoneKey(key); });
  }, [from, days, key]);
  const reload = useCallback(() => setNonce(n => n + 1), []);
  return { data, err, loading: doneKey !== key, reload };
}

export default function CalendarPage() {
  const mobile = useIsMobile();
  const [today] = useState(parisToday);
  const [ym, setYm] = useState(ymOf(today));
  const [view, setView] = useState<View>("board");
  const [apt, setApt] = useState<string>("all");
  const [sel, setSel] = useState<Bar | null>(null);
  const [selDay, setSelDay] = useState<string | null>(null);
  const viewPicked = useRef(false);
  useEffect(() => { if (!viewPicked.current) setView(mobile ? "month" : "board"); }, [mobile]);
  const pickView = (v: View) => { viewPicked.current = true; setView(v); };

  // the month grid starts on the Sunday on or before the 1st; 6 weeks cover any month (and the board's month)
  const first = ym + "-01";
  const gridFrom = add(first, -wd(first));
  const { data, err, loading, reload } = useCalendar(gridFrom, 42);
  const { data: tData } = useCalendar(add(today, -1), 7);

  const rows = data?.rows ?? [];
  const shownRows = apt === "all" ? rows : rows.filter(r => r.id === apt);
  const aptTitle = (id: string) => rows.find(r => r.id === id)?.title ?? tData?.rows.find(r => r.id === id)?.title ?? "";

  const go = (n: number) => setYm(monthAdd(ym, n));
  const goToday = () => { setYm(ymOf(today)); setSelDay(null); };
  const months = Array.from({ length: 8 }, (_, i) => monthAdd(ymOf(today), i - 1));

  const clashes = (data?.bars ?? []).filter(b => b.clash && b.start < add(first, monthLen(ym)) && b.end > first);

  return (
    <div className="p-3 md:p-8 max-w-[1500px] mx-auto">
      {/* header */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="ml-auto">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">לוח הזמנות</h1>
          <p className="text-gray-500 text-sm mt-0.5">כל ההזמנות במקום אחד: Airbnb והאתר. לחיצה על הזמנה פותחת את כל הפרטים.</p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-2xl p-1 text-sm font-bold">
          {([["board", "לוח דירות"], ["month", "חודש"]] as [View, string][]).map(([v, l]) => (
            <button key={v} onClick={() => pickView(v)}
              className={`px-4 py-2 rounded-xl transition ${view === v ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>{l}</button>
          ))}
        </div>
      </div>

      {tData && <TodayStrip data={tData} today={today} onBar={setSel} onDay={d => { setYm(ymOf(d)); setSelDay(d); }} />}

      {/* month picker */}
      <div className="sticky top-0 z-30 -mx-3 md:mx-0 px-3 md:px-0 py-2 bg-gray-50/90 backdrop-blur supports-[backdrop-filter]:bg-gray-50/70">
        <div className="flex items-center gap-2">
          <button onClick={() => go(-1)} aria-label="חודש קודם" className="w-10 h-10 shrink-0 rounded-full bg-white border border-gray-200 text-lg font-bold hover:border-gray-400">›</button>
          <div className="flex-1 min-w-0 text-center">
            <div className="text-2xl md:text-3xl font-black text-gray-900 leading-none">{monthName(ym)}</div>
          </div>
          <button onClick={() => go(1)} aria-label="חודש הבא" className="w-10 h-10 shrink-0 rounded-full bg-white border border-gray-200 text-lg font-bold hover:border-gray-400">‹</button>
        </div>
        <div className="flex gap-1.5 mt-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
          <button onClick={goToday} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-600 text-white">היום</button>
          {months.map(m => (
            <button key={m} onClick={() => setYm(m)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition ${m === ym ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
              {MONTHS[+m.slice(5, 7) - 1]}
            </button>
          ))}
        </div>
        {/* apartment picker */}
        <div className="flex gap-1.5 mt-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
          <AptChip on={apt === "all"} onClick={() => setApt("all")}>🏔️ כל הדירות</AptChip>
          {rows.map(r => <AptChip key={r.id} on={apt === r.id} onClick={() => setApt(r.id)}>{r.title}</AptChip>)}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600 my-3">
        {(["airbnb", "site", "other"] as const).map(s => <span key={s} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded-full ${STYLE[s].dot}`} />{STYLE[s].label}</span>)}
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-amber-400" />אתר, ממתין לאישור</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600" />⚠ התנגשות</span>
        <span className="flex items-center gap-1.5">🧹 ניקיון בין אורחים</span>
      </div>

      {data && !data.hostex && <Note tone="amber">לא הצלחתי לקרוא את Hostex כרגע, אז מוצגות רק הזמנות האתר. <button onClick={reload} className="underline font-bold">לנסות שוב</button></Note>}
      {clashes.length > 0 && <Note tone="red">⚠ יש התנגשות החודש: שתי הזמנות על אותו לילה ({[...new Set(clashes.map(b => aptTitle(b.row)))].join(", ")}). מסומן באדום.</Note>}
      {err && <Note tone="red">{err} <button onClick={reload} className="underline font-bold">לנסות שוב</button></Note>}

      {!data ? (
        <Skeleton />
      ) : (
        <div className={`transition-opacity ${loading ? "opacity-50" : ""}`}>
          {view === "board"
            ? <Board data={data} rows={shownRows} ym={ym} today={today} mobile={mobile} onBar={setSel} onDay={setSelDay} />
            : <Month data={data} rows={shownRows} apt={apt} ym={ym} today={today} onBar={setSel} onDay={setSelDay} />}
        </div>
      )}

      {sel && <StaySheet bar={sel} all={[...(data?.bars ?? []), ...(tData?.bars ?? [])]} aptName={aptTitle(sel.row)} today={today} onClose={() => setSel(null)} />}
      {selDay && data && !sel && <DaySheet day={selDay} data={data} rows={shownRows} today={today} onBar={b => setSel(b)} onClose={() => setSelDay(null)} />}
    </div>
  );
}

/* ---------------- today strip ---------------- */

function TodayStrip({ data, today, onBar, onDay }: { data: Data; today: string; onBar: (b: Bar) => void; onDay: (d: string) => void }) {
  const hostexRows = data.rows.filter(r => r.hostex);
  const title = (id: string) => data.rows.find(r => r.id === id)?.title ?? "";
  const outs = data.bars.filter(b => b.end === today);
  const ins = data.bars.filter(b => b.start === today);
  const turn = new Set(outs.map(b => b.row).filter(r => ins.some(b => b.row === r)));
  const freeTonight = hostexRows.filter(r => !data.bars.some(b => b.row === r.id && covers(b, today)));
  const tomorrow = add(today, 1);
  const insTomorrow = data.bars.filter(b => b.start === tomorrow);
  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-2 mb-2">
        <h2 className="text-lg font-black text-gray-900">היום</h2>
        <button onClick={() => onDay(today)} className="text-sm text-blue-600 font-bold hover:underline">יום {WD_LONG[wd(today)]}, {dm(today)} ←</button>
      </div>
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap pb-1">
        <StatCard icon="🧹" n={outs.length} label="יוצאים, לנקות" tone="bg-amber-50 border-amber-200 text-amber-900">
          {outs.map(b => <StayPill key={b.id} b={b} mark={turn.has(b.row) ? "⚡ " : ""} apt={title(b.row)} onClick={() => onBar(b)} />)}
        </StatCard>
        <StatCard icon="🛬" n={ins.length} label="מגיעים היום" tone="bg-emerald-50 border-emerald-200 text-emerald-900">
          {ins.map(b => <StayPill key={b.id} b={b} apt={title(b.row)} onClick={() => onBar(b)} />)}
        </StatCard>
        <StatCard icon="⚡" n={turn.size} label="ניקיון בין אורחים" tone={turn.size ? "bg-red-50 border-red-200 text-red-900" : "bg-gray-50 border-gray-200 text-gray-500"}>
          {[...turn].map(r => <span key={r} className="text-[11px] font-bold bg-white/80 rounded-full px-2 py-0.5">{title(r)}: לסיים לפני 15:00</span>)}
        </StatCard>
        <StatCard icon="🌙" n={freeTonight.length} label="פנויות הלילה" tone="bg-sky-50 border-sky-200 text-sky-900">
          {freeTonight.map(r => <span key={r.id} className="text-[11px] font-bold bg-white/80 rounded-full px-2 py-0.5">{r.title}</span>)}
        </StatCard>
        <StatCard icon="📅" n={insTomorrow.length} label="מגיעים מחר" tone="bg-violet-50 border-violet-200 text-violet-900">
          {insTomorrow.map(b => <StayPill key={b.id} b={b} apt={title(b.row)} onClick={() => onBar(b)} />)}
        </StatCard>
      </div>
    </div>
  );
}

/* ---------------- board view ---------------- */

function Board({ data, rows, ym, today, mobile, onBar, onDay }: { data: Data; rows: Row[]; ym: string; today: string; mobile: boolean; onBar: (b: Bar) => void; onDay: (d: string) => void }) {
  const W = mobile ? 40 : 46, H = 50, NAME_W = mobile ? 104 : 168;
  const from = ym + "-01";
  const dates = Array.from({ length: monthLen(ym) }, (_, i) => add(from, i));
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { // bring today into view
    const i = dates.indexOf(today);
    if (scroller.current) scroller.current.scrollLeft = i > 3 ? (i - 3) * W : 0;
  }, [ym]); // eslint-disable-line react-hooks/exhaustive-deps

  const vacant = dates.map(d => data.rows.filter(r => r.hostex && !data.bars.some(b => b.row === r.id && covers(b, d))).length);
  const lanes = useMemo(() => {
    const lane: Record<string, number> = {}, count: Record<string, number> = {};
    const byRow = new Map<string, Bar[]>();
    for (const b of data.bars) byRow.set(b.row, [...(byRow.get(b.row) || []), b]);
    for (const [row, list] of byRow) {
      const ends: string[] = [];
      for (const b of list.slice().sort((a, c) => a.start.localeCompare(c.start))) {
        let i = ends.findIndex(e => e <= b.start);
        if (i < 0) { i = ends.length; ends.push(b.end); } else ends[i] = b.end;
        lane[b.id] = i;
      }
      count[row] = Math.max(1, ends.length);
    }
    return { lane, count };
  }, [data]);

  return (
    <div ref={scroller} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto" dir="ltr">
      <div style={{ width: NAME_W + dates.length * W }} className="relative">
        <div className="flex sticky top-0 z-20 bg-white border-b border-gray-100">
          <div style={{ width: NAME_W }} className="shrink-0 sticky left-0 z-30 bg-white px-3 py-2 text-xs font-bold text-gray-400 flex items-end" dir="rtl">דירה</div>
          {dates.map(d => {
            const w = wd(d), isToday = d === today, weekend = w === 5 || w === 6;
            return (
              <button key={d} onClick={() => onDay(d)} style={{ width: W }}
                className={`shrink-0 text-center py-2 border-l border-gray-50 hover:bg-gray-50 ${weekend ? "bg-rose-50/40" : ""}`}>
                <div className={`text-[10px] ${isToday ? "text-blue-600 font-bold" : "text-gray-400"}`}>{isToday ? "היום" : WD[w]}</div>
                <div className={`mx-auto mt-0.5 w-8 h-8 rounded-full grid place-items-center text-[15px] font-black ${isToday ? "bg-blue-600 text-white shadow" : weekend ? "text-rose-500" : "text-gray-800"}`}>{Number(d.slice(8))}</div>
              </button>
            );
          })}
        </div>
        <div className="flex border-b border-gray-100 bg-gray-50/70">
          <div style={{ width: NAME_W }} className="shrink-0 sticky left-0 z-10 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-500" dir="rtl">פנויות</div>
          {vacant.map((v, i) => (
            <div key={i} style={{ width: W }} className={`shrink-0 text-center py-1.5 text-xs font-black ${v === 0 ? "text-rose-500" : v <= 2 ? "text-amber-600" : "text-gray-500"}`}>{v}</div>
          ))}
        </div>
        {rows.map(row => {
          const list = data.bars.filter(b => b.row === row.id);
          return (
            <div key={row.id} className="flex border-b border-gray-50 relative group" style={{ height: H * (lanes.count[row.id] || 1) }}>
              <div style={{ width: NAME_W }} dir="rtl" title={row.title}
                className="shrink-0 sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-3 flex items-center text-[13px] md:text-sm font-bold text-gray-800 border-r border-gray-100">
                <span className="truncate">{row.title}</span>{!row.hostex && <span className="mr-1 text-[10px] text-gray-400 font-normal">(אתר)</span>}
              </div>
              {dates.map(d => {
                const w = wd(d);
                const turn = list.some(b => b.end === d) && list.some(b => b.start === d);
                return (
                  <div key={d} style={{ width: W }} className={`shrink-0 border-l border-gray-50 relative ${d === today ? "bg-blue-50/60" : w === 5 || w === 6 ? "bg-rose-50/30" : ""}`}>
                    {turn && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 text-[11px] z-10" title="ניקיון בין אורחים">🧹</span>}
                  </div>
                );
              })}
              {list.map(b => {
                const s = Math.max(-0.5, diff(from, b.start));
                const e = Math.min(dates.length + 0.5, diff(from, b.end));
                if (e <= s) return null;
                const nights = diff(b.start, b.end);
                const left = NAME_W + (s + 0.5) * W + 2, width = (e - s) * W - 4;
                const hold = b.source === "site" && b.status === "hold" && !b.clash ? "ring-2 ring-amber-400" : "";
                return (
                  <button key={b.id} onClick={() => onBar(b)}
                    className={`absolute rounded-xl px-2 text-right overflow-hidden whitespace-nowrap leading-tight shadow-sm hover:shadow-md hover:-translate-y-px transition ${barClass(b)} ${hold}`}
                    style={{ left, width, top: 5 + H * (lanes.lane[b.id] || 0), height: H - 10, zIndex: 5 }} dir="rtl">
                    <div className="text-[12px] font-black truncate" dir="auto">{b.clash ? "⚠ " : ""}{b.title}</div>
                    {width > 60 && <div className="text-[10px] opacity-90 truncate">{b.source === "site" ? "אתר" : b.channel} · {nights} לילות{b.guests ? ` · ${b.guests} 👤` : ""}</div>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- month view ---------------- */

function Month({ data, rows, apt, ym, today, onBar, onDay }: { data: Data; rows: Row[]; apt: string; ym: string; today: string; onBar: (b: Bar) => void; onDay: (d: string) => void }) {
  const first = ym + "-01";
  const start = add(first, -wd(first));
  const cells = Array.from({ length: 42 }, (_, i) => add(start, i));
  const weeks = Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7)).filter(w => w.some(d => ymOf(d) === ym));
  const one = apt !== "all";
  const bars = one ? data.bars.filter(b => b.row === apt) : data.bars;
  const hostexRows = rows.filter(r => r.hostex);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
        {WD_LONG.map((w, i) => <div key={w} className={`py-2 text-center text-[11px] md:text-xs font-bold ${i >= 5 ? "text-rose-500" : "text-gray-500"}`}><span className="md:hidden">{WD[i]}</span><span className="hidden md:inline">{w}</span></div>)}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-gray-50 last:border-0">
          {week.map(d => {
            const inMonth = ymOf(d) === ym, isToday = d === today, past = d < today;
            const night = bars.filter(b => covers(b, d));
            const outs = bars.filter(b => b.end === d), ins = bars.filter(b => b.start === d);
            const turn = one ? outs.length > 0 && ins.length > 0 : outs.some(o => ins.some(i => i.row === o.row));
            const free = hostexRows.filter(r => !data.bars.some(b => b.row === r.id && covers(b, d))).length;
            const b0 = one ? night[0] : undefined;
            return (
              <button key={d} onClick={() => (b0 ? onBar(b0) : onDay(d))}
                className={`relative min-h-[76px] md:min-h-[112px] p-1 md:p-2 text-right border-l border-gray-50 first:border-l-0 transition hover:bg-gray-50 ${!inMonth ? "opacity-35" : ""} ${past && inMonth ? "bg-gray-50/40" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className={`w-7 h-7 md:w-9 md:h-9 rounded-full grid place-items-center text-sm md:text-lg font-black ${isToday ? "bg-blue-600 text-white shadow" : "text-gray-800"}`}>{Number(d.slice(8))}</span>
                  {turn && <span className="text-xs md:text-sm" title="ניקיון בין אורחים">🧹</span>}
                </div>
                {one ? (
                  b0 ? (
                    <div className={`mt-1 rounded-lg px-1.5 py-1 text-[10px] md:text-xs font-bold leading-tight ${barClass(b0)} ${b0.start === d || wd(d) === 0 ? "" : "opacity-90"}`}>
                      <div className="truncate" dir="auto">{b0.start === d || wd(d) === 0 || d === first ? b0.title : "·"}</div>
                      {b0.start === d && <div className="text-[9px] md:text-[10px] opacity-90">מגיע · {diff(b0.start, b0.end)} לילות</div>}
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] md:text-xs font-bold text-emerald-600">{inMonth && !past ? "פנוי ✨" : ""}</div>
                  )
                ) : (
                  <div className="mt-1 space-y-0.5">
                    <div className={`text-[10px] md:text-xs font-black ${free === 0 ? "text-rose-500" : free <= 2 ? "text-amber-600" : "text-emerald-600"}`}>{free === 0 ? "מלא" : `${free} פנויות`}</div>
                    {ins.length > 0 && <div className="text-[10px] md:text-xs text-gray-600">🛬 {ins.length}</div>}
                    {outs.length > 0 && <div className="text-[10px] md:text-xs text-gray-600">🧹 {outs.length}</div>}
                  </div>
                )}
                {one && outs.length > 0 && !ins.length && <div className="text-[9px] md:text-[10px] text-amber-700 font-bold mt-0.5">יוצא בבוקר</div>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ---------------- sheets ---------------- */

function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full md:max-w-lg max-h-[88vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-3xl shadow-2xl animate-[sheet_.18s_ease-out]">
        <div className="md:hidden w-10 h-1.5 rounded-full bg-gray-200 mx-auto mt-2" />
        <button onClick={onClose} aria-label="סגירה" className="absolute left-3 top-3 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">✕</button>
        {children}
      </div>
      <style>{`@keyframes sheet{from{transform:translateY(24px);opacity:.4}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}

function StaySheet({ bar, all, aptName, today, onClose }: { bar: Bar; all: Bar[]; aptName: string; today: string; onClose: () => void }) {
  const nights = diff(bar.start, bar.end);
  const sameRow = all.filter(b => b.row === bar.row && b.id !== bar.id);
  const next = sameRow.find(b => b.start === bar.end);
  const prev = sameRow.find(b => b.end === bar.start);
  const status = today < bar.start ? `מגיע בעוד ${diff(today, bar.start)} ${diff(today, bar.start) === 1 ? "יום" : "ימים"}`
    : today < bar.end ? (today === bar.start ? "מגיע היום" : "בדירה עכשיו") : today === bar.end ? "יוצא היום" : "עזב";
  const statusTone = today < bar.start ? "bg-violet-100 text-violet-800" : today < bar.end ? "bg-emerald-100 text-emerald-800" : today === bar.end ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600";
  const dayLine = (s: string) => `יום ${WD_LONG[wd(s)]}, ${dm(s)}.${s.slice(0, 4)}`;
  const progress = today >= bar.start && today < bar.end ? Math.round((diff(bar.start, today) + 1) / nights * 100) : null;

  return (
    <Sheet onClose={onClose}>
      <div className={`px-5 pt-6 pb-5 ${barClass(bar)} md:rounded-t-3xl`}>
        <div className="text-xs font-bold opacity-90">{bar.clash ? "⚠ התנגשות · " : ""}{bar.source === "site" ? "הזמנת אתר" : bar.channel}{bar.source === "site" && bar.status === "hold" ? " · ממתין לאישור" : ""}</div>
        <div className="text-2xl font-black mt-1 leading-tight" dir="auto">{bar.title}</div>
        <div className="text-sm font-bold opacity-95 mt-1">🏠 {aptName}</div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-sm font-black ${statusTone}`}>{status}</span>
          {bar.guests ? <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-700">👤 {bar.guests} אורחים</span> : null}
          <span className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-700">🌙 {nights} לילות</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-gray-50 p-3"><div className="text-xs text-gray-500 font-bold">צ׳ק-אין 15:00</div><div className="text-3xl font-black text-gray-900 mt-0.5">{dm(bar.start)}</div><div className="text-xs text-gray-500">{dayLine(bar.start)}</div></div>
          <div className="rounded-2xl bg-gray-50 p-3"><div className="text-xs text-gray-500 font-bold">צ׳ק-אאוט 11:00</div><div className="text-3xl font-black text-gray-900 mt-0.5">{dm(bar.end)}</div><div className="text-xs text-gray-500">{dayLine(bar.end)}</div></div>
        </div>
        {progress !== null && (
          <div><div className="flex justify-between text-xs text-gray-500 font-bold mb-1"><span>לילה {diff(bar.start, today) + 1} מתוך {nights}</span><span>{progress}%</span></div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} /></div></div>
        )}
        <div className="rounded-2xl border border-gray-100 p-3 space-y-2 text-sm">
          <div className="font-black text-gray-900">🧹 ניקיון</div>
          {prev && <div className="text-amber-800 bg-amber-50 rounded-xl px-3 py-2">באותו בוקר יוצא <b dir="auto">{prev.title}</b>: לוודא שהדירה נוקתה עד 15:00.</div>}
          {next
            ? <div className="text-red-800 bg-red-50 rounded-xl px-3 py-2">⚡ ביום היציאה ({dm(bar.end)}) נכנס <b dir="auto">{next.title}</b>: ניקיון בין אורחים, לסיים לפני 15:00.</div>
            : <div className="text-gray-700 bg-gray-50 rounded-xl px-3 py-2">ניקיון ביום היציאה, {dayLine(bar.end)}. אין אורח שנכנס באותו יום.</div>}
        </div>
        {bar.codes?.length ? (
          <div className="text-sm text-gray-600">קוד הזמנה: {bar.codes.map(c => <span key={c} className="inline-block font-mono font-bold bg-gray-100 rounded-lg px-2 py-0.5 ml-1">{c}</span>)}</div>
        ) : null}
        {bar.clash && <div className="text-sm text-red-800 bg-red-50 rounded-xl px-3 py-2">⚠ ההזמנה הזאת חופפת להזמנה אחרת באותה דירה. צריך להחליט מי נשאר.</div>}
      </div>
    </Sheet>
  );
}

function DaySheet({ day, data, rows, today, onBar, onClose }: { day: string; data: Data; rows: Row[]; today: string; onBar: (b: Bar) => void; onClose: () => void }) {
  const items = rows.map(r => {
    const list = data.bars.filter(b => b.row === r.id);
    return { r, out: list.find(b => b.end === day), inn: list.find(b => b.start === day), stay: list.find(b => covers(b, day) && b.start !== day) };
  });
  const free = items.filter(i => !i.inn && !i.stay && i.r.hostex).length;
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-6 pb-4 bg-gradient-to-l from-gray-900 to-gray-700 text-white md:rounded-t-3xl">
        <div className="text-xs font-bold opacity-80">{day === today ? "היום" : "יום " + WD_LONG[wd(day)]}</div>
        <div className="text-3xl font-black">{dm(day)}.{day.slice(0, 4)}</div>
        <div className="text-sm opacity-90 mt-1">🌙 {free} פנויות הלילה</div>
      </div>
      <div className="p-3 divide-y divide-gray-50">
        {items.map(({ r, out, inn, stay }) => (
          <div key={r.id} className="py-2.5 px-2 flex items-center gap-2">
            <div className="w-28 shrink-0 font-bold text-sm text-gray-800 truncate">{r.title}</div>
            <div className="flex-1 flex flex-wrap gap-1 justify-end">
              {out && inn && <span className="text-[11px] font-black bg-red-100 text-red-800 rounded-full px-2 py-0.5">⚡ ניקיון בין אורחים</span>}
              {out && <button onClick={() => onBar(out)} className="text-[11px] font-bold bg-amber-100 text-amber-900 rounded-full px-2 py-0.5 truncate max-w-[150px]">🧹 יוצא: {out.title}</button>}
              {inn && <button onClick={() => onBar(inn)} className={`text-[11px] font-bold rounded-full px-2 py-0.5 truncate max-w-[150px] ${barClass(inn)}`}>🛬 מגיע: {inn.title}</button>}
              {stay && <button onClick={() => onBar(stay)} className={`text-[11px] font-bold rounded-full px-2 py-0.5 border truncate max-w-[150px] ${STYLE[stay.source].soft}`}>🛏️ {stay.title}</button>}
              {!out && !inn && !stay && <span className="text-[11px] font-bold text-emerald-600">פנוי ✨</span>}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------------- bits ---------------- */

function StatCard({ icon, n, label, tone, children }: { icon: string; n: number; label: string; tone: string; children?: React.ReactNode }) {
  return (
    <div className={`rounded-2xl p-3 md:p-4 border ${tone} min-w-[150px] flex-1`}>
      <div className="flex items-center gap-2"><span className="text-xl">{icon}</span><span className="text-2xl font-black">{n}</span><span className="text-sm font-bold opacity-80">{label}</span></div>
      {children && <div className="mt-2 flex flex-wrap gap-1">{children}</div>}
    </div>
  );
}

function StayPill({ b, mark, apt, onClick }: { b: Bar; mark?: string; apt: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-[11px] font-bold bg-white/80 hover:bg-white rounded-full px-2 py-0.5 border border-black/5 truncate max-w-[180px]">
      {mark}{apt} · {b.title}
    </button>
  );
}

function AptChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition ${on ? "bg-blue-600 text-white border-blue-600 shadow" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"}`}>
      {children}
    </button>
  );
}

function Note({ tone, children }: { tone: "amber" | "red"; children: React.ReactNode }) {
  const c = tone === "amber" ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-red-50 border-red-200 text-red-800";
  return <div className={`mb-3 rounded-2xl border text-sm px-4 py-2.5 ${c}`}>{children}</div>;
}

function Skeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-4 space-y-3 animate-pulse">
      {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-9 rounded-xl bg-gray-100" style={{ width: `${60 + ((i * 17) % 40)}%` }} />)}
    </div>
  );
}
