"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

// A small floating card only a signed-in ADMIN sees on a proposal page:
// the estimated profit behind the quote. Customers get nothing rendered.
export default function AdminProfit({ id }: { id: string }) {
  const [d, setD] = useState<{ lines: { label: string; sell: number; cost: number | null; profit: number | null }[]; totalProfit: number; grandTotal: number; note: string } | null>(null);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    authFetch(`/api/admin/proposals/${id}/profit`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (j?.ok) setD(j); })
      .catch(() => {});
  }, [id]);
  if (!d) return null;
  const f = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
  return (
    <div dir="rtl" className="fixed bottom-24 right-4 z-[80] max-w-[300px]">
      {open ? (
        <div className="bg-gray-900 text-white rounded-2xl shadow-2xl p-4 text-sm">
          <div className="flex items-center justify-between gap-3 mb-2">
            <b>💰 רווח משוער (רק אתה רואה)</b>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">—</button>
          </div>
          {d.lines.map((l, i) => (
            <div key={i} className="flex justify-between gap-3 py-0.5 text-[13px]">
              <span className="text-gray-300 truncate">{l.label}</span>
              <span className={l.profit == null ? "text-gray-500" : "font-bold text-emerald-400"}>{l.profit == null ? "?" : f(l.profit)}</span>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-gray-700 mt-2 pt-2 font-black">
            <span>סה״כ רווח</span><span className="text-emerald-400">{f(d.totalProfit)}</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">מתוך הצעה של {f(d.grandTotal)} · {d.note}</div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="bg-gray-900 text-emerald-400 font-black rounded-full shadow-xl px-4 py-2 text-sm">💰 {f(d.totalProfit)}</button>
      )}
    </div>
  );
}
