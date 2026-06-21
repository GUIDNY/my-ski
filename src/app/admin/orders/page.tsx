"use client";
import { useEffect, useState } from "react";
import type { Order } from "@/types";

const STATUS: Record<string, { label: string; cls: string }> = {
  awaiting:  { label: "ממתין לתשלום", cls: "bg-gray-100 text-gray-500" },
  hold:      { label: "פיקדון — ממתין לאישור", cls: "bg-amber-100 text-amber-700" },
  approved:  { label: "אושר ✓", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "בוטל", cls: "bg-red-100 text-red-600" },
};

const fmt = (s: string | null) => (s ? new Date(s + "T12:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "short" }) : "—");

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/orders");
    setOrders(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (o: Order, status: string) => {
    if (status === "approved") {
      if (!o.customer_email) {
        alert("⚠️ אין מייל ללקוח בהזמנה הזו — לא יישלח אישור. (כנראה הזמנת בדיקה ישנה.)");
        return;
      }
      if (!confirm(`לאשר את ההזמנה של ${o.customer_name || o.code}?\nיישלח מייל אישור עם קוד אישי אל: ${o.customer_email}`)) return;
    }
    setBusy(o.id);
    const res = await fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null);
    if (status === "approved") {
      if (res.ok) alert(`✓ ההזמנה אושרה. מייל אישור נשלח אל ${o.customer_email}`);
      else alert("שגיאה באישור ההזמנה. נסה שוב.");
    }
    load();
  };

  const remove = async (o: Order) => {
    if (!confirm("למחוק את ההזמנה?")) return;
    await fetch(`/api/orders/${o.id}`, { method: "DELETE" });
    load();
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
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-4">
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
                    <button onClick={() => setStatus(o, "approved")} disabled={busy === o.id}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm px-4 py-2 rounded-xl transition">
                      {busy === o.id ? "מאשר…" : "אשר ושלח מייל"}
                    </button>
                  )}
                  {o.status !== "cancelled" && (
                    <button onClick={() => setStatus(o, "cancelled")} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm px-3 py-2 rounded-xl transition">בטל</button>
                  )}
                  <button onClick={() => remove(o)} className="text-red-500 hover:text-red-700 text-sm px-2">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
