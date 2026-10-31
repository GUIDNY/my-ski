"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

/*
 * Floating admin-only profit card (bottom-left, away from the WhatsApp button).
 * body = what to POST to /api/admin/quote-profit; renders nothing for non-admins.
 */
export default function AdminProfitBadge({ body }: { body: Record<string, unknown> }) {
  const [d, setD] = useState<{ lines: { label: string; profit: number | null }[]; totalProfit: number; note: string } | null>(null);
  const [open, setOpen] = useState(false);
  const key = JSON.stringify(body);
  useEffect(() => {
    let on = true;
    authFetch("/api/admin/quote-profit", { method: "POST", headers: { "Content-Type": "application/json" }, body: key })
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (on && j?.ok) setD(j); })
      .catch(() => {});
    return () => { on = false; };
  }, [key]);
  if (!d || !d.lines.length) return null;
  const f = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
  return (
    <div dir="rtl" className="fixed bottom-24 left-4 z-[80] max-w-[290px]">
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
          <div className="text-[11px] text-gray-500 mt-1">{d.note}</div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="bg-gray-900 text-emerald-400 font-black rounded-full shadow-xl px-4 py-2 text-sm">💰 {f(d.totalProfit)}</button>
      )}
    </div>
  );
}
