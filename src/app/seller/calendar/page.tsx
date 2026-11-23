"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

/*
 * Bookings calendar like Hostex's: a row per apartment, a bar per stay
 * (Airbnb guests from Hostex, site orders from our own orders). Read-only.
 * Data: /api/seller/calendar.
 */
type Bar = {
  id: string; row: string; start: string; end: string; title: string;
  source: "site" | "airbnb" | "other"; channel: string;
  codes?: string[]; status?: string; guests?: number | null; clash?: boolean;
};
type Row = { id: string; title: string; hostex: boolean };
type Data = { ok: boolean; from: string; days: number; today: string; hostex: boolean; rows: Row[]; bars: Bar[] };

const W = 46;          // px per night
const H = 44;          // px per row
const NAME_W = 150;
const DAY = 86400000;
const t = (s: string) => Date.parse(s + "T12:00:00Z");
const iso = (n: number) => new Date(n).toISOString().slice(0, 10);
const WD = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

const COLORS: Record<Bar["source"], string> = {
  site: "bg-emerald-600 text-white",
  airbnb: "bg-rose-500 text-white",
  other: "bg-blue-600 text-white",
};

export default function CalendarPage() {
  const [from, setFrom] = useState<string>("");
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const days = 35;

  const seq = useRef(0); // only the latest request may paint (typing a date fires one per digit)
  const fetchCal = useCallback((f: string) => {
    const my = ++seq.current;
    authFetch(`/api/seller/calendar?days=${days}${f ? `&from=${f}` : ""}`)
      .then(r => r.json())
      .then(j => { if (my !== seq.current) return; if (!j?.ok) throw new Error(j?.error || "שגיאה"); setData(j); setFrom(j.from); })
      .catch(e => { if (my === seq.current) setErr(e instanceof Error ? e.message : "שגיאה"); })
      .finally(() => { if (my === seq.current) setLoading(false); });
  }, []);
  useEffect(() => { fetchCal(""); }, [fetchCal]);
  const load = (f: string) => { setLoading(true); setErr(""); fetchCal(f); };

  const shift = (n: number) => from && load(iso(t(from) + n * DAY));
  const goToday = () => load("");
  const goDate = (d: string) => { if (/^20\d\d-\d\d-\d\d$/.test(d)) load(iso(t(d) - 3 * DAY)); };

  const dates = useMemo(() => data ? Array.from({ length: data.days }, (_, i) => iso(t(data.from) + i * DAY)) : [], [data]);

  const vacant = useMemo(() => {
    if (!data) return [];
    const hostexRows = data.rows.filter(r => r.hostex).map(r => r.id);
    return dates.map(d => hostexRows.filter(row => !data.bars.some(b => b.row === row && b.start <= d && b.end > d)).length);
  }, [data, dates]);

  const clashes = data?.bars.filter(b => b.clash) ?? [];

  // overlapping stays (a clash) go on separate lines of their row, so none hides another
  const lanes = useMemo(() => {
    const lane: Record<string, number> = {}, count: Record<string, number> = {};
    if (!data) return { lane, count };
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
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="ml-auto">
          <h1 className="text-2xl font-black text-gray-900">לוח הזמנות</h1>
          <p className="text-gray-500 text-sm mt-0.5">כל הדירות: הזמנות Airbnb והזמנות האתר. לצפייה בלבד.</p>
        </div>
        <div className="flex items-center gap-2" dir="ltr">
          <button onClick={() => shift(-7)} dir="rtl" className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold hover:border-gray-300">« שבוע קודם</button>
          <button onClick={goToday} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold hover:border-gray-300">היום</button>
          <button onClick={() => shift(7)} dir="rtl" className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold hover:border-gray-300">שבוע הבא »</button>
          <input type="date" onChange={e => goDate(e.target.value)} className="px-2 py-1.5 rounded-xl bg-white border border-gray-200 text-sm" aria-label="קפיצה לתאריך" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs mb-3">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600" />הזמנת אתר</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-600 ring-2 ring-amber-400" />אתר, ממתין לאישור</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500" />Airbnb</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600" />ערוץ אחר</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-600 ring-2 ring-red-300" />⚠ התנגשות</span>
      </div>

      {data && !data.hostex && (
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm px-4 py-2">
          לא הצלחתי לקרוא את Hostex כרגע, אז מוצגות רק הזמנות האתר. נסה לרענן בעוד דקה.
        </div>
      )}
      {clashes.length > 0 && (
        <div className="mb-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">
          ⚠ יש התנגשות בטווח הזה: שתי הזמנות על אותו לילה באותה דירה ({[...new Set(clashes.map(b => data?.rows.find(r => r.id === b.row)?.title))].join(", ")}). מסומן באדום.
        </div>
      )}
      {err && <div className="mb-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-2">{err}</div>}

      {!data ? (
        <div className="text-center py-20 text-gray-400">{loading ? "טוען…" : ""}</div>
      ) : (
        <div className={`bg-white rounded-2xl border border-gray-100 overflow-x-auto ${loading ? "opacity-60" : ""}`} dir="ltr">
          <div style={{ width: NAME_W + dates.length * W }} className="relative">
            {/* header */}
            <div className="flex sticky top-0 z-20 bg-white border-b border-gray-100">
              <div style={{ width: NAME_W }} className="shrink-0 sticky left-0 z-30 bg-white px-3 py-2 text-xs text-gray-400 flex items-end">
                {dates[0] && `${MONTHS[new Date(t(dates[0])).getUTCMonth()]} ${new Date(t(dates[0])).getUTCFullYear()}`}
              </div>
              {dates.map(d => {
                const dt = new Date(t(d)); const wd = dt.getUTCDay();
                const isToday = d === data.today; const weekend = wd === 5 || wd === 6;
                return (
                  <div key={d} style={{ width: W }} className={`shrink-0 text-center py-1.5 border-l border-gray-50 ${isToday ? "bg-blue-50" : ""}`}>
                    <div className={`text-sm font-bold ${isToday ? "text-blue-600" : weekend ? "text-rose-500" : "text-gray-800"}`}>
                      {dt.getUTCDate() === 1 ? `${dt.getUTCDate()}/${dt.getUTCMonth() + 1}` : dt.getUTCDate()}
                    </div>
                    <div className={`text-[10px] ${isToday ? "text-blue-600 font-bold" : "text-gray-400"}`}>{isToday ? "היום" : WD[wd]}</div>
                  </div>
                );
              })}
            </div>
            {/* vacant */}
            <div className="flex border-b border-gray-100 bg-gray-50/60">
              <div style={{ width: NAME_W }} className="shrink-0 sticky left-0 z-10 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-500">פנויות</div>
              {vacant.map((v, i) => (
                <div key={i} style={{ width: W }} className={`shrink-0 text-center py-1.5 text-xs font-bold ${v === 0 ? "text-rose-500" : "text-gray-600"}`}>{v}</div>
              ))}
            </div>
            {/* rows */}
            {data.rows.map(row => (
              <div key={row.id} className="flex border-b border-gray-50 relative" style={{ height: H * (lanes.count[row.id] || 1) }}>
                <div style={{ width: NAME_W }} className="shrink-0 sticky left-0 z-10 bg-white px-3 flex items-center text-sm font-semibold text-gray-800 border-r border-gray-100 truncate" title={row.title}>
                  {row.title}{!row.hostex && <span className="mr-1 ml-1 text-[10px] text-gray-400 font-normal">(אתר)</span>}
                </div>
                {dates.map(d => (
                  <div key={d} style={{ width: W }} className={`shrink-0 border-l border-gray-50 ${d === data.today ? "bg-blue-50/50" : ""}`} />
                ))}
                {data.bars.filter(b => b.row === row.id).map(b => {
                  const s = Math.max(-0.5, (t(b.start) - t(data.from)) / DAY);
                  const e = Math.min(dates.length + 0.5, (t(b.end) - t(data.from)) / DAY);
                  if (e <= s) return null;
                  const nights = Math.round((t(b.end) - t(b.start)) / DAY);
                  const left = NAME_W + (s + 0.5) * W + 1, width = (e - s) * W - 2;
                  const color = b.clash ? "bg-red-600 text-white ring-2 ring-red-300" : COLORS[b.source];
                  const hold = b.source === "site" && b.status === "hold" && !b.clash ? "ring-2 ring-amber-400" : "";
                  const tip = [
                    b.title, `${b.start.split("-").reverse().join(".")} → ${b.end.split("-").reverse().join(".")} · ${nights} לילות`,
                    b.source === "site" ? `הזמנת אתר ${b.codes?.join(", ")}${b.status === "hold" ? " · ממתין לאישור" : ""}` : b.channel,
                    b.guests ? `${b.guests} אורחים` : "", b.clash ? "⚠ מתנגש עם הזמנה אחרת" : "",
                  ].filter(Boolean).join("\n");
                  return (
                    <div key={b.id} title={tip}
                      className={`absolute rounded-md px-1.5 overflow-hidden whitespace-nowrap leading-tight ${color} ${hold}`}
                      style={{ left, width, top: 4 + H * (lanes.lane[b.id] || 0), height: H - 8, zIndex: 5 }}>
                      <div className="text-[12px] font-bold truncate" dir="auto">{b.clash ? "⚠ " : ""}{b.source === "site" ? "SkiShare · " : ""}{b.title}</div>
                      <div className="text-[10px] opacity-90 truncate" dir="auto">
                        {b.source === "site" ? `אתר · ${b.codes?.join(", ")}` : b.channel} · {nights} לילות
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
