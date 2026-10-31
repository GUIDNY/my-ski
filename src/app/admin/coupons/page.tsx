"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import type { Coupon } from "@/lib/coupons";

/* ניהול קודי קופון — רשימה קטנה: קוד, הנחה (אחוז או € קבוע), תוקף, הערה. */
export default function CouponsAdmin() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    authFetch("/api/admin/coupons").then(r => r.json()).then(j => { setCoupons(j.coupons || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const set = (i: number, patch: Partial<Coupon>) => setCoupons(cs => cs.map((c, j) => j === i ? { ...c, ...patch } : c));
  const save = async () => {
    setSaving(true);
    const r = await authFetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coupons }) });
    const j = await r.json().catch(() => ({}));
    setSaving(false);
    if (r.ok) { setCoupons(j.coupons || coupons); setSavedAt(new Date().toLocaleTimeString("he-IL")); }
    else alert(j.error || "השמירה נכשלה");
  };

  if (loading) return <p className="text-gray-400 p-6">טוען…</p>;
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900">קופונים</h1>
          <p className="text-gray-500 text-sm mt-1">הלקוח מזין את הקוד בשורת ״יש לכם קוד?״ בתשלום. אחוז או סכום קבוע ביורו.</p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-xs text-emerald-600 font-bold">נשמר {savedAt} ✓</span>}
          <button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm">
            {saving ? "שומר…" : "שמירה"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {coupons.map((c, i) => (
          <div key={i} className={`bg-white rounded-2xl border p-4 flex flex-wrap items-center gap-3 ${c.active ? "border-gray-100" : "border-gray-100 opacity-50"}`}>
            <input value={c.code} onChange={e => set(i, { code: e.target.value })} placeholder="קוד (למשל ski5)" dir="ltr"
              className="w-36 rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono font-bold text-left" />
            <div className="flex items-center gap-1.5">
              <input value={c.percent ?? ""} onChange={e => set(i, { percent: Number(e.target.value) || undefined, amount: undefined })} placeholder="%" inputMode="numeric"
                className="w-16 rounded-xl border border-gray-200 px-2 py-2 text-sm font-bold text-center" />
              <span className="text-xs text-gray-400">% או</span>
              <input value={c.amount ?? ""} onChange={e => set(i, { amount: Number(e.target.value) || undefined, percent: undefined })} placeholder="€" inputMode="numeric"
                className="w-20 rounded-xl border border-gray-200 px-2 py-2 text-sm font-bold text-center" />
              <span className="text-xs text-gray-400">€</span>
            </div>
            <input type="date" value={c.expires ?? ""} onChange={e => set(i, { expires: e.target.value || null })}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm" title="בתוקף עד (לא חובה)" />
            <input value={c.note ?? ""} onChange={e => set(i, { note: e.target.value })} placeholder="הערה (למי/למה)"
              className="flex-1 min-w-[140px] rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            {Number(c.uses) > 0 && <span className="text-xs font-bold text-gray-400">שומש {c.uses}×</span>}
            <label className="flex items-center gap-1.5 text-sm font-bold cursor-pointer">
              <input type="checkbox" checked={c.active} onChange={e => set(i, { active: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
              פעיל
            </label>
            <button onClick={() => setCoupons(cs => cs.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 px-1">🗑</button>
          </div>
        ))}
        {!coupons.length && <p className="text-gray-400 text-sm bg-white rounded-2xl border border-gray-100 p-6 text-center">אין קופונים עדיין — להוסיף את הראשון למטה.</p>}
      </div>

      <button onClick={() => setCoupons(cs => [...cs, { code: "", percent: 5, active: true }])}
        className="mt-4 text-sm font-bold text-blue-700 hover:text-blue-900">+ קופון חדש</button>
      <p className="text-xs text-gray-400 mt-3">לא לשכוח ללחוץ שמירה. ההנחה מחושבת שוב בשרת בזמן ההזמנה, אז אי אפשר לזייף אותה מהדפדפן.</p>
    </div>
  );
}
