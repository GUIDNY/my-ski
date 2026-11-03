"use client";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { eur, dmy, showPhone, ORDER_STATUS, Stat, PageHead } from "@/components/seller-ui";

/*
 * Orders and profit. A seller sees his orders (automatic: a customer he wrote to
 * ordered after it; or set by Idan) and his share of each. Idan sees every recent
 * order and decides: whose it is (automatic / a seller / nobody) and its profit.
 */
type Order = {
  code: string; customer: string; phone: string; apartment: string; checkin: string | null; checkout: string | null; guests: number;
  total: number; status: string; createdAt: string; owner: string | null; ownerBy: "auto" | "manual" | null;
  profit: number | null; profitBy: "manual" | "proposal" | null; share: number | null; counts: boolean; proposalId: string | null;
};
type Seller = { email: string; name: string; share: number };
type Res = { ok: boolean; admin: boolean; seller?: Seller; sellers?: Seller[]; orders: Order[]; totals?: { orders: number; sales: number; profit: number; share: number; waitingProfit: number } };

export default function SellerOrders() {
  const [d, setD] = useState<Res | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    const j = await authFetch("/api/seller/orders").then(r => r.json()).catch(() => null);
    if (j?.ok) setD(j);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const save = async (code: string, body: Record<string, unknown>) => {
    setBusy(code);
    await authFetch("/api/seller/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, ...body }) }).catch(() => null);
    await load();
    setBusy("");
  };

  const shown = (d?.orders ?? []).filter(o => !q || [o.code, o.customer, o.phone, o.apartment].some(v => v.toLowerCase().includes(q.toLowerCase())));
  const nameOf = (email: string | null) => d?.sellers?.find(s => s.email === email)?.name ?? email ?? "";

  return (
    <div className="p-4 md:p-8 max-w-6xl" dir="rtl">
      <PageHead title={d?.admin ? "הזמנות ושיוך לאנשי מכירות" : "ההזמנות שלי"}
        sub={d?.admin ? "של מי ההזמנה: אוטומטית (איש המכירות כתב ללקוח לפני ההזמנה) או לפי מה שתבחר. הרווח: מההצעה, או מה שתכתוב." : "הזמנה של לקוח שכתבת לו מהאזור הזה נרשמת לך אוטומטית. החלק שלך נספר רק על הזמנה ששולמה."}>
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש קוד, שם, טלפון…"
          className="w-full md:w-[240px] rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
      </PageHead>

      {d && !d.admin && d.totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Stat k="החלק שלך" v={eur(d.totals.share)} tone="gold" />
          <Stat k="רווח מההזמנות שלך" v={eur(d.totals.profit)} />
          <Stat k="הזמנות ששולמו" v={String(d.totals.orders)} s={eur(d.totals.sales)} tone="good" />
          <Stat k="ממתינות לעדכון רווח" v={String(d.totals.waitingProfit)} tone={d.totals.waitingProfit ? "warn" : undefined} />
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto">
        {!d ? <p className="p-4 text-sm text-gray-500">טוען…</p> : shown.length === 0 ? <p className="p-4 text-sm text-gray-500">אין הזמנות להצגה.</p> : (
          <table className="w-full text-sm min-w-[760px]">
            <thead><tr className="text-right text-xs text-gray-500 border-b border-gray-100">
              <th className="p-3">הזמנה</th><th className="p-3">לקוח</th><th className="p-3">חופשה</th><th className="p-3">סכום</th>
              <th className="p-3">רווח</th>{d.admin ? <th className="p-3">של מי</th> : <th className="p-3">החלק שלך</th>}
            </tr></thead>
            <tbody>{shown.map(o => (
              <tr key={o.code} className={`border-b border-gray-50 align-top ${busy === o.code ? "opacity-50" : ""}`}>
                <td className="p-3">
                  <div className="font-bold">{o.code}</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${ORDER_STATUS[o.status]?.cls ?? "bg-gray-100"}`}>{ORDER_STATUS[o.status]?.label ?? o.status}</span>
                  <div className="text-[11px] text-gray-400 mt-1">{dmy(o.createdAt)}</div>
                </td>
                <td className="p-3"><div className="font-bold">{o.customer || "—"}</div><div className="text-xs text-gray-500" dir="ltr">{showPhone(o.phone)}</div></td>
                <td className="p-3"><div className="truncate max-w-[220px]">{o.apartment}</div><div className="text-xs text-gray-500">{o.checkin ? <span dir="ltr">{dmy(o.checkin)}–{dmy(o.checkout)}</span> : null}{o.guests ? ` · ${o.guests} אנשים` : ""}</div></td>
                <td className="p-3 font-bold tabular-nums">{eur(o.total)}</td>
                <td className="p-3">
                  {d.admin ? (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">€</span>
                      <input key={`${o.code}-${o.profit}`} type="number" inputMode="numeric" defaultValue={o.profit ?? ""} placeholder="?"
                        onBlur={e => { const v = e.target.value.trim(); const n = v === "" ? null : Number(v); if (n !== o.profit) save(o.code, { profit: n }); }}
                        className="w-24 rounded-lg border border-gray-200 px-2 py-1 tabular-nums focus:outline-none focus:border-blue-500" />
                    </div>
                  ) : <span className="font-bold tabular-nums">{o.profit == null ? <span className="text-orange-600 text-xs font-bold">ממתין לעדכון</span> : eur(o.profit)}</span>}
                  <div className="text-[11px] text-gray-400 mt-1">{o.profitBy === "manual" ? "עודכן ידנית" : o.profitBy === "proposal" ? "לפי ההצעה" : d.admin ? "אין הצעה, צריך לכתוב" : "עדן יעדכן"}</div>
                  {o.proposalId && <a href={`/p/${o.proposalId}`} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline">ההצעה</a>}
                </td>
                {d.admin ? (
                  <td className="p-3">
                    <select value={o.ownerBy === "manual" ? (o.owner ?? "") : "auto"} onChange={e => save(o.code, { seller: e.target.value })}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm bg-white">
                      <option value="auto">אוטומטי{o.ownerBy === "auto" ? ` (${nameOf(o.owner)})` : " (אף אחד)"}</option>
                      {d.sellers?.map(s => <option key={s.email} value={s.email}>{s.name}</option>)}
                      <option value="">אף אחד</option>
                    </select>
                    {o.owner && o.counts && o.profit != null && <div className="text-[11px] text-amber-700 font-bold mt-1">לו: {eur(Math.round(o.profit * (d.sellers?.find(s => s.email === o.owner)?.share ?? 0)))}</div>}
                  </td>
                ) : (
                  <td className="p-3">
                    <div className="font-extrabold text-amber-700 tabular-nums">{o.share != null ? eur(o.share) : o.counts ? "—" : <span className="text-xs text-gray-400 font-bold">רק אחרי תשלום</span>}</div>
                    <div className="text-[11px] text-gray-400 mt-1">{o.ownerBy === "manual" ? "שויך על ידי עדן" : "אוטומטי"}</div>
                  </td>
                )}
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
