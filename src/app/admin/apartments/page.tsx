"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Apartment } from "@/types";

const EMPTY: Partial<Apartment> = {
  name: "", type: "דירה", beds: 2, baths: 1, sqm: 60, max_guests: 4,
  price_per_night: 0, amenities: [], description: "", available: true, images: [],
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
      const { url, error } = await res.json();
      if (url) urls.push(url);
      else console.error("upload error:", error);
    }
    onChange([...images, ...urls]);
    setUploading(false);
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  };

  return (
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">תמונות</label>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((url, i) => (
            <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => remove(i)}
                className="absolute inset-0 bg-black/50 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                מחק
              </button>
              {i === 0 && (
                <div className="absolute bottom-0 left-0 right-0 text-center text-white text-[10px] font-bold bg-blue-600/80 py-0.5">
                  ראשית
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-5 text-center cursor-pointer transition-colors"
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 font-medium">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            מעלה תמונות...
          </div>
        ) : (
          <>
            <div className="text-2xl mb-1">📸</div>
            <div className="text-sm font-medium text-gray-600">גרור תמונות לכאן או לחץ לבחור</div>
            <div className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP · מספר תמונות בבת אחת</div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files?.length) upload(e.target.files); }}
        />
      </div>
    </div>
  );
}

/* ── Main admin page ──────────────────────────────────────── */
export default function ApartmentsAdmin() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Apartment>>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [adjApt, setAdjApt] = useState<Apartment | null>(null);
  const [adjMode, setAdjMode] = useState<"percent" | "fixed">("percent");
  const [adjValue, setAdjValue] = useState("");
  const [adjBusy, setAdjBusy] = useState(false);

  const applyAdjust = async () => {
    if (!adjApt) return;
    const v = Number(adjValue);
    if (!isFinite(v) || v === 0) { alert("הזן/י ערך (למשל ‎-10 לאחוז או ‎-20 לסכום)"); return; }
    if (!confirm(`לעדכן את כל המחירון של "${adjApt.name}" ב-${adjMode === "percent" ? `${v}%` : `€${v}`}? פעולה זו משנה את כל הלוח.`)) return;
    setAdjBusy(true);
    const r = await fetch(`/api/apartments/${adjApt.id}/price-adjust`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: adjMode, value: v }),
    });
    const j = await r.json().catch(() => ({}));
    setAdjBusy(false);
    if (r.ok) { alert(`✓ עודכנו ${j.updated ?? 0} מחירים + מחיר הבסיס.`); setAdjApt(null); setAdjValue(""); load(); }
    else alert(`שגיאה: ${j.error || "לא הצלחנו"}`);
  };
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/apartments?all=1");
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

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">דירות</h1>
          <p className="text-gray-500 text-sm mt-1">ניהול הדירות ב-Val Thorens</p>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-black text-gray-900 mb-5">
              {editing ? "עריכת דירה" : "דירה חדשה"}
            </h2>

            <div className="space-y-3" dir="rtl">
              <input placeholder="שם הדירה" value={form.name ?? ""}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <input placeholder="סוג (שאלה / סטודיו / דירה / פנטהאוס)" value={form.type ?? ""}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="חדרים" value={form.beds ?? ""}
                  onChange={e => setForm(f => ({ ...f, beds: +e.target.value }))}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="אמבטיות" value={form.baths ?? ""}
                  onChange={e => setForm(f => ({ ...f, baths: +e.target.value }))}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="מ״ר" value={form.sqm ?? ""}
                  onChange={e => setForm(f => ({ ...f, sqm: +e.target.value }))}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">מספר אנשים מקסימלי בדירה</label>
                <input type="number" min={1} placeholder="לדוגמה: 4" value={form.max_guests ?? ""}
                  onChange={e => setForm(f => ({ ...f, max_guests: +e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">קישור Google Maps (הדבק/י כתובת מפה)</label>
                <input placeholder="https://maps.google.com/..." value={form.map_url ?? ""} dir="ltr"
                  onChange={e => setForm(f => ({ ...f, map_url: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="relative">
                <span className="absolute right-3 top-3 text-gray-400 text-sm">€</span>
                <input type="number" placeholder="מחיר ללילה" value={form.price_per_night ?? ""}
                  onChange={e => setForm(f => ({ ...f, price_per_night: +e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl pr-8 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <input placeholder="שירותים (מופרד בפסיק): ג'קוזי, אח, WiFi"
                value={form.amenities?.join(", ") ?? ""}
                onChange={e => setForm(f => ({ ...f, amenities: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <textarea placeholder="תיאור הדירה" value={form.description ?? ""}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />

              {/* Image upload */}
              <ImageUploader
                images={form.images ?? []}
                onChange={imgs => setForm(f => ({ ...f, images: imgs }))}
              />

              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.available ?? true}
                  onChange={e => setForm(f => ({ ...f, available: e.target.checked }))}
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
          <div className="text-gray-500">אין דירות עדיין — הוסף את הראשונה</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["תמונה", "שם", "סוג", "חדרים", "מחיר/לילה", "זמין", "פעולות"].map(h => (
                  <th key={h} className="text-right px-4 py-3 font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {apartments.map(apt => (
                <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    {apt.images?.[0] ? (
                      <img src={apt.images[0]} alt={apt.name}
                        className="w-12 h-10 object-cover rounded-lg border border-gray-100" />
                    ) : (
                      <div className="w-12 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">—</div>
                    )}
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-900">{apt.name}</td>
                  <td className="px-4 py-4 text-gray-500">{apt.type}</td>
                  <td className="px-4 py-4 text-gray-500">{apt.beds} · {apt.baths}</td>
                  <td className="px-4 py-4 font-bold text-gray-900">€{Number(apt.price_per_night).toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                      ${apt.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {apt.available ? "זמין" : "לא זמין"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-3 items-center">
                      <Link href={`/admin/apartments/${apt.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors">
                        ניהול דירה →
                      </Link>
                      <button onClick={() => { setAdjApt(apt); setAdjValue(""); }} className="text-amber-600 hover:text-amber-800 font-medium text-xs">💰 מחיר גלובלי</button>
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

      {/* ── Global price adjustment ──────────────────────────── */}
      {adjApt && (
        <div dir="rtl" className="fixed inset-0 z-[80] bg-black/55 flex items-center justify-center p-4" onClick={() => !adjBusy && setAdjApt(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black text-gray-900 mb-1">שינוי מחיר גלובלי</h2>
            <p className="text-sm text-gray-500 mb-4">משנה את <b>כל המחירון</b> של "{adjApt.name}" (כל החודשים + מחיר הבסיס).</p>

            <div className="flex gap-2 mb-3">
              <button onClick={() => setAdjMode("percent")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${adjMode === "percent" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"}`}>אחוז (%)</button>
              <button onClick={() => setAdjMode("fixed")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${adjMode === "fixed" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"}`}>סכום (€)</button>
            </div>

            <label className="text-xs font-bold text-gray-400 block mb-1">ערך (מספר שלילי = הנחה)</label>
            <input type="number" value={adjValue} onChange={e => setAdjValue(e.target.value)}
              placeholder={adjMode === "percent" ? "לדוגמה: -10 (10% הנחה)" : "לדוגמה: -20 (€20 הנחה)"}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-400 mb-4">
              {adjMode === "percent" ? "‎-10 = הנחה של 10% · 15 = העלאה של 15%" : "‎-20 = €20 פחות לכל לילה · 30 = €30 יותר"}
            </p>

            <div className="flex gap-2">
              <button onClick={applyAdjust} disabled={adjBusy}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition">
                {adjBusy ? "מעדכן…" : "החל על כל המחירון"}
              </button>
              <button onClick={() => setAdjApt(null)} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
