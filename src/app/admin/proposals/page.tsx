"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminGate from "@/components/AdminGate";
import type { Proposal, ProposalStatus } from "@/types";

const STATUS: Record<ProposalStatus, { label: string; cls: string }> = {
  draft:    { label: "טיוטה",    cls: "bg-gray-100 text-gray-600" },
  sent:     { label: "נשלחה",    cls: "bg-blue-100 text-blue-700" },
  accepted: { label: "אושרה",    cls: "bg-emerald-100 text-emerald-700" },
  expired:  { label: "פג תוקף",  cls: "bg-amber-100 text-amber-700" },
};

function ProposalsInner() {
  const router = useRouter();
  const [rows, setRows] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const r = await fetch(`/api/proposals?${params}`);
    setRows(r.ok ? await r.json() : []);
    setLoading(false);
  }, [q, status]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const create = async () => {
    setBusy(true);
    const r = await fetch("/api/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const p = await r.json();
    setBusy(false);
    if (r.ok) router.push(`/admin/proposals/${p.id}/edit`);
    else alert("שגיאה ביצירה");
  };
  const duplicate = async (id: string) => {
    setBusy(true);
    const r = await fetch(`/api/proposals/${id}/duplicate`, { method: "POST" });
    const p = await r.json();
    setBusy(false);
    if (r.ok) router.push(`/admin/proposals/${p.id}/edit`);
    else alert("שגיאה בשכפול");
  };
  const remove = async (id: string) => {
    if (!confirm("למחוק את ההצעה?")) return;
    await fetch(`/api/proposals/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">הצעות מחיר (PDF)</h1>
          <p className="text-sm text-gray-500 mt-0.5">בניית הצעות ממותגות להדפסה / שמירה כ-PDF</p>
        </div>
        <button onClick={create} disabled={busy} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition">+ הצעה חדשה</button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש לפי שם לקוח / מספר הצעה"
          className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm">
          <option value="">כל הסטטוסים</option>
          {(Object.keys(STATUS) as ProposalStatus[]).map(s => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">אין הצעות עדיין. לחץ/י "הצעה חדשה".</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["מספר", "לקוח", "כותרת", "סטטוס", "בתוקף עד", "פעולות"].map(h => (
                <th key={h} className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{p.proposal_number}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{p.client_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate">{p.data?.title}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS[p.status]?.cls || ""}`}>{STATUS[p.status]?.label || p.status}</span></td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.valid_until || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-3 items-center">
                      <a href={`/admin/proposals/${p.id}/edit`} className="text-blue-600 hover:text-blue-800 font-semibold text-xs">עריכה</a>
                      <a href={`/admin/proposals/${p.id}/print`} target="_blank" className="text-gray-600 hover:text-gray-900 font-semibold text-xs">PDF ↗</a>
                      <button onClick={() => duplicate(p.id)} className="text-gray-500 hover:text-gray-800 font-medium text-xs">שכפל</button>
                      <button onClick={() => remove(p.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">מחיקה</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ProposalsAdmin() {
  return <AdminGate><ProposalsInner /></AdminGate>;
}
