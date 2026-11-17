"use client";
import { useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

/* "What to pay and when": the unpaid payments of every property, by due date,
   plus a per-payee summary. Dates are plain dates (YYYY-MM-DD); "today" is
   today in Israel. Paying uses the same PATCH as the payments popup. */

export type SchedPayment = {
  id: string; property_id: string; label: string; month: string | null;
  due_date: string | null; amount: number; paid: boolean; paid_date: string | null;
  kind: string; note: string | null;
};
export type SchedProp = {
  id: string; name: string; agency_name: string | null; contact: string | null; payments: SchedPayment[];
};

const MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const money = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
const israelToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
const addDays = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const fmtDate = (iso: string) => { const [y, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}.${y.slice(2)}`; };
const payeeOf = (p: SchedProp) => (p.agency_name || p.contact || p.name || "").trim();

type Row = { pay: SchedPayment; prop: SchedProp };

export default function PaymentsSchedule({ rows, onChange }: { rows: SchedProp[]; onChange: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = israelToday();
  const weekEnd = addDays(today, 6);

  const all: Row[] = rows.flatMap(prop => prop.payments.map(pay => ({ pay, prop })));
  const unpaid = all.filter(r => !r.pay.paid);
  const byDate = (a: Row, b: Row) => (a.pay.due_date || "").localeCompare(b.pay.due_date || "") || payeeOf(a.prop).localeCompare(payeeOf(b.prop));
  const sum = (rs: Row[]) => rs.reduce((s, r) => s + (Number(r.pay.amount) || 0), 0);

  const overdue = unpaid.filter(r => r.pay.due_date && r.pay.due_date < today).sort(byDate);
  const week = unpaid.filter(r => r.pay.due_date && r.pay.due_date >= today && r.pay.due_date <= weekEnd).sort(byDate);
  const later = unpaid.filter(r => r.pay.due_date && r.pay.due_date > weekEnd).sort(byDate);
  const noDate = unpaid.filter(r => !r.pay.due_date).sort((a, b) => payeeOf(a.prop).localeCompare(payeeOf(b.prop)));

  const monthGroups: { key: string; title: string; rows: Row[] }[] = [];
  for (const r of later) {
    const key = r.pay.due_date!.slice(0, 7);
    let g = monthGroups.find(x => x.key === key);
    if (!g) {
      const [y, m] = key.split("-");
      g = { key, title: `${MONTHS[Number(m) - 1]} ${y}`, rows: [] };
      monthGroups.push(g);
    }
    g.rows.push(r);
  }

  const markPaid = async (pay: SchedPayment) => {
    setBusyId(pay.id);
    await authFetch(`/api/property-payments/${pay.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: true, paid_date: today }),
    });
    setBusyId(null);
    onChange();
  };

  // per payee: paid / remaining (properties of the same payee together)
  const payees = new Map<string, { name: string; props: Set<string>; paid: number; left: number }>();
  for (const { pay, prop } of all) {
    const name = payeeOf(prop) || "ללא שם";
    const e = payees.get(name) ?? { name, props: new Set<string>(), paid: 0, left: 0 };
    e.props.add(prop.name);
    const a = Number(pay.amount) || 0;
    if (pay.paid) e.paid += a; else e.left += a;
    payees.set(name, e);
  }
  const payeeRows = [...payees.values()].sort((a, b) => b.left - a.left);

  const group = (title: string, tone: "red" | "amber" | "gray" | "slate", list: Row[]) => {
    if (list.length === 0) return null;
    const head = tone === "red" ? "bg-red-50 text-red-700 border-red-100" : tone === "amber" ? "bg-amber-50 text-amber-800 border-amber-100" : tone === "slate" ? "bg-slate-50 text-slate-600 border-slate-100" : "bg-gray-50 text-gray-700 border-gray-100";
    return (
      <div key={title} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${head}`}>
          <h3 className="font-black text-sm">{title}</h3>
          <span className="font-black text-sm">{money(sum(list))}<span className="font-medium text-xs opacity-70"> · {list.length} תשלומים</span></span>
        </div>
        <div className="divide-y divide-gray-50">
          {list.map(({ pay, prop }) => {
            const isDep = pay.kind === "deposit";
            const late = !!pay.due_date && pay.due_date < today;
            return (
              <div key={pay.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-gray-900">{payeeOf(prop)}</span>
                    {isDep && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">פיקדון – חוזר</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{prop.name}{pay.label ? ` · ${pay.label}` : ""}</p>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="font-black text-gray-900 whitespace-nowrap">{money(Number(pay.amount))}</p>
                  <p className={`text-[11px] whitespace-nowrap ${late ? "text-red-600 font-bold" : "text-gray-400"}`}>{pay.due_date ? fmtDate(pay.due_date) : "ללא תאריך"}</p>
                </div>
                <button onClick={() => markPaid(pay)} disabled={busyId === pay.id}
                  className="flex-shrink-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 font-bold text-xs px-3 py-1.5 rounded-lg">
                  {busyId === pay.id ? "…" : "שולם ✓"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 rounded-2xl p-4"><p className="text-xs text-gray-500">באיחור</p><p className="text-xl font-black text-red-600">{money(sum(overdue))}</p></div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4"><p className="text-xs text-gray-500">נשאר לשלם</p><p className="text-xl font-black text-gray-900">{money(sum(unpaid))}</p></div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4"><p className="text-xs text-gray-500">שולם</p><p className="text-xl font-black text-emerald-600">{money(sum(all.filter(r => r.pay.paid)))}</p></div>
      </div>

      {unpaid.length === 0 && <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">אין תשלומים פתוחים 🎉</div>}

      {group("⚠️ באיחור", "red", overdue)}
      {group("היום והשבוע הקרוב", "amber", week)}
      {monthGroups.map(g => group(g.title, "gray", g.rows))}
      {group("ללא תאריך", "slate", noDate)}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50"><h3 className="font-black text-sm text-gray-700">לפי בעלים</h3></div>
        <div className="divide-y divide-gray-50">
          {payeeRows.map(p => (
            <div key={p.name} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-400 truncate">{[...p.props].join(" · ")}</p>
              </div>
              <div className="text-left flex-shrink-0 whitespace-nowrap">
                <p className="text-xs text-emerald-600">שולם {money(p.paid)}</p>
                <p className={`font-black ${p.left > 0 ? "text-red-600" : "text-gray-400"}`}>{p.left > 0 ? `נשאר ${money(p.left)}` : "הכל שולם"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
