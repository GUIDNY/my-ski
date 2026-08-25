"use client";
import { useEffect, useState } from "react";

type Transfer = {
  id: string;
  created_at: string;
  direction: "outbound" | "return" | "both";
  outbound_flight: string | null;
  outbound_date: string | null;
  outbound_time: string | null;
  return_flight: string | null;
  return_date: string | null;
  return_time: string | null;
  airport: string | null;
  passengers: number;
  total_price: number | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  notes: string | null;
  status: string | null;
  resort_slug: string | null;
  vehicle_class: string | null;
  quote_snapshot: unknown;
  winteride_ref: string | null;
  winteride_status: string | null;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "ממתין לאישור", cls: "bg-amber-100 text-amber-700" },
  confirmed: { label: "אושר והוזמן ב-Winteride ✓", cls: "bg-emerald-100 text-emerald-700" },
  rejected:  { label: "נדחה", cls: "bg-gray-100 text-gray-500" },
  cancelled: { label: "בוטל", cls: "bg-red-100 text-red-600" },
};

const fmt = (s: string | null) => (s ? new Date(s + "T12:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "short" }) : "—");
const DIRECTION_LABEL: Record<string, string> = { outbound: "הלוך (שדה → ואל טורנס)", return: "חזור (ואל טורנס → שדה)", both: "הלוך וחזור" };

export default function TransfersAdmin() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/transfers");
    setTransfers(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (t: Transfer) => {
    if (!confirm(`לאשר ולהזמין בפועל מול Winteride עבור ${t.customer_name}?\nזו פעולה שיוצרת הזמנה אמיתית ומחייבת (€${t.total_price ?? "?"}).`)) return;
    setBusy(t.id);
    const res = await fetch(`/api/transfers/${t.id}/approve`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok) alert(`✓ אושר. מספר הזמנה ב-Winteride: ${j.transfer?.winteride_ref ?? "—"}`);
    else alert(`שגיאה: ${j.error || "לא הצלחנו לאשר"}`);
    load();
  };

  const reject = async (t: Transfer) => {
    if (!confirm(`לדחות את הבקשה של ${t.customer_name}?`)) return;
    setBusy(t.id);
    await fetch(`/api/transfers/${t.id}/reject`, { method: "POST" });
    setBusy(null); load();
  };

  const cancelBooking = async (t: Transfer) => {
    if (!confirm(`לבטל את ההזמנה שכבר אושרה מול Winteride (${t.winteride_ref})? זו פעולה אמיתית.`)) return;
    setBusy(t.id);
    const res = await fetch(`/api/transfers/${t.id}/cancel-booking`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) alert(`שגיאה: ${j.error || "לא הצלחנו לבטל"}`);
    load();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">הסעות</h1>
        <p className="text-gray-500 text-sm mt-1">
          בקשות הסעה מהאתר. <strong>אישור</strong> יוצר הזמנה אמיתית ומחייבת מול Winteride — לא לפני שווידאתם את הפרטים.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : !transfers.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 text-gray-500">אין בקשות הסעה עדיין</div>
      ) : (
        <div className="space-y-3">
          {transfers.map(t => {
            const st = STATUS[t.status ?? "pending"] ?? STATUS.pending;
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-gray-900">{t.customer_name}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                      {t.vehicle_class && <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{t.vehicle_class}</span>}
                    </div>
                    <p className="text-sm text-gray-600">
                      {t.airport} ↔ ואל טורנס · {DIRECTION_LABEL[t.direction] ?? t.direction} · {t.passengers} נוסעים
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.direction !== "return" && <>הלוך: {fmt(t.outbound_date)} {t.outbound_time ?? ""} {t.outbound_flight ? `(${t.outbound_flight})` : ""} </>}
                      {t.direction !== "outbound" && <>· חזור: {fmt(t.return_date)} {t.return_time ?? ""} {t.return_flight ? `(${t.return_flight})` : ""}</>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.total_price != null && <>€{t.total_price} · </>}
                      {t.customer_email && <>{t.customer_email} · </>}
                      {t.customer_phone}
                    </p>
                    {t.winteride_ref && <p className="text-xs text-blue-600 mt-1">Winteride ref: {t.winteride_ref}</p>}
                    {t.notes && <p className="text-xs text-gray-400 mt-1">הערות: {t.notes}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {(!t.status || t.status === "pending") && (
                      <>
                        <button onClick={() => approve(t)} disabled={busy === t.id}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm px-4 py-2 rounded-xl transition">
                          {busy === t.id ? "מעבד…" : "אשר והזמן ב-Winteride"}
                        </button>
                        <button onClick={() => reject(t)} disabled={busy === t.id}
                          className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm px-3 py-2 rounded-xl transition">
                          דחה
                        </button>
                      </>
                    )}
                    {t.status === "confirmed" && t.winteride_ref && (
                      <button onClick={() => cancelBooking(t)} disabled={busy === t.id}
                        className="border border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm px-3 py-2 rounded-xl transition">
                        בטל הזמנה
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
