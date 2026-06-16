"use client";
import { useEffect, useRef, useState } from "react";
import type { SeasonRental } from "@/types";

const EMPTY: Partial<SeasonRental> = {
  name: "", area: "Val Thorens", beds: 1, sleeps: 2,
  price_per_month: 0, min_months: 2, available_from: null, available_to: null,
  amenities: [], description: "", available: true, images: [],
};

/* ── Image uploader ───────────────────────────────────────── */
function ImageUploader({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const { url } = await res.json();
      if (url) urls.push(url);
    }
    onChange([...images, ...urls]);
    setUploading(false);
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">תמונות</label>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((url, i) => (
            <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => remove(i)}
                className="absolute inset-0 bg-black/50 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">מחק</button>
              {i === 0 && <div className="absolute bottom-0 inset-x-0 text-center text-white text-[10px] font-bold bg-blue-600/80 py-0.5">ראשית</div>}
            </div>
          ))}
        </div>
      )}
      <div onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) upload(e.dataTransfer.files); }}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-5 text-center cursor-pointer transition-colors">
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 font-medium">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> מעלה תמונות...
          </div>
        ) : (
          <>
            <div className="text-2xl mb-1">📸</div>
            <div className="text-sm font-medium text-gray-600">גרור תמונות לכאן או לחץ לבחור</div>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { if (e.target.files?.length) upload(e.target.files); }} />
      </div>
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function SeasonRentalsAdmin() {
  const [rentals, setRentals] = useState<SeasonRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<SeasonRental>>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/season-rentals");
    setRentals(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const payload = { ...form, available_from: form.available_from || null, available_to: form.available_to || null };
    if (editing) {
      await fetch(`/api/season-rentals/${editing}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/season-rentals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setSaving(false); setShowForm(false); setEditing(null); setForm(EMPTY); load();
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק את הדירה?")) return;
    await fetch(`/api/season-rentals/${id}`, { method: "DELETE" });
    load();
  };

  const edit = (r: SeasonRental) => { setForm(r); setEditing(r.id); setShowForm(true); };
  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">דירות סזונרים</h1>
          <p className="text-gray-500 text-sm mt-1">ניהול דירות לטווח ארוך · אזור הסזונרים</p>
        </div>
        <button onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
          + הוסף דירה
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black text-gray-900 mb-5">{editing ? "עריכת דירה" : "דירה חדשה"}</h2>

            <div className="space-y-3" dir="rtl">
              <input placeholder="שם הדירה" value={form.name ?? ""}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />

              <input placeholder="אזור (Val Thorens / Les Menuires...)" value={form.area ?? ""}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))} className={inputCls} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">חדרים</label>
                  <input type="number" value={form.beds ?? ""} onChange={e => setForm(f => ({ ...f, beds: +e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">עד כמה אנשים</label>
                  <input type="number" value={form.sleeps ?? ""} onChange={e => setForm(f => ({ ...f, sleeps: +e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">מחיר לחודש (€)</label>
                  <input type="number" value={form.price_per_month ?? ""} onChange={e => setForm(f => ({ ...f, price_per_month: +e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">מינימום חודשים</label>
                  <input type="number" value={form.min_months ?? ""} onChange={e => setForm(f => ({ ...f, min_months: +e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">זמינה מתאריך</label>
                  <input type="date" value={form.available_from ?? ""} onChange={e => setForm(f => ({ ...f, available_from: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">זמינה עד תאריך</label>
                  <input type="date" value={form.available_to ?? ""} onChange={e => setForm(f => ({ ...f, available_to: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <input placeholder="שירותים (מופרד בפסיק): WiFi, חימום, מטבחון"
                value={form.amenities?.join(", ") ?? ""}
                onChange={e => setForm(f => ({ ...f, amenities: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                className={inputCls} />

              <textarea placeholder="תיאור" value={form.description ?? ""} rows={3}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={`${inputCls} resize-none`} />

              <ImageUploader images={form.images ?? []} onChange={imgs => setForm(f => ({ ...f, images: imgs }))} />

              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.available ?? true}
                  onChange={e => setForm(f => ({ ...f, available: e.target.checked }))} className="w-4 h-4 rounded" />
                מוצגת באתר (זמינה)
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={save} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                {saving ? "שומר..." : editing ? "עדכן" : "הוסף דירה"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : !rentals.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-gray-500">אין דירות סזונרים עדיין — הוסף את הראשונה</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["תמונה", "שם", "אזור", "חדרים", "מחיר/חודש", "מינ׳", "זמין", "פעולות"].map(h => (
                  <th key={h} className="text-right px-4 py-3 font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rentals.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    {r.images?.[0]
                      ? <img src={r.images[0]} alt={r.name} className="w-12 h-10 object-cover rounded-lg border border-gray-100" />
                      : <div className="w-12 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">—</div>}
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-900">{r.name}</td>
                  <td className="px-4 py-4 text-gray-500">{r.area}</td>
                  <td className="px-4 py-4 text-gray-500">{r.beds} · עד {r.sleeps}</td>
                  <td className="px-4 py-4 font-bold text-gray-900">€{Number(r.price_per_month).toLocaleString()}</td>
                  <td className="px-4 py-4 text-gray-500">{r.min_months} ח׳</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {r.available ? "מוצגת" : "מוסתרת"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-3 items-center">
                      <button onClick={() => edit(r)} className="text-blue-600 hover:text-blue-800 font-medium text-xs">עריכה</button>
                      <button onClick={() => remove(r.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">מחיקה</button>
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
