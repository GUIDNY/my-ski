"use client";
import { useEffect, useState } from "react";
import type { Apartment } from "@/types";

const EMPTY: Partial<Apartment> = {
  name: "", type: "דירה", beds: 2, baths: 1, sqm: 60,
  price_per_night: 0, amenities: [], description: "", available: true,
};

export default function ApartmentsAdmin() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Apartment>>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/apartments");
    const data = await res.json();
    setApartments(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    if (editing) {
      await fetch(`/api/apartments/${editing}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/apartments", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק את הדירה?")) return;
    await fetch(`/api/apartments/${id}`, { method: "DELETE" });
    load();
  };

  const edit = (apt: Apartment) => {
    setForm(apt);
    setEditing(apt.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">דירות</h1>
          <p className="text-gray-500 text-sm mt-1">ניהול הדירות ב-Val Thorens</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          + הוסף דירה
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-gray-900 mb-5">{editing ? "עריכת דירה" : "דירה חדשה"}</h2>
            <div className="space-y-3">
              <input placeholder="שם הדירה" value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="סוג (שאלה / סטודיו / דירה / פנטהאוס)" value={form.type ?? ""} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="חדרים" value={form.beds ?? ""} onChange={e => setForm(f => ({ ...f, beds: +e.target.value }))}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="אמבטיות" value={form.baths ?? ""} onChange={e => setForm(f => ({ ...f, baths: +e.target.value }))}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="מ״ר" value={form.sqm ?? ""} onChange={e => setForm(f => ({ ...f, sqm: +e.target.value }))}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="relative">
                <span className="absolute right-3 top-3 text-gray-400 text-sm">€</span>
                <input type="number" placeholder="מחיר ללילה" value={form.price_per_night ?? ""} onChange={e => setForm(f => ({ ...f, price_per_night: +e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl pr-8 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input placeholder="שירותים (מופרד בפסיק): ג'קוזי, אח, WiFi" value={form.amenities?.join(", ") ?? ""}
                onChange={e => setForm(f => ({ ...f, amenities: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea placeholder="תיאור הדירה" value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.available ?? true} onChange={e => setForm(f => ({ ...f, available: e.target.checked }))}
                  className="w-4 h-4 rounded" />
                דירה זמינה להזמנה
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                {saving ? "שומר..." : editing ? "עדכן" : "הוסף דירה"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : !apartments.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">🏠</div>
          <div className="text-gray-500">אין דירות עדיין — הוסף את הראשונה</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["שם", "סוג", "חדרים", "מחיר/לילה", "זמין", "פעולות"].map(h => (
                  <th key={h} className="text-right px-5 py-3 font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {apartments.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-gray-900">{apt.name}</td>
                  <td className="px-5 py-4 text-gray-500">{apt.type}</td>
                  <td className="px-5 py-4 text-gray-500">{apt.beds} 🛏 · {apt.baths} 🚿</td>
                  <td className="px-5 py-4 font-bold text-gray-900">€{Number(apt.price_per_night).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${apt.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {apt.available ? "זמין" : "לא זמין"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => edit(apt)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">עריכה</button>
                      <button onClick={() => remove(apt.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">מחיקה</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
