"use client";
import { useEffect, useState } from "react";
import type { Booking } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "ממתין",
  confirmed: "מאושר",
  cancelled: "בוטל",
};

export default function BookingsAdmin() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/bookings")
      .then(r => r.json())
      .then(data => { setBookings(data); setLoading(false); });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as Booking["status"] } : b));
  };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">הזמנות</h1>
        <p className="text-gray-500 text-sm mt-1">ניהול כל ההזמנות</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[["all","הכל"], ["pending","ממתין"], ["confirmed","מאושר"], ["cancelled","בוטל"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filter === val ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : !filtered.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">📋</div>
          <div className="text-gray-500">אין הזמנות</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-black text-gray-900">{b.customer_name}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[b.status]}`}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 space-y-0.5">
                    <div>📧 {b.customer_email} {b.customer_phone && `· 📞 ${b.customer_phone}`}</div>
                    <div>🏠 {(b.apartment as { name: string } | null)?.name ?? "—"} · 👥 {b.guests} אנשים</div>
                    <div>📅 {b.check_in} → {b.check_out}</div>
                    {b.add_ons && Object.keys(b.add_ons).length > 0 && (
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {b.add_ons.ski_pass && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">🎿 סקי פס</span>}
                        {b.add_ons.transfer && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">🚌 הסעה</span>}
                        {b.add_ons.flight && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">✈️ טיסה</span>}
                        {b.add_ons.insurance && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">🛡️ ביטוח</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-left mr-4">
                  <div className="text-xl font-black text-gray-900 mb-3">€{Number(b.total_price).toLocaleString()}</div>
                  <div className="flex flex-col gap-1.5">
                    {b.status === "pending" && (
                      <button onClick={() => updateStatus(b.id, "confirmed")}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        ✓ אשר
                      </button>
                    )}
                    {b.status !== "cancelled" && (
                      <button onClick={() => updateStatus(b.id, "cancelled")}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        ✕ בטל
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
