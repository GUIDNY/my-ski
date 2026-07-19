"use client";
import { useEffect, useRef, useState } from "react";

type Payment = {
  id: string; property_id: string; label: string; month: string | null;
  due_date: string | null; amount: number; paid: boolean; paid_date: string | null;
  kind: "rent" | "deposit" | string; note: string | null;
};
type Prop = {
  id: string; kind: string; name: string; image: string | null;
  agency_name: string | null; link: string | null;
  airbnb_open: boolean; issues: string | null; contact: string | null;
  revenue: number; expenses: number; notes: string | null;
  created_at: string; payments: Payment[];
};

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const money = (n: number) => `€${Math.round(n).toLocaleString()}`;

function SingleImage({ value, onChange }: { value: string | null; onChange: (url: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (files: FileList) => {
    setBusy(true);
    const fd = new FormData(); fd.append("file", files[0]);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const { url } = await res.json();
    if (url) onChange(url);
    setBusy(false);
  };
  return (
    <div>
      <label className="text-xs font-bold text-gray-400 block mb-1.5">תמונה (אחת)</label>
      {value ? (
        <div className="relative w-28 h-24 rounded-xl overflow-hidden border border-gray-200 group">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange(null)}
            className="absolute inset-0 bg-black/50 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">החלף / מחק</button>
        </div>
      ) : (
        <div onClick={() => ref.current?.click()}
          className="w-28 h-24 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl flex items-center justify-center cursor-pointer text-center">
          {busy ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <span className="text-2xl">📸</span>}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { if (e.target.files?.length) upload(e.target.files); }} />
    </div>
  );
}

export default function ManagedProperties({ kind }: { kind: "seasonal" | "agency" }) {
  const isAgency = kind === "agency";
  const [rows, setRows] = useState<Prop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [view, setView] = useState<"cards" | "list">("cards");
  const [payModal, setPayModal] = useState<Prop | null>(null);
  const [showMonths, setShowMonths] = useState(false);
  const emptyForm = (): Partial<Prop> => ({ kind, name: "", image: null, airbnb_open: false, revenue: 0, expenses: 0 });
  const [form, setForm] = useState<Partial<Prop>>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const r = await fetch(`/api/managed-properties?kind=${kind}`);
    setRows(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const save = async () => {
    if (!form.name?.trim()) { alert("שם הדירה חובה"); return; }
    setSaving(true);
    const url = editing ? `/api/managed-properties/${editing}` : "/api/managed-properties";
    await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setShowForm(false); setEditing(null); setForm(emptyForm()); load();
  };
  const edit = (p: Prop) => { setForm(p); setEditing(p.id); setShowForm(true); };
  const openNew = () => { setForm(emptyForm()); setEditing(null); setShowForm(true); };
  const remove = async (id: string) => {
    if (!confirm("למחוק את הדירה וכל התשלומים שלה?")) return;
    await fetch(`/api/managed-properties/${id}`, { method: "DELETE" }); load();
  };

  // profit/loss + payments summary
  const profit = (p: Prop) => (Number(p.revenue) || 0) - (Number(p.expenses) || 0);
  const payTotals = (p: Prop) => {
    const sum = (f: (x: Payment) => boolean) => p.payments.filter(f).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const total = sum(() => true);
    const paid = sum(x => x.paid);
    const rent = sum(x => x.kind !== "deposit");
    const deposit = sum(x => x.kind === "deposit");
    return { total, paid, left: total - paid, rent, deposit, count: p.payments.length, paidCount: p.payments.filter(x => x.paid).length };
  };

  // portfolio-wide totals
  const totals = {
    count: rows.length,
    revenue: rows.reduce((s, p) => s + (Number(p.revenue) || 0), 0),
    expenses: rows.reduce((s, p) => s + (Number(p.expenses) || 0), 0),
    payTotal: rows.reduce((s, p) => s + p.payments.reduce((a, x) => a + (Number(x.amount) || 0), 0), 0),
    payPaid: rows.reduce((s, p) => s + p.payments.filter(x => x.paid).reduce((a, x) => a + (Number(x.amount) || 0), 0), 0),
    payDeposit: rows.reduce((s, p) => s + p.payments.filter(x => x.kind === "deposit").reduce((a, x) => a + (Number(x.amount) || 0), 0), 0),
  };
  const byMonth = MONTHS.map(m => {
    const pays = rows.flatMap(p => p.payments).filter(x => x.month === m);
    return { month: m, total: pays.reduce((a, x) => a + (Number(x.amount) || 0), 0), paid: pays.filter(x => x.paid).reduce((a, x) => a + (Number(x.amount) || 0), 0), count: pays.length };
  }).filter(x => x.count > 0);
  const noMonth = rows.flatMap(p => p.payments).filter(x => !x.month);
  const modalProp = payModal ? rows.find(r => r.id === payModal.id) ?? payModal : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{isAgency ? "ניהול דירות סוכנות" : "ניהול דירות עונתיות"}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isAgency ? "דירות מסוכנויות — תשלומים, רווח/הפסד וקישורים" : "הדירות העונתיות שלנו — שכר דירה, רווח/הפסד וסטטוס"}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* view toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setView("cards")} title="כרטיסיות"
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${view === "cards" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}>▦<span className="hidden sm:inline"> כרטיסיות</span></button>
            <button onClick={() => setView("list")} title="רשימה"
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${view === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}>☰<span className="hidden sm:inline"> רשימה</span></button>
          </div>
          <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition">+ הוסף דירה</button>
        </div>
      </div>

      {/* portfolio summary */}
      {!loading && rows.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400">סה״כ דירות</p>
              <p className="text-2xl font-black text-gray-900">{totals.count}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400">סה״כ הכנסות</p>
              <p className="text-2xl font-black text-emerald-600">{money(totals.revenue)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400">סה״כ הוצאות</p>
              <p className="text-2xl font-black text-red-500">{money(totals.expenses)}</p>
            </div>
            <button onClick={() => setShowMonths(v => !v)} className="bg-white rounded-2xl border border-gray-100 hover:border-blue-300 p-4 text-right transition">
              <p className="text-xs text-gray-400 flex items-center justify-between">שולם / חוזה כולל <span className="text-blue-600 font-bold">{showMonths ? "סגור ▲" : "לפי חודש ▼"}</span></p>
              <p className="text-2xl font-black text-gray-900">{money(totals.payPaid)}<span className="text-sm text-gray-400"> / {money(totals.payTotal)}</span></p>
              <p className="text-[11px] text-gray-400 mt-0.5">יתרה {money(totals.payTotal - totals.payPaid)}{totals.payDeposit > 0 && ` · פיקדונות ${money(totals.payDeposit)}`}</p>
            </button>
          </div>

          {/* monthly breakdown */}
          {showMonths && (
            <div className="mt-3 bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="font-bold text-gray-800 text-sm mb-3">תשלומים לפי חודש</h3>
              {byMonth.length === 0 && !noMonth.length ? (
                <p className="text-sm text-gray-400">עדיין לא נרשמו תשלומים.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {byMonth.map(m => (
                    <div key={m.month} className="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-2.5">
                      <span className="text-sm font-bold text-gray-700">{m.month}</span>
                      <span className="text-sm"><b className={m.paid >= m.total ? "text-emerald-600" : "text-gray-800"}>{money(m.paid)}</b><span className="text-gray-400"> / {money(m.total)}</span>{m.paid < m.total && <b className="text-red-500 text-xs"> · חסר {money(m.total - m.paid)}</b>}</span>
                    </div>
                  ))}
                  {noMonth.length > 0 && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-2.5">
                      <span className="text-sm font-bold text-gray-400">ללא חודש</span>
                      <span className="text-sm text-gray-500">{money(noMonth.reduce((a, x) => a + (Number(x.amount) || 0), 0))}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          עדיין אין דירות. לחץ/י "הוסף דירה" כדי להתחיל.
        </div>
      ) : (
        view === "list" ? (
        <div className="space-y-2.5">
          {rows.map(p => {
            const pl = profit(p); const pt = payTotals(p);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
                <div className="flex items-start gap-3">
                  {p.image
                    ? <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                    : <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0">🏔️</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 leading-tight">{p.name}</h3>
                      <span className={`font-black text-sm whitespace-nowrap ${pl >= 0 ? "text-emerald-600" : "text-red-500"}`}>{pl >= 0 ? "+" : "−"}{money(Math.abs(pl))}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {isAgency && p.agency_name && <span className="text-xs text-gray-500">🏢 {p.agency_name}</span>}
                      {!isAgency && p.airbnb_open && <span className="text-[11px] font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">🅰️ Airbnb</span>}
                      {!isAgency && p.issues && <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⚠️ בעיה</span>}
                      {isAgency && p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-blue-600">קישור ↗</a>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {pt.count > 0 ? <span>💰 {money(pt.paid)}/{money(pt.total)}{pt.left > 0 && <b className="text-red-500"> · חסר {money(pt.left)}</b>}</span> : <span className="text-gray-400">אין תשלומים</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100 flex-wrap">
                  <button onClick={() => setPayModal(p)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">💰 ניהול תשלומים</button>
                  <div className="flex-1" />
                  <button onClick={() => edit(p)} className="text-gray-500 hover:text-gray-800 font-medium text-xs px-2">עריכה</button>
                  <button onClick={() => remove(p.id)} className="text-red-500 hover:text-red-700 font-medium text-xs px-2">מחיקה</button>
                </div>
              </div>
            );
          })}
        </div>
        ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {rows.map(p => {
            const pl = profit(p); const pt = payTotals(p);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                {/* image header + overlays */}
                <div className="relative h-40 bg-gray-100">
                  {p.image
                    ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🏔️</div>}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 right-4 left-4 flex items-end justify-between">
                    <div className="text-white">
                      <h3 className="font-black text-lg leading-tight drop-shadow">{p.name}</h3>
                      {isAgency && p.agency_name && <p className="text-xs opacity-90">🏢 {p.agency_name}</p>}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-black shadow ${pl >= 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                      {pl >= 0 ? "+" : "−"}{money(Math.abs(pl))}
                    </span>
                  </div>
                  {/* status badges */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    {!isAgency && (
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${p.airbnb_open ? "bg-pink-500 text-white" : "bg-white/90 text-gray-500"}`}>
                        {p.airbnb_open ? "🅰️ Airbnb" : "לא ב-Airbnb"}
                      </span>
                    )}
                    {!isAgency && p.issues && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-sm">⚠️ בעיה</span>}
                    {isAgency && p.link && <a href={p.link} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-blue-600 shadow-sm">קישור ↗</a>}
                  </div>
                </div>

                {/* body */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  {/* revenue / expenses / profit */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl py-2"><p className="text-[11px] text-gray-400">הכנסות</p><p className="font-bold text-gray-800 text-sm">{money(Number(p.revenue) || 0)}</p></div>
                    <div className="bg-gray-50 rounded-xl py-2"><p className="text-[11px] text-gray-400">הוצאות</p><p className="font-bold text-gray-800 text-sm">{money(Number(p.expenses) || 0)}</p></div>
                    <div className={`rounded-xl py-2 ${pl >= 0 ? "bg-emerald-50" : "bg-red-50"}`}><p className="text-[11px] text-gray-400">רווח/הפסד</p><p className={`font-black text-sm ${pl >= 0 ? "text-emerald-600" : "text-red-500"}`}>{pl >= 0 ? "+" : "−"}{money(Math.abs(pl))}</p></div>
                  </div>

                  {/* payments summary */}
                  {pt.count === 0 ? (
                    <div className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">💰 עדיין אין תשלומים</div>
                  ) : (
                    <div className="bg-blue-50/60 rounded-xl px-3 py-2.5 text-xs space-y-1">
                      <div className="flex justify-between"><span className="text-gray-500">חוזה כולל</span><b className="text-gray-800">{money(pt.total)}</b></div>
                      <div className="flex justify-between"><span className="text-gray-500">שולם</span><b className="text-emerald-600">{money(pt.paid)}</b></div>
                      <div className="flex justify-between"><span className="text-gray-500">יתרה לתשלום</span><b className="text-red-500">{money(pt.left)}</b></div>
                      {pt.deposit > 0 && <div className="flex justify-between border-t border-blue-100 pt-1 mt-1"><span className="text-gray-400">מזה פיקדון (החזרי)</span><span className="text-gray-500">{money(pt.deposit)}</span></div>}
                    </div>
                  )}

                  {/* contact / issues / notes */}
                  {(p.contact || p.issues || p.notes) && (
                    <div className="space-y-1.5 text-xs">
                      {p.contact && <p className="text-gray-600"><b className="text-gray-400">☎ קשר:</b> {p.contact}</p>}
                      {p.issues && <p className="text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5"><b>⚠ בעיות:</b> {p.issues}</p>}
                      {p.notes && <p className="text-gray-500"><b className="text-gray-400">📝</b> {p.notes}</p>}
                    </div>
                  )}

                  {/* actions */}
                  <div className="flex items-center gap-3 pt-3 mt-auto border-t border-gray-100">
                    <button onClick={() => setPayModal(p)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-sm px-3.5 py-1.5 rounded-lg">💰 ניהול תשלומים</button>
                    <div className="flex-1" />
                    <button onClick={() => edit(p)} className="text-gray-500 hover:text-gray-800 font-medium text-xs">עריכה</button>
                    <button onClick={() => remove(p.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">מחיקה</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* Add / edit form */}
      {showForm && (
        <div className="fixed inset-0 z-[80] bg-black/55 flex items-center justify-center p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-4">{editing ? "עריכת דירה" : "הוספת דירה"}</h2>
            <div className="space-y-3">
              <SingleImage value={form.image ?? null} onChange={url => setForm(f => ({ ...f, image: url }))} />
              <input placeholder="שם הדירה" value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
              {isAgency && (
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="שם הסוכנות" value={form.agency_name ?? ""} onChange={e => setForm(f => ({ ...f, agency_name: e.target.value }))} className={inputCls} />
                  <input placeholder="קישור (URL)" dir="ltr" value={form.link ?? ""} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} className={inputCls} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-400 block mb-1">הכנסות (€)</label>
                  <input type="number" value={form.revenue ?? ""} onChange={e => setForm(f => ({ ...f, revenue: +e.target.value }))} className={inputCls} /></div>
                <div><label className="text-xs text-gray-400 block mb-1">הוצאות (€)</label>
                  <input type="number" value={form.expenses ?? ""} onChange={e => setForm(f => ({ ...f, expenses: +e.target.value }))} className={inputCls} /></div>
              </div>
              <input placeholder="פרטי קשר (טלפון / איש קשר בדירה)" value={form.contact ?? ""} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} className={inputCls} />
              {!isAgency && (
                <>
                  <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 cursor-pointer">
                    <span className="text-sm font-semibold text-gray-700">פתוחה להשכרה ב-Airbnb</span>
                    <input type="checkbox" checked={!!form.airbnb_open} onChange={e => setForm(f => ({ ...f, airbnb_open: e.target.checked }))} className="w-5 h-5 accent-pink-600" />
                  </label>
                  <textarea placeholder="בעיות / תקלות בדירה (אם יש)" rows={2} value={form.issues ?? ""} onChange={e => setForm(f => ({ ...f, issues: e.target.value }))} className={inputCls} />
                </>
              )}
              <textarea placeholder="הערות" rows={2} value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={save} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition">{saving ? "שומר…" : "שמור"}</button>
              <button onClick={() => setShowForm(false)} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Payments management popup */}
      {modalProp && (
        <div className="fixed inset-0 z-[80] bg-black/55 flex items-center justify-center p-4" onClick={() => setPayModal(null)}>
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {modalProp.image && <img src={modalProp.image} alt="" className="w-11 h-11 rounded-xl object-cover" />}
                <div>
                  <h2 className="text-lg font-black text-gray-900">{modalProp.name}</h2>
                  <p className="text-xs text-gray-400">ניהול תשלומי שכר דירה</p>
                </div>
              </div>
              <button onClick={() => setPayModal(null)} className="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-400 text-xl">✕</button>
            </div>
            <PaymentsPanel property={modalProp} onChange={load} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Payments panel ──────────────────────────────────────────
function PaymentsPanel({ property, onChange }: { property: Prop; onChange: () => void }) {
  const [np, setNp] = useState<Partial<Payment>>({ label: "", month: "", due_date: "", amount: 0, kind: "rent", note: "" });
  const [busy, setBusy] = useState(false);

  const sum = (f: (x: Payment) => boolean) => property.payments.filter(f).reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const total = sum(() => true), paid = sum(x => x.paid), deposit = sum(x => x.kind === "deposit");

  const add = async () => {
    if (!np.amount) { alert("הזן/י סכום"); return; }
    setBusy(true);
    await fetch(`/api/managed-properties/${property.id}/payments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...np, label: np.label || (np.kind === "deposit" ? "פיקדון" : "שכירות") }),
    });
    setBusy(false); setNp({ label: "", month: "", due_date: "", amount: 0, kind: "rent", note: "" }); onChange();
  };
  const togglePaid = async (pay: Payment) => {
    await fetch(`/api/property-payments/${pay.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: !pay.paid, paid_date: !pay.paid ? new Date().toISOString().slice(0, 10) : null }),
    });
    onChange();
  };
  const del = async (id: string) => { if (!confirm("למחוק תשלום?")) return; await fetch(`/api/property-payments/${id}`, { method: "DELETE" }); onChange(); };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 mt-3">
      {/* summary */}
      {property.payments.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="bg-gray-50 rounded-xl py-2"><p className="text-[11px] text-gray-400">חוזה כולל</p><p className="font-black text-gray-800 text-sm">{money(total)}</p></div>
          <div className="bg-emerald-50 rounded-xl py-2"><p className="text-[11px] text-gray-400">שולם</p><p className="font-black text-emerald-600 text-sm">{money(paid)}</p></div>
          <div className="bg-red-50 rounded-xl py-2"><p className="text-[11px] text-gray-400">יתרה לתשלום</p><p className="font-black text-red-500 text-sm">{money(total - paid)}</p></div>
        </div>
      )}
      {deposit > 0 && <p className="text-[11px] text-gray-400 mb-3 -mt-1">מזה פיקדון החזרי: {money(deposit)} (לא הוצאה סופית)</p>}

      <h3 className="font-bold text-gray-800 text-sm mb-2">💰 לוח תשלומים</h3>
      {property.payments.length > 0 && (
        <div className="divide-y divide-gray-50 mb-3">
          {property.payments.map(pay => {
            const isDep = pay.kind === "deposit";
            return (
              <div key={pay.id} className="flex items-start gap-2.5 py-2 text-sm">
                <input type="checkbox" checked={pay.paid} onChange={() => togglePaid(pay)} className="w-5 h-5 accent-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`font-semibold ${pay.paid ? "text-gray-400 line-through" : "text-gray-800"}`}>{pay.label || "תשלום"}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDep ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{isDep ? "פיקדון" : "שכירות"}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{pay.due_date ? `עד ${pay.due_date}` : "בעת חתימת החוזה"}{pay.month ? ` · ${pay.month}` : ""}</span>
                  {pay.note && <span className="block text-[11px] text-gray-500">📝 {pay.note}</span>}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`font-bold whitespace-nowrap ${pay.paid ? "text-emerald-600" : "text-gray-800"}`}>{money(Number(pay.amount))}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${pay.paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{pay.paid ? "שולם" : "ממתין לתשלום"}</span>
                </div>
                <button onClick={() => del(pay.id)} className="text-red-400 hover:text-red-600 text-xs mt-0.5">✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* add row */}
      <div className="border-t border-gray-100 pt-3">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
          <select value={np.kind ?? "rent"} onChange={e => setNp(v => ({ ...v, kind: e.target.value }))} className={inputCls}>
            <option value="rent">שכירות</option>
            <option value="deposit">פיקדון</option>
          </select>
          <input placeholder="תיאור" value={np.label ?? ""} onChange={e => setNp(v => ({ ...v, label: e.target.value }))} className={inputCls} />
          <select value={np.month ?? ""} onChange={e => setNp(v => ({ ...v, month: e.target.value }))} className={inputCls}>
            <option value="">חודש…</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="date" value={np.due_date ?? ""} onChange={e => setNp(v => ({ ...v, due_date: e.target.value }))} className={inputCls} />
          <input type="number" placeholder="סכום €" value={np.amount || ""} onChange={e => setNp(v => ({ ...v, amount: +e.target.value }))} className={inputCls} />
          <button onClick={add} disabled={busy} className="col-span-2 md:col-span-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition">+ תשלום</button>
        </div>
        <input placeholder="הערה (למשל: לפני מסירת מפתחות · פיקדון החזרי)" value={np.note ?? ""} onChange={e => setNp(v => ({ ...v, note: e.target.value }))} className={inputCls + " mt-2"} />
      </div>
    </div>
  );
}
