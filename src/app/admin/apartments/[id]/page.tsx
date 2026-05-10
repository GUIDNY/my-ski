"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

/* ── Types ───────────────────────────────────────────────── */
type Apt = { id: string; name: string; price_per_night: number; type: string };
type Block = { date: string; status: string; source: string; note?: string };
type Booking = { check_in: string; check_out: string; status: string; customer_name: string; guests: number };
type PricingRule = { id: string; label: string; type: string; start_date?: string; end_date?: string; months?: number[]; weekdays?: number[]; price: number; priority: number };
type IcalSource = { id: string; platform: string; ical_url: string; last_synced?: string };

/* ── Helpers ─────────────────────────────────────────────── */
const MONTHS_HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const DAYS_HE   = ["א'","ב'","ג'","ד'","ה'","ו'","ש'"];
const WEEKDAYS_HE = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
const MONTH_NAMES_HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

function fmtDate(s: string) {
  const d = new Date(s); return `${d.getDate()} ${MONTHS_HE[d.getMonth()]}`;
}
function isoMonth(y: number, m: number) { return `${y}-${String(m+1).padStart(2,"0")}`; }

function getEffectivePrice(date: Date, basePrice: number, rules: PricingRule[]) {
  const sorted = [...rules].sort((a,b) => b.priority - a.priority);
  const iso = date.toISOString().split("T")[0];
  const wd  = date.getDay();
  const mo  = date.getMonth();
  for (const r of sorted) {
    if (r.type === "date_range" && r.start_date && r.end_date && iso >= r.start_date && iso <= r.end_date) return r.price;
    if (r.type === "month"      && r.months?.includes(mo)) return r.price;
    if (r.type === "weekday"    && r.weekdays?.includes(wd)) return r.price;
  }
  return basePrice;
}

/* ── Tabs ────────────────────────────────────────────────── */
type Tab = "calendar" | "pricing" | "bookings" | "sync";

/* ── Calendar ────────────────────────────────────────────── */
function CalendarTab({ aptId, basePrice, rules }: { aptId: string; basePrice: number; rules: PricingRule[] }) {
  const now   = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [blocks, setBlocks]   = useState<Block[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]  = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/availability?apartment_id=${aptId}&month=${isoMonth(year, month)}`);
    const d   = await res.json();
    setBlocks(d.blocks ?? []);
    setBookings(d.bookings ?? []);
    setLoading(false);
  }, [aptId, year, month]);

  useEffect(() => { load(); }, [load]);

  const blockMap = Object.fromEntries(blocks.map(b => [b.date, b]));
  const bookedDates = new Set<string>();
  bookings.forEach(b => {
    const s = new Date(b.check_in), e = new Date(b.check_out);
    for (let d = new Date(s); d < e; d.setDate(d.getDate()+1))
      bookedDates.add(d.toISOString().split("T")[0]);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  while (cells.length % 7) cells.push(null);

  const toggleDate = async (dayNum: number) => {
    const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`;
    if (bookedDates.has(iso)) return;
    if (blockMap[iso]) {
      await fetch(`/api/availability?apartment_id=${aptId}&date=${iso}`, { method: "DELETE" });
    } else {
      await fetch("/api/availability", { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ apartment_id: aptId, date: iso, status: "blocked" }) });
    }
    load();
  };

  const navPrev = () => { if (month === 0) { setYear(y=>y-1); setMonth(11); } else setMonth(m=>m-1); };
  const navNext = () => { if (month === 11) { setYear(y=>y+1); setMonth(0); } else setMonth(m=>m+1); };

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={navPrev} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600">→</button>
        <h3 className="font-black text-gray-900 text-lg">{MONTHS_HE[month]} {year}</h3>
        <button onClick={navNext} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600">←</button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {[["bg-white border-gray-200","פנוי"],["bg-red-100 border-red-200","חסום"],["bg-blue-100 border-blue-200","הזמנה פנימית"],["bg-orange-100 border-orange-200","Airbnb/Booking"]].map(([cls,lbl]) => (
          <div key={lbl} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className={`w-3.5 h-3.5 rounded border ${cls}`} />
            {lbl}
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? <div className="h-48 flex items-center justify-center text-gray-400 text-sm">טוען...</div> : (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {DAYS_HE.map(d => <div key={d} className="py-2 text-center text-xs font-bold text-gray-400">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="h-14 md:h-16 border-b border-l border-gray-50 bg-gray-50/30" />;
              const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const isBooked   = bookedDates.has(iso);
              const isExternal = blockMap[iso]?.source !== "manual" && blockMap[iso];
              const isBlocked  = blockMap[iso] && !isBooked;
              const price = getEffectivePrice(new Date(iso), basePrice, rules);
              const today = new Date().toISOString().split("T")[0];
              const isPast = iso < today;

              let bg = "bg-white hover:bg-gray-50";
              if (isBooked)                       bg = "bg-blue-50 hover:bg-blue-100";
              else if (isExternal)                bg = "bg-orange-50";
              else if (isBlocked)                 bg = "bg-red-50 hover:bg-red-100";

              return (
                <div key={i}
                  onClick={() => !isPast && !isBooked && !isExternal && toggleDate(day)}
                  className={`h-14 md:h-16 border-b border-l border-gray-100 p-1 flex flex-col justify-between transition-colors ${bg} ${!isPast && !isBooked && !isExternal ? "cursor-pointer" : "cursor-default"} ${isPast ? "opacity-40" : ""}`}
                >
                  <span className={`text-xs font-bold ${iso === today ? "text-blue-600" : "text-gray-700"}`}>{day}</span>
                  <span className="text-[9px] text-gray-400 font-medium">€{price}</span>
                  {isBlocked && !isBooked && <span className="text-[8px] text-red-400 font-bold leading-none">חסום</span>}
                  {isBooked  && <span className="text-[8px] text-blue-500 font-bold leading-none">הזמנה</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">לחץ על יום כדי לחסום / לשחרר. ימים עם הזמנה נעולים.</p>
    </div>
  );
}

/* ── Pricing ─────────────────────────────────────────────── */
function PricingTab({ aptId, basePrice }: { aptId: string; basePrice: number }) {
  const [rules, setRules]   = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]     = useState({ label:"", type:"date_range", start_date:"", end_date:"", months:[] as number[], weekdays:[] as number[], price:"", priority:"5" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/pricing-rules?apartment_id=${aptId}`);
    setRules(await res.json());
    setLoading(false);
  }, [aptId]);
  useEffect(() => { load(); }, [load]);

  const del = async (id: string) => {
    await fetch(`/api/pricing-rules?id=${id}`, { method: "DELETE" });
    load();
  };

  const save = async () => {
    if (!form.label || !form.price) return;
    setSaving(true);
    const body: Record<string,unknown> = { apartment_id: aptId, label: form.label, type: form.type, price: parseFloat(form.price), priority: parseInt(form.priority) };
    if (form.type === "date_range") { body.start_date = form.start_date; body.end_date = form.end_date; }
    if (form.type === "month")      body.months   = form.months;
    if (form.type === "weekday")    body.weekdays = form.weekdays;
    await fetch("/api/pricing-rules", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    setShowForm(false);
    setForm({ label:"", type:"date_range", start_date:"", end_date:"", months:[], weekdays:[], price:"", priority:"5" });
    setSaving(false);
    load();
  };

  const toggleArr = (arr: number[], val: number) => arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val];

  const typeLabel = (r: PricingRule) => {
    if (r.type === "date_range") return `${fmtDate(r.start_date!)} – ${fmtDate(r.end_date!)}`;
    if (r.type === "month")      return r.months?.map(m => MONTH_NAMES_HE[m]).join(", ") ?? "";
    if (r.type === "weekday")    return r.weekdays?.map(d => WEEKDAYS_HE[d]).join(", ") ?? "";
    return "";
  };

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div>
      {/* Base price card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-0.5">מחיר בסיס</p>
          <p className="text-2xl font-black text-blue-700">€{basePrice} <span className="text-sm font-medium text-blue-400">/ לילה</span></p>
        </div>
        <p className="text-xs text-blue-400 max-w-[160px] text-left">שינוי מחיר הבסיס בדף ניהול הדירה הראשי</p>
      </div>

      {/* Rules list */}
      {loading ? <p className="text-sm text-gray-400 text-center py-8">טוען...</p> : (
        <div className="space-y-2.5 mb-5">
          {rules.length === 0 && <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl">אין חוקי מחיר מיוחדים</p>}
          {rules.map(r => (
            <div key={r.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{r.label}</p>
                <p className="text-xs text-gray-400 truncate">{typeLabel(r)}</p>
              </div>
              <p className="font-black text-gray-900">€{r.price}</p>
              <span className="text-xs text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full">עדיפות {r.priority}</span>
              <button onClick={() => del(r.id)} className="text-red-300 hover:text-red-500 transition-colors text-lg leading-none">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Add rule */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
          + הוסף חוק מחיר
        </button>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3" dir="rtl">
          <h4 className="font-black text-gray-900 text-sm mb-3">חוק מחיר חדש</h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-gray-500 block mb-1">שם</label>
              <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder='למשל: "פסח 2026"' className={inp} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">סוג</label>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value,months:[],weekdays:[]}))} className={inp}>
                <option value="date_range">טווח תאריכים</option>
                <option value="month">חודש מסוים</option>
                <option value="weekday">ימי שבוע</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">מחיר (€)</label>
              <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="0" className={inp} dir="ltr" />
            </div>
          </div>

          {form.type === "date_range" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">מתאריך</label>
                <input type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} className={inp} dir="ltr" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">עד תאריך</label>
                <input type="date" value={form.end_date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} className={inp} dir="ltr" />
              </div>
            </div>
          )}

          {form.type === "month" && (
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">חודשים</label>
              <div className="flex flex-wrap gap-2">
                {MONTH_NAMES_HE.map((m,i) => (
                  <button key={i} onClick={()=>setForm(f=>({...f,months:toggleArr(f.months,i)}))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${form.months.includes(i) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.type === "weekday" && (
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-2">ימים</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS_HE.map((d,i) => (
                  <button key={i} onClick={()=>setForm(f=>({...f,weekdays:toggleArr(f.weekdays,i)}))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${form.weekdays.includes(i) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">עדיפות (גבוה = דורס)</label>
            <input type="number" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className={inp} dir="ltr" />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-700 transition-colors disabled:opacity-50">
              {saving ? "שומר..." : "שמור"}
            </button>
            <button onClick={()=>setShowForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Bookings ────────────────────────────────────────────── */
function BookingsTab({ aptId }: { aptId: string }) {
  const [bookings, setBookings] = useState<(Booking & { id: string; total_price: number; customer_email: string; customer_phone?: string; add_ons?: Record<string,unknown> })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bookings?apartment_id=${aptId}`)
      .then(r => r.json())
      .then(d => { setBookings(Array.isArray(d) ? d.filter((b:{apartment_id:string})=>b.apartment_id===aptId) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [aptId]);

  const STATUS = { pending:"ממתין",confirmed:"מאושר",cancelled:"בוטל" } as Record<string,string>;
  const STATUS_COLOR = { pending:"bg-amber-100 text-amber-700",confirmed:"bg-green-100 text-green-700",cancelled:"bg-red-100 text-red-600" } as Record<string,string>;

  if (loading) return <p className="text-sm text-gray-400 text-center py-10">טוען...</p>;
  if (!bookings.length) return (
    <div className="text-center py-16 bg-gray-50 rounded-xl">
      <p className="text-gray-400 font-medium">אין הזמנות עדיין</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {bookings.map(b => {
        const nights = b.check_in && b.check_out ? Math.round((new Date(b.check_out).getTime()-new Date(b.check_in).getTime())/86400000) : 0;
        return (
          <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-black text-gray-900">{b.customer_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{b.customer_email} {b.customer_phone && `· ${b.customer_phone}`}</p>
                <p className="text-sm text-gray-500 mt-1">{fmtDate(b.check_in)} — {fmtDate(b.check_out)} · {nights} לילות · {b.guests} אנשים</p>
              </div>
              <div className="text-left shrink-0">
                <p className="font-black text-gray-900">€{Number(b.total_price).toLocaleString()}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[b.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {STATUS[b.status] ?? b.status}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Sync ────────────────────────────────────────────────── */
function SyncTab({ aptId }: { aptId: string }) {
  const [sources, setSources] = useState<IcalSource[]>([]);
  const [platform, setPlatform] = useState("airbnb");
  const [url, setUrl]           = useState("");
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [adding, setAdding]     = useState(false);
  const [msg, setMsg]           = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/ical-sync?apartment_id=${aptId}`);
    setSources(await r.json());
    setLoading(false);
  }, [aptId]);
  useEffect(() => { load(); }, [load]);

  const addSource = async () => {
    if (!url) return;
    setAdding(true);
    await fetch("/api/ical-sync", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"add_source", apartment_id:aptId, platform, ical_url:url }) });
    setUrl(""); setAdding(false); load();
  };

  const sync = async () => {
    setSyncing(true); setMsg("");
    const r = await fetch("/api/ical-sync", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"sync", apartment_id:aptId }) });
    const d = await r.json();
    setMsg(`סונכרן בהצלחה — ${d.synced} ימים עודכנו`);
    setSyncing(false); load();
  };

  const del = async (id: string) => {
    await fetch("/api/ical-sync", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"delete_source", id }) });
    load();
  };

  const PLATFORM_LABELS: Record<string,{label:string;color:string}> = {
    airbnb:  {label:"Airbnb",    color:"bg-rose-100 text-rose-600"},
    booking: {label:"Booking.com",color:"bg-blue-100 text-blue-600"},
    other:   {label:"אחר",       color:"bg-gray-100 text-gray-600"},
  };

  const inp = "flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div dir="rtl">
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-sm text-amber-700">
        <p className="font-bold mb-1">כיצד לסנכרן עם Airbnb / Booking.com</p>
        <p className="text-xs leading-relaxed">העתק את קישור ה-iCal מהפלטפורמה (ב-Airbnb: ניהול נכסים → לוח שנה → ייצוא) והכנס אותו כאן. כל לחיצה על "סנכרן" תמשוך את ההזמנות העדכניות.</p>
      </div>

      {/* Existing sources */}
      {loading ? <p className="text-sm text-gray-400 text-center py-4">טוען...</p> : sources.length > 0 && (
        <div className="space-y-2.5 mb-5">
          {sources.map(s => {
            const pl = PLATFORM_LABELS[s.platform] ?? PLATFORM_LABELS.other;
            return (
              <div key={s.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${pl.color}`}>{pl.label}</span>
                <p className="text-xs text-gray-400 truncate flex-1">{s.ical_url}</p>
                {s.last_synced && <p className="text-[10px] text-gray-300 shrink-0">סונכרן {new Date(s.last_synced).toLocaleDateString("he-IL")}</p>}
                <button onClick={()=>del(s.id)} className="text-red-300 hover:text-red-500 text-lg leading-none">×</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add source */}
      <div className="space-y-3 mb-5">
        <div className="flex gap-2">
          <select value={platform} onChange={e=>setPlatform(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0">
            <option value="airbnb">Airbnb</option>
            <option value="booking">Booking.com</option>
            <option value="other">אחר</option>
          </select>
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="קישור iCal..." className={inp} dir="ltr" />
          <button onClick={addSource} disabled={adding||!url} className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-700 transition-colors disabled:opacity-40 shrink-0">
            {adding ? "..." : "הוסף"}
          </button>
        </div>
      </div>

      {/* Sync button */}
      <button onClick={sync} disabled={syncing||sources.length===0}
        className="w-full py-3.5 rounded-xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
        {syncing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> מסנכרן...</> : "↻ סנכרן עכשיו"}
      </button>
      {msg && <p className="text-green-600 text-sm font-medium text-center mt-3">{msg}</p>}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */
export default function ApartmentAdmin() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [apt,      setApt]      = useState<Apt | null>(null);
  const [rules,    setRules]    = useState<PricingRule[]>([]);
  const [tab,      setTab]      = useState<Tab>("calendar");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/apartments/${id}`).then(r=>r.json()),
      fetch(`/api/pricing-rules?apartment_id=${id}`).then(r=>r.json()),
    ]).then(([a, r]) => {
      setApt(a);
      setRules(Array.isArray(r) ? r : []);
      setLoading(false);
    });
  }, [id]);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key:"calendar", label:"לוח שנה", icon:"📅" },
    { key:"pricing",  label:"מחירים",  icon:"💰" },
    { key:"bookings", label:"הזמנות",  icon:"👥" },
    { key:"sync",     label:"סינכרון", icon:"🔄" },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push("/admin")}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors text-lg">
            →
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-gray-900 text-base truncate">{apt?.name ?? "דירה"}</h1>
            <p className="text-xs text-gray-400">{apt?.type} · Val Thorens</p>
          </div>
          <div className="text-left shrink-0">
            <p className="text-xs text-gray-400">מחיר בסיס</p>
            <p className="font-black text-gray-900">€{apt?.price_per_night}/לילה</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-2xl mx-auto px-4 flex border-t border-gray-100 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {tab === "calendar" && apt && <CalendarTab aptId={id} basePrice={apt.price_per_night} rules={rules} />}
        {tab === "pricing"  && apt && <PricingTab  aptId={id} basePrice={apt.price_per_night} />}
        {tab === "bookings" && <BookingsTab aptId={id} />}
        {tab === "sync"     && <SyncTab aptId={id} />}
      </div>
    </div>
  );
}
