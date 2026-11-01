"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

/*
 * Floating admin-only profit card (bottom-left, away from the WhatsApp button).
 * body = what to POST to /api/admin/quote-profit; renders nothing for non-admins.
 */
export default function AdminProfitBadge({ body, quoteId }: { body: Record<string, unknown>; quoteId?: string }) {
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
          {quoteId && (
            <button onClick={async () => {
              if (!confirm("ליצור גרסת חופשת החזר של ההצעה? (עותק חדש בלי מחירים, המקור לא משתנה)")) return;
              const xParam = new URLSearchParams(window.location.search).get("x") || undefined;
              const r = await authFetch(`/api/admin/quotes/${quoteId}/replacement`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ x: xParam }) }).then(x => x.json()).catch(() => null);
              if (r?.url) { try { await navigator.clipboard.writeText(r.url); } catch { /* copy is a bonus */ } window.open(r.url, "_blank"); }
              else alert(r?.error || "לא הצליח");
            }} className="mt-2 w-full rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 text-[12px] font-bold py-1.5 transition">
              🔁 גרסת חופשת החזר (בלי מחירים)
            </button>
          )}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="bg-gray-900 text-emerald-400 font-black rounded-full shadow-xl px-4 py-2 text-sm">💰 {f(d.totalProfit)}</button>
      )}
    </div>
  );
}
