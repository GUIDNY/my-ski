"use client";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { eur, dmy, ORDER_STATUS, Stat, PageHead } from "@/components/seller-ui";

/*
 * Seller dashboard: his share of the profit (all time and this month), his orders,
 * the Telegram link for the alerts. Idan sees every seller's totals.
 */
type Totals = { orders: number; sales: number; profit: number; share: number; waitingProfit: number };
type Order = { code: string; customer: string; apartment: string; checkin: string | null; total: number; status: string; createdAt: string; profit: number | null; share: number | null; counts: boolean };
type Seller = { email: string; name: string; share: number };
type OrdersRes = { ok: boolean; admin: boolean; seller?: Seller; sellers?: Seller[]; orders: Order[]; totals?: Totals; bySeller?: Record<string, Totals> };
type Tg = { configured: boolean; bot?: string | null; connected?: boolean; link?: string | null };

export default function SellerDashboard() {
  const [d, setD] = useState<OrdersRes | null>(null);
  const [tg, setTg] = useState<Tg | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      authFetch("/api/seller/orders").then(r => r.json()).catch(() => null),
      authFetch("/api/seller/telegram").then(r => r.json()).catch(() => null),
    ]);
    if (a?.ok) setD(a); else setErr("לא הצלחתי לטעון את הנתונים");
    if (b?.ok) setTg(b);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const tgAction = async (action: string) => {
    setMsg("…");
    const r = await authFetch("/api/seller/telegram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }).then(x => x.json()).catch(() => null);
    if (action === "connect") setMsg(r?.ok ? "מחובר! שלחנו לך הודעה בטלגרם." : "עוד לא ראיתי את ההודעה שלך לבוט. פתח את הבוט, לחץ Start, ונסה שוב.");
    else if (action === "test") setMsg(r?.ok ? "נשלחה הודעת בדיקה." : "השליחה לא הצליחה.");
    else setMsg(r?.ok ? "נותק." : "לא הצליח.");
    load();
  };

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const month = (d?.orders ?? []).filter(o => o.counts && new Date(o.createdAt) >= monthStart);

  return (
    <div className="p-4 md:p-8 max-w-6xl" dir="rtl">
      <PageHead title={d?.admin ? "אנשי מכירות" : `שלום${d?.seller ? `, ${d.seller.name}` : ""}`}
        sub={d?.admin ? "הרווח של כל איש מכירות מההזמנות שלו." : `הרווח שלך: ${Math.round((d?.seller?.share ?? 0.2) * 100)}% מהרווח על כל הזמנה ששולמה.`} />
      {err && <p className="mb-3 text-sm font-bold text-red-600">{err}</p>}

      {d && !d.admin && d.totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Stat k="החלק שלך" v={eur(d.totals.share)} s={`מתוך רווח של ${eur(d.totals.profit)}`} tone="gold" />
          <Stat k="החודש" v={eur(month.reduce((s, o) => s + (o.share ?? 0), 0))} s={`${month.length} הזמנות`} />
          <Stat k="הזמנות ששולמו" v={String(d.totals.orders)} s={`מכירות ${eur(d.totals.sales)}`} tone="good" />
          <Stat k="ממתינות לעדכון רווח" v={String(d.totals.waitingProfit)} s="עדן מעדכן את הרווח" tone={d.totals.waitingProfit ? "warn" : undefined} />
        </div>
      )}

      {d?.admin && d.sellers && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead><tr className="text-right text-xs text-gray-500 border-b border-gray-100">
              <th className="p-3">איש מכירות</th><th className="p-3">הזמנות</th><th className="p-3">מכירות</th><th className="p-3">רווח</th><th className="p-3">החלק שלו</th><th className="p-3">ממתינות לרווח</th>
            </tr></thead>
            <tbody>{d.sellers.map(s => { const t = d.bySeller?.[s.email]; return (
              <tr key={s.email} className="border-b border-gray-50">
                <td className="p-3"><div className="font-bold">{s.name}</div><div className="text-xs text-gray-500">{s.email} · {Math.round(s.share * 100)}%</div></td>
                <td className="p-3 tabular-nums">{t?.orders ?? 0}</td><td className="p-3 tabular-nums">{eur(t?.sales ?? 0)}</td>
                <td className="p-3 tabular-nums">{eur(t?.profit ?? 0)}</td><td className="p-3 font-bold text-amber-700 tabular-nums">{eur(t?.share ?? 0)}</td>
                <td className="p-3 tabular-nums">{t?.waitingProfit ?? 0}</td>
              </tr>); })}</tbody>
          </table>
          <p className="text-xs text-gray-500 p-3">בעמוד &quot;הזמנות ורווח&quot; אפשר לשייך הזמנה לאיש מכירות או להוציא אותה ממנו, ולתקן את הרווח שלה.</p>
        </div>
      )}

      {/* ── Telegram ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-6">
        <div className="font-bold text-gray-900 mb-1">🔔 התראות בטלגרם</div>
        <p className="text-sm text-gray-500 mb-3">הודעה על כל ליד חדש בוואטסאפ ובצ׳אט באתר, ועל כל הצעת מחיר שנשלחה (עם הרווח והחלק שלך).</p>
        {!tg ? <p className="text-sm text-gray-400">טוען…</p> : !tg.configured ? (
          d?.admin ? (
            <ol className="text-sm text-gray-700 list-decimal pr-5 space-y-1">
              <li>בטלגרם: פותחים את <b>@BotFather</b>, שולחים <code>/newbot</code> ונותנים שם (למשל SkiShare Sales). מקבלים טוקן.</li>
              <li>ב-Vercel: מוסיפים משתנה <code dir="ltr">TELEGRAM_SELLER_BOT_TOKEN</code> עם הטוקן, ועושים Redeploy.</li>
              <li>איש המכירות נכנס לכאן ומחבר את הטלגרם שלו בלחיצה.</li>
            </ol>
          ) : <p className="text-sm text-gray-600">ההתראות עוד לא הופעלו. ברגע שעדן יפעיל אותן, תוכל לחבר כאן את הטלגרם שלך.</p>
        ) : d?.admin && !tg.link ? (
          <p className="text-sm text-gray-600">הבוט מוגדר{tg.bot ? <> (<span dir="ltr">@{tg.bot}</span>)</> : null}. כל איש מכירות מחבר את עצמו מהאזור שלו.</p>
        ) : tg.connected ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold">מחובר ✓</span>
            <button onClick={() => tgAction("test")} className="px-3 py-1.5 rounded-xl border border-gray-300 text-sm font-bold">שליחת בדיקה</button>
            <button onClick={() => tgAction("disconnect")} className="px-3 py-1.5 rounded-xl text-sm text-gray-500 hover:underline">ניתוק</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {tg.link && <a href={tg.link} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-bold">1. פתח את הבוט ולחץ Start</a>}
            <button onClick={() => tgAction("connect")} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold">2. לחצתי, חבר אותי</button>
          </div>
        )}
        {msg && <p className="text-sm text-gray-700 mt-2">{msg}</p>}
      </div>

      {/* ── latest orders ── */}
      {d && (
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <b>{d.admin ? "הזמנות אחרונות" : "ההזמנות האחרונות שלך"}</b>
            <a href="/seller/orders" className="text-sm font-bold text-blue-600">הכל ←</a>
          </div>
          {d.orders.length === 0 ? <p className="p-4 text-sm text-gray-500">עוד אין הזמנות. הזמנה של לקוח שכתבת לו מהאזור הזה (לידים וצ׳אטים) נרשמת לך אוטומטית.</p> :
            d.orders.slice(0, 6).map(o => (
              <div key={o.code} className="flex items-center justify-between gap-3 p-3.5 border-b border-gray-50 text-sm">
                <div className="min-w-0">
                  <div className="font-bold truncate">{o.customer || "לקוח"} <span className="text-gray-400 font-normal">· {o.code}</span></div>
                  <div className="text-xs text-gray-500 truncate">{o.apartment}{o.checkin ? ` · ${dmy(o.checkin)}` : ""}</div>
                </div>
                <div className="text-left shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${ORDER_STATUS[o.status]?.cls ?? "bg-gray-100"}`}>{ORDER_STATUS[o.status]?.label ?? o.status}</span>
                  <div className="font-bold tabular-nums mt-1">{eur(o.total)}{!d.admin && o.share != null && <span className="text-amber-700"> · שלך {eur(o.share)}</span>}</div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
