"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { eur, dmy, showPhone, PageHead } from "@/components/seller-ui";

/*
 * The quotes sent lately (the bot's and Idan's), each with its estimated profit and
 * what the seller would get if it closes. Opening a quote shows the same numbers.
 */
type Quote = { id: string; number: string; client: string; phone: string; status: string; createdAt: string; title: string; total: number; profit: number | null; share: number | null };

export default function SellerQuotes() {
  const [list, setList] = useState<Quote[] | null>(null);
  const [rate, setRate] = useState(0);
  const [days, setDays] = useState(30);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    authFetch(`/api/seller/quotes?days=${days}`).then(r => r.json()).then(j => {
      if (j?.ok) { setList(j.quotes); setRate(j.rate); setErr(""); } else setErr("לא הצלחתי לטעון");
    }).catch(() => setErr("לא הצלחתי לטעון"));
  }, [days]);

  const shown = (list ?? []).filter(x => !q || [x.client, x.phone, x.number, x.title].some(v => String(v || "").toLowerCase().includes(q.toLowerCase())));
  const sum = (f: (x: Quote) => number | null) => shown.reduce((s, x) => s + (f(x) ?? 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl" dir="rtl">
      <PageHead title="הצעות מחיר" sub={rate ? `כל הצעה עם הרווח המשוער והחלק שלך (${Math.round(rate * 100)}%) אם היא נסגרת.` : "כל הצעה עם הרווח המשוער."}>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="flex gap-1 rounded-full border border-gray-200 bg-white p-0.5">
            {[7, 30, 90].map(n => <button key={n} onClick={() => { setList(null); setDays(n); }} className={`px-3 py-1 rounded-full text-sm font-bold ${days === n ? "bg-blue-600 text-white" : "text-gray-600"}`}>{n} יום</button>)}
          </div>
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש שם, טלפון, מספר…"
            className="flex-1 md:w-[220px] rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
        </div>
      </PageHead>
      {err && <p className="mb-3 text-sm font-bold text-red-600">{err}</p>}
      {list && (
        <p className="text-sm text-gray-600 mb-3">{shown.length} הצעות · שווי {eur(sum(x => x.total))} · רווח משוער {eur(sum(x => x.profit))}{rate ? <> · <b className="text-amber-700">שלך אם כולן נסגרות {eur(sum(x => x.share))}</b></> : null}</p>
      )}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto">
        {!list ? <p className="p-4 text-sm text-gray-500">טוען…</p> : shown.length === 0 ? <p className="p-4 text-sm text-gray-500">אין הצעות בתקופה הזו.</p> : (
          <table className="w-full text-sm min-w-[680px]">
            <thead><tr className="text-right text-xs text-gray-500 border-b border-gray-100">
              <th className="p-3">הצעה</th><th className="p-3">לקוח</th><th className="p-3">סכום</th><th className="p-3">רווח משוער</th>{rate ? <th className="p-3">שלך</th> : null}<th className="p-3"></th>
            </tr></thead>
            <tbody>{shown.map(x => (
              <tr key={x.id} className="border-b border-gray-50">
                <td className="p-3"><div className="font-bold">#{x.number}</div><div className="text-xs text-gray-500 truncate max-w-[220px]">{x.title}</div><div className="text-[11px] text-gray-400">{dmy(x.createdAt)}</div></td>
                <td className="p-3"><div className="font-bold">{x.client || "—"}</div>
                  {x.phone && <a href={`https://wa.me/${x.phone}`} target="_blank" rel="noreferrer" className="text-xs text-green-700 hover:underline" dir="ltr">{showPhone(x.phone)}</a>}</td>
                <td className="p-3 font-bold tabular-nums">{x.total ? eur(x.total) : "—"}</td>
                <td className="p-3 tabular-nums">{x.profit == null ? <span className="text-xs text-gray-400">לא ידוע</span> : <b className="text-emerald-700">{eur(x.profit)}</b>}</td>
                {rate ? <td className="p-3 font-extrabold text-amber-700 tabular-nums">{x.share == null ? "—" : eur(x.share)}</td> : null}
                <td className="p-3"><a href={`/p/${x.id}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline">פתח</a></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
