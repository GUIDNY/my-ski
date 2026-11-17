"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

/* "What to pay and when": every payment, month by month by its due date,
   plus a per-payee summary. The month grouping (monthBuckets) is shared with
   the small "payments by month" box on the page, so the numbers always match. */

export type SchedPayment = {
  id: string; property_id: string; label: string; month: string | null;
  due_date: string | null; amount: number; paid: boolean; paid_date: string | null;
  kind: string; note: string | null;
};
export type SchedProp = {
  id: string; name: string; agency_name: string | null; contact: string | null; payments: SchedPayment[];
};
export type Row = { pay: SchedPayment; prop: SchedProp };

const MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
export const money = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
const amountOf = (r: Row) => Number(r.pay.amount) || 0;
const israelDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(d);
export const israelToday = () => israelDay(new Date());
// the due date as a calendar day in Israel (a plain date stays as it is)
const dueDay = (v: string | null) => (!v ? null : v.length > 10 ? israelDay(new Date(v)) : v);
const fmtDate = (iso: string) => { const [y, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}.${y.slice(2)}`; };
export const payeeOf = (p: SchedProp) => (p.agency_name || p.contact || p.name || "").trim();

export type MonthBucket = { key: string; title: string; rows: Row[]; total: number; paid: number; left: number };

/* every payment in the month of its due date (Israel time); with no due date it
   goes by the written month name, and with neither into "ללא תאריך" */
export function monthBuckets(rows: { pay: SchedPayment; prop: SchedProp }[]): MonthBucket[] {
  const map = new Map<string, MonthBucket>();
  for (const r of rows) {
    const day = dueDay(r.pay.due_date);
    let key: string, title: string;
    if (day) { key = day.slice(0, 7); title = `${MONTHS[Number(key.slice(5)) - 1]} ${key.slice(0, 4)}`; }
    else if (r.pay.month) { key = `~${r.pay.month}`; title = `${r.pay.month} (בלי תאריך)`; }
    else { key = "~~"; title = "ללא תאריך"; }
    const b = map.get(key) ?? { key, title, rows: [], total: 0, paid: 0, left: 0 };
    b.rows.push(r);
    const a = amountOf(r);
    b.total += a;
    if (r.pay.paid) b.paid += a; else b.left += a;
    map.set(key, b);
  }
  const out = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  for (const b of out) b.rows.sort((x, y) => (dueDay(x.pay.due_date) || "").localeCompare(dueDay(y.pay.due_date) || "") || payeeOf(x.prop).localeCompare(payeeOf(y.prop)));
  return out;
}

export default function PaymentsSchedule({ rows, onChange }: { rows: SchedProp[]; onChange: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = israelToday();

  const all: Row[] = rows.flatMap(prop => prop.payments.map(pay => ({ pay, prop })));
  const paidTotal = all.filter(r => r.pay.paid).reduce((s, r) => s + amountOf(r), 0);
  const leftTotal = all.filter(r => !r.pay.paid).reduce((s, r) => s + amountOf(r), 0);
  const months = monthBuckets(all);

  const markPaid = async (pay: SchedPayment) => {
    setBusyId(pay.id);
    await authFetch(`/api/property-payments/${pay.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: true, paid_date: today }),
    });
    setBusyId(null);
    onChange();
  };

  const payees = new Map<string, { name: string; props: Set<string>; total: number; paid: number; left: number }>();
  for (const r of all) {
    const name = payeeOf(r.prop) || "ללא שם";
    const e = payees.get(name) ?? { name, props: new Set<string>(), total: 0, paid: 0, left: 0 };
    e.props.add(r.prop.name);
    const a = amountOf(r);
    e.total += a;
    if (r.pay.paid) e.paid += a; else e.left += a;
    payees.set(name, e);
  }
  const payeeRows = [...payees.values()].sort((a, b) => b.left - a.left);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-2xl p-4"><p className="text-sm text-gray-600">שולם</p><p className="text-2xl font-black text-emerald-600">{money(paidTotal)}</p></div>
        <div className="bg-amber-50 rounded-2xl p-4"><p className="text-sm text-gray-600">נשאר לשלם</p><p className="text-2xl font-black text-gray-900">{money(leftTotal)}</p></div>
      </div>

      {months.map(b => (
        <div key={b.key} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-black text-lg text-gray-900">{b.title}</h3>
            <p className="text-sm text-gray-600">לשלם {money(b.total)} · שולם {money(b.paid)} · <b className={b.left > 0 ? "text-red-600" : "text-emerald-600"}>נשאר {money(b.left)}</b></p>
          </div>
          <div className="divide-y divide-gray-50">
            {b.rows.map(({ pay, prop }) => {
              const day = dueDay(pay.due_date);
              const late = !pay.paid && !!day && day < today;
              return (
                <div key={pay.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base text-gray-900">{payeeOf(prop)}{pay.kind === "deposit" && <span className="text-xs font-bold text-purple-700 bg-purple-100 rounded-full px-2 py-0.5 mr-2">פיקדון – חוזר</span>}</p>
                    <p className="text-sm text-gray-500 truncate">{prop.name}</p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="font-black text-base text-gray-900 whitespace-nowrap">{money(amountOf({ pay, prop }))}</p>
                    <p className={`text-sm whitespace-nowrap ${late ? "text-red-600 font-bold" : "text-gray-500"}`}>{day ? fmtDate(day) : "ללא תאריך"}</p>
                  </div>
                  {pay.paid
                    ? <span className="flex-shrink-0 w-24 text-center text-sm font-bold text-emerald-700 bg-emerald-50 rounded-lg py-1.5">✓ שולם</span>
                    : <button onClick={() => markPaid(pay)} disabled={busyId === pay.id}
                        className="flex-shrink-0 w-24 text-sm font-bold text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 rounded-lg py-1.5">
                        {busyId === pay.id ? "…" : "סמן כשולם"}
                      </button>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50"><h3 className="font-black text-lg text-gray-900">לפי בעלים</h3></div>
        <div className="divide-y divide-gray-50">
          {payeeRows.map(p => (
            <div key={p.name} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-gray-900 truncate">{p.name}</p>
                <p className="text-sm text-gray-500 truncate">{[...p.props].join(" · ")}</p>
              </div>
              <div className="text-left flex-shrink-0 whitespace-nowrap text-sm">
                <p className="text-gray-500">סה״כ {money(p.total)} · שולם {money(p.paid)}</p>
                <p className={`font-black text-base ${p.left > 0 ? "text-red-600" : "text-emerald-600"}`}>{p.left > 0 ? `נשאר ${money(p.left)}` : "הכל שולם"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* popup with one month's payments (opened from the month boxes on the page) */
export function MonthDetails({ bucket, onClose, onChange }: { bucket: MonthBucket; onClose: () => void; onChange: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = israelToday();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const markPaid = async (pay: SchedPayment) => {
    setBusyId(pay.id);
    await authFetch(`/api/property-payments/${pay.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: true, paid_date: today }),
    });
    setBusyId(null);
    onChange();
  };
  return (
    <div className="fixed inset-0 z-[80] bg-black/55 flex items-stretch sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={bucket.title} dir="rtl"
        className="bg-white w-full sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-screen sm:max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-900">{bucket.title}</h2>
            <p className="text-sm text-gray-600 mt-1">סה״כ {money(bucket.total)} · שולם {money(bucket.paid)} · <b className={bucket.left > 0 ? "text-red-600" : "text-emerald-600"}>נשאר {money(bucket.left)}</b></p>
          </div>
          <button onClick={onClose} aria-label="סגירה" className="w-10 h-10 rounded-full hover:bg-gray-100 text-gray-400 text-xl flex-shrink-0">✕</button>
        </div>
        <div className="overflow-y-auto divide-y divide-gray-50">
          {bucket.rows.map(({ pay, prop }) => {
            const day = dueDay(pay.due_date);
            const late = !pay.paid && !!day && day < today;
            return (
              <div key={pay.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-gray-900">{payeeOf(prop)}{pay.kind === "deposit" && <span className="text-xs font-bold text-purple-700 bg-purple-100 rounded-full px-2 py-0.5 mr-2">פיקדון – חוזר</span>}</p>
                  <p className="text-sm text-gray-500">{prop.name}{pay.label ? ` · ${pay.label}` : ""}</p>
                  <p className={`text-sm ${late ? "text-red-600 font-bold" : "text-gray-500"}`}>{day ? fmtDate(day) : "ללא תאריך"}</p>
                </div>
                <p className="font-black text-base text-gray-900 whitespace-nowrap">{money(amountOf({ pay, prop }))}</p>
                {pay.paid
                  ? <span className="flex-shrink-0 w-24 text-center text-sm font-bold text-emerald-700 bg-emerald-50 rounded-lg py-1.5">✓ שולם</span>
                  : <button onClick={() => markPaid(pay)} disabled={busyId === pay.id}
                      className="flex-shrink-0 w-24 text-sm font-bold text-gray-700 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 rounded-lg py-1.5">
                      {busyId === pay.id ? "…" : "סמן כשולם"}
                    </button>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
