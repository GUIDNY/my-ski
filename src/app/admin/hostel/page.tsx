"use client";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

/*
 * The hostel in Mayrhofen: its expenses, its bookings, and the balance
 * (bookings minus expenses). Stored like the managed properties: one
 * managed_properties row (kind "hostel"), each booking a property_payments row
 * (kind "booking": label = name, due_date = arrival, month = departure).
 */

type Booking = { id: string; label: string; due_date: string | null; month: string | null; amount: number; paid: boolean; note: string | null };
type Hostel = { id: string; name: string; expenses: number; payments: Booking[] };

const NAME = "הוסטל מאיירהופן";
const DEFAULT_EXPENSES = 18000;
const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const money = (n: number) => `${n < 0 ? "−" : ""}€${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const day = (s: string | null) => (s ? s.split("-").reverse().join(".") : "");
const EMPTY = { label: "", due_date: "", month: "", amount: "", note: "" };

export default function HostelAdmin() {
  const [h, setH] = useState<Hostel | null>(null);
  const [err, setErr] = useState("");
  const [nb, setNb] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [exp, setExp] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr("");
    const r = await authFetch("/api/managed-properties?kind=hostel");
    const list = await r.json().catch(() => null);
    if (!Array.isArray(list)) { setErr("לא הצלחתי לטעון. ודא שאתה מחובר לאזור הניהול."); return; }
    let row = list[0] as Hostel | undefined;
    if (!row) {
      const c = await authFetch("/api/managed-properties", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "hostel", name: NAME, expenses: DEFAULT_EXPENSES, revenue: 0, airbnb_open: false }),
      });
      const j = await c.json().catch(() => ({}));
      if (!c.ok) { setErr(`לא הצלחתי ליצור את ההוסטל: ${j.error || c.status}`); return; }
      row = { ...j, payments: [] };
    }
    setH({ ...row!, payments: (row!.payments || []).filter(p => (p as { kind?: string }).kind === "booking") });
  }, []);
  useEffect(() => { load(); }, [load]);

  const bookings = [...(h?.payments ?? [])].sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
  const income = bookings.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const received = bookings.filter(b => b.paid).reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const expenses = Number(h?.expenses) || 0;
  const balance = income - expenses;

  const add = async () => {
    if (!h) return;
    if (!nb.label.trim() || !Number(nb.amount)) { setErr("צריך שם וסכום להזמנה."); return; }
    setBusy(true); setErr("");
    const r = await authFetch(`/api/managed-properties/${h.id}/payments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "booking", label: nb.label.trim(), due_date: nb.due_date || null, month: nb.month || null, amount: Number(nb.amount), note: nb.note || null, paid: false }),
    });
    setBusy(false);
    if (!r.ok) { setErr("ההזמנה לא נשמרה. נסה שוב."); return; }
    setNb(EMPTY); load();
  };
  const patch = async (b: Booking, body: Record<string, unknown>) => {
    await authFetch(`/api/property-payments/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    load();
  };
  const remove = async (b: Booking) => {
    if (!window.confirm(`למחוק את ההזמנה של ${b.label}?`)) return;
    await authFetch(`/api/property-payments/${b.id}`, { method: "DELETE" });
    load();
  };
  const saveExpenses = async () => {
    if (!h || exp === null) return;
    await authFetch(`/api/managed-properties/${h.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expenses: Number(exp) || 0 }) });
    setExp(null); load();
  };

  return (
    <div className="p-6 md:p-8 max-w-[1100px]" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900">{NAME}</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">הוצאות, הזמנות ומאזן</p>
      {err && <p className="mb-4 text-sm font-bold text-red-600">{err}</p>}

      {/* ── Balance ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">הוצאות</div>
          {exp === null ? (
            <button type="button" onClick={() => setExp(String(expenses))} className="mt-2 text-3xl font-extrabold text-gray-900 hover:text-blue-600" title="לשנות">{money(expenses)}</button>
          ) : (
            <div className="mt-2 flex gap-2">
              <input type="number" value={exp} onChange={e => setExp(e.target.value)} className={inputCls} autoFocus />
              <button type="button" onClick={saveExpenses} className="px-4 rounded-xl bg-blue-600 text-white text-sm font-bold">שמירה</button>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">הכנסות מהזמנות</div>
          <div className="mt-2 text-3xl font-extrabold text-gray-900">{money(income)}</div>
          <div className="text-xs text-gray-500 mt-1">{bookings.length} הזמנות · התקבל {money(received)}</div>
        </div>
        <div className={`rounded-2xl border p-5 ${balance >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">מאזן</div>
          <div className={`mt-2 text-3xl font-extrabold ${balance >= 0 ? "text-green-700" : "text-red-700"}`}>{money(balance)}</div>
          <div className="text-xs text-gray-500 mt-1">{balance >= 0 ? "ברווח" : `חסר ${money(-balance)} כדי לכסות את ההוצאות`}</div>
        </div>
      </div>

      {/* ── Bookings ── */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">הזמנות</h2>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-4 grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
        <label className="col-span-2 md:col-span-2 text-xs text-gray-500">שם<input value={nb.label} onChange={e => setNb(v => ({ ...v, label: e.target.value }))} className={inputCls} /></label>
        <label className="text-xs text-gray-500">הגעה<input type="date" value={nb.due_date} onChange={e => setNb(v => ({ ...v, due_date: e.target.value }))} className={inputCls} /></label>
        <label className="text-xs text-gray-500">עזיבה<input type="date" value={nb.month} onChange={e => setNb(v => ({ ...v, month: e.target.value }))} className={inputCls} /></label>
        <label className="text-xs text-gray-500">סכום (€)<input type="number" value={nb.amount} onChange={e => setNb(v => ({ ...v, amount: e.target.value }))} className={inputCls} /></label>
        <button type="button" onClick={add} disabled={busy || !h} className="h-[42px] rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-50">{busy ? "שומר…" : "+ הוספה"}</button>
        <label className="col-span-2 md:col-span-6 text-xs text-gray-500">הערה (לא חובה)<input value={nb.note} onChange={e => setNb(v => ({ ...v, note: e.target.value }))} className={inputCls} /></label>
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-gray-500">{h ? "עוד אין הזמנות." : "טוען…"}</p>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr><th className="text-right p-3">שם</th><th className="text-right p-3">תאריכים</th><th className="text-right p-3">סכום</th><th className="text-right p-3">שולם</th><th className="text-right p-3">הערה</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-t border-gray-100">
                  <td className="p-3 font-bold text-gray-900">{b.label}</td>
                  <td className="p-3 text-gray-600 whitespace-nowrap">{day(b.due_date)}{b.month ? ` – ${day(b.month)}` : ""}</td>
                  <td className="p-3 font-bold tabular-nums">{money(Number(b.amount) || 0)}</td>
                  <td className="p-3">
                    <button type="button" onClick={() => patch(b, { paid: !b.paid, paid_date: !b.paid ? new Date().toISOString().slice(0, 10) : null })}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${b.paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{b.paid ? "שולם" : "ממתין"}</button>
                  </td>
                  <td className="p-3 text-gray-500">{b.note}</td>
                  <td className="p-3 text-left"><button type="button" onClick={() => remove(b)} className="text-xs font-bold text-red-600 hover:underline">מחיקה</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
