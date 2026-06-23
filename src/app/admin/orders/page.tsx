"use client";
import { useEffect, useState } from "react";
import type { Order } from "@/types";

const STATUS: Record<string, { label: string; cls: string }> = {
  awaiting:  { label: "🔥 ליד חם — הגיע לתשלום, לא שילם", cls: "bg-orange-100 text-orange-700" },
  hold:      { label: "פיקדון — ממתין לאישור", cls: "bg-amber-100 text-amber-700" },
  approved:  { label: "אושר ✓", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "בוטל", cls: "bg-red-100 text-red-600" },
};

const fmt = (s: string | null) => (s ? new Date(s + "T12:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "short" }) : "—");

const CANCEL_LABEL: Record<string, string> = { regular: "ביטול רגיל", none: "ללא ביטול", flexible: "ביטול גמיש" };

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/orders");
    setOrders(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (o: Order) => {
    if (!o.customer_email) { alert("⚠️ אין מייל ללקוח בהזמנה — לא יישלח אישור."); return; }
    const charges = !!o.payplus_transaction_uid;
    const msg = charges
      ? `לחייב את הפיקדון ולאשר את ההזמנה של ${o.customer_name || o.code}?\nהכרטיס יחויב בפועל ויישלח מייל אישור אל: ${o.customer_email}`
      : `לאשר את ההזמנה של ${o.customer_name || o.code}? (אין פיקדון מקושר — רק אישור + מייל)\nמייל יישלח אל: ${o.customer_email}`;
    if (!confirm(msg)) return;
    setBusy(o.id);
    const res = await fetch("/api/payplus/capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: o.id }) });
    const j = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok) alert(`✓ ${charges ? "הפיקדון חויב ו" : ""}ההזמנה אושרה. מייל אישור נשלח אל ${o.customer_email}`);
    else alert(`שגיאה: ${j.error || "לא הצלחנו לאשר"}`);
    load();
  };

  const setStatus = async (o: Order, status: string) => {
    setBusy(o.id);
    await fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null); load();
  };

  const remove = async (o: Order) => {
    if (!confirm("למחוק את ההזמנה?")) return;
    await fetch(`/api/orders/${o.id}`, { method: "DELETE" });
    load();
  };

  // operational checklist (persisted in orders.ops)
  const toggleOp = async (o: Order, key: string) => {
    const ops = { ...(o.ops || {}), [key]: !(o.ops && o.ops[key]) };
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, ops } : x));   // optimistic
    await fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ops }) });
  };

  const checklistFor = (o: Order) => {
    const items = [{ key: "address", label: "שליחת כתובת ופרטי צ׳ק-אין ללקוח" }, { key: "keys", label: "הכנת מפתחות בדלת (48ש׳ לפני)" }];
    if (o.transfer) items.unshift({ key: "transfer", label: "תיאום שאטל/הסעה משדה התעופה" });
    return items;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">הזמנות</h1>
        <p className="text-gray-500 text-sm mt-1">אישור פיקדונות ושליחת אישור הזמנה ללקוח</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : !orders.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 text-gray-500">אין הזמנות עדיין</div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const st = STATUS[o.status] || STATUS.awaiting;
            return (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
               <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-gray-900">{o.customer_name || "לקוח/ה"}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                    <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">קוד: {o.code}</span>
                  </div>
                  <p className="text-sm text-gray-600">{o.apartment_name} · {fmt(o.checkin)}–{fmt(o.checkout)} · {o.guests} אורחים · {o.nights} לילות</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    €{Number(o.total_eur).toLocaleString()}
                    {o.customer_email && <> · {o.customer_email}</>}
                    {o.customer_phone && <> · {o.customer_phone}</>}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {o.status !== "approved" && (
                    <button onClick={() => approve(o)} disabled={busy === o.id}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm px-4 py-2 rounded-xl transition">
                      {busy === o.id ? "מעבד…" : (o.payplus_transaction_uid ? "אשר וחייב פיקדון" : "אשר ושלח מייל")}
                    </button>
                  )}
                  {o.status !== "cancelled" && (
                    <button onClick={() => setStatus(o, "cancelled")} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm px-3 py-2 rounded-xl transition">בטל</button>
                  )}
                  <button onClick={() => remove(o)} className="text-red-500 hover:text-red-700 text-sm px-2">🗑</button>
                </div>
               </div>

                {/* add-ons summary chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {o.transfer && <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">🚐 הסעה{o.transfer_details ? ` · ${o.transfer_details}` : " · ללא פרטי טיסה"}</span>}
                  {o.ski_pass && <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">🎿 סקי פס</span>}
                  {o.equipment && <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">🎿 השכרת ציוד</span>}
                  <span className="text-xs font-semibold bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">🛡️ {CANCEL_LABEL[o.cancel] || o.cancel}</span>
                  <span className="text-xs font-semibold bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">{o.service === "ai" ? "🤖 AI" : "👤 שירות אנושי"}</span>
                  {o.group_id && <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">👥 תשלום מפוצל ({o.shares_total})</span>}
                  {o.extra_apartment_name && <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">+ {o.extra_apartment_name}</span>}
                </div>

                {/* checklist toggle */}
                {(o.status === "hold" || o.status === "approved") && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => setOpen(p => ({ ...p, [o.id]: !p[o.id] }))} className="text-sm font-bold text-blue-600 hover:underline">
                      צ׳ק-ליסט לטיפול {open[o.id] ? "▲" : "▼"}
                      {(() => { const items = checklistFor(o); const done = items.filter(it => o.ops && o.ops[it.key]).length; return <span className="text-xs font-normal text-gray-400 mr-1"> ({done}/{items.length})</span>; })()}
                    </button>
                    {open[o.id] && (
                      <div className="mt-2 space-y-1.5">
                        {checklistFor(o).map(it => {
                          const checked = !!(o.ops && o.ops[it.key]);
                          return (
                            <label key={it.key} className="flex items-center gap-2.5 cursor-pointer text-sm py-1">
                              <input type="checkbox" checked={checked} onChange={() => toggleOp(o, it.key)} className="w-4 h-4 accent-emerald-600" />
                              <span className={checked ? "line-through text-gray-400" : "text-gray-700"}>{it.label}</span>
                            </label>
                          );
                        })}
                        {o.transfer && o.transfer_details && (
                          <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-1">✈️ פרטי טיסה: {o.transfer_details}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
