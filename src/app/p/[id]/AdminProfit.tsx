"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

// A small floating card only a signed-in ADMIN sees on a proposal page:
// the estimated profit behind the quote. Customers get nothing rendered.
export default function AdminProfit({ id }: { id: string }) {
  const [d, setD] = useState<{ lines: { label: string; sell: number; cost: number | null; profit: number | null }[]; totalProfit: number; grandTotal: number; note: string; share?: { rate: number; amount: number } | null; admin?: boolean } | null>(null);
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
            <b>{d.share ? "💰 רווח משוער (רק הצוות רואה)" : "💰 רווח משוער (רק אתה רואה)"}</b>
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
          {d.share && (
            <div className="flex justify-between gap-3 mt-1 font-black text-amber-300">
              <span>החלק שלך ({Math.round(d.share.rate * 100)}%)</span><span>{f(d.share.amount)}</span>
            </div>
          )}
          <div className="text-[11px] text-gray-500 mt-1">מתוך הצעה של {f(d.grandTotal)} · {d.note}</div>
          {d.admin !== false && (
            <button onClick={async () => {
            if (!confirm("ליצור גרסת חופשת החזר של ההצעה? (עותק חדש בלי מחירים, המקור לא משתנה)")) return;
            const r = await authFetch(`/api/admin/proposals/${id}/replacement`, { method: "POST" }).then(x => x.json()).catch(() => null);
            if (r?.url) { try { await navigator.clipboard.writeText(r.url); } catch { /* copy is a bonus */ } window.open(r.url, "_blank"); }
            else alert(r?.error || "לא הצליח");
          }} className="mt-2 w-full rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 text-[12px] font-bold py-1.5 transition">
            🔁 גרסת חופשת החזר (בלי מחירים)
          </button>
          )}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="bg-gray-900 text-emerald-400 font-black rounded-full shadow-xl px-4 py-2 text-sm">💰 {f(d.totalProfit)}{d.share ? ` · שלך ${f(d.share.amount)}` : ""}</button>
      )}
    </div>
  );
}
