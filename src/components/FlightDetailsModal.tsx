"use client";

export type Flight = { arrDate: string; arrFlight: string; arrTime: string; retDate: string; retFlight: string; retTime: string };
export const EMPTY_FLIGHT: Flight = { arrDate: "", arrFlight: "", arrTime: "", retDate: "", retFlight: "", retTime: "" };

export const flightFilled = (f: Flight) => !!(f.arrFlight || f.arrDate);
export const flightToString = (f: Flight) => {
  if (!flightFilled(f)) return "";
  const arr = `הגעה: ${f.arrDate || "?"} · טיסה ${f.arrFlight || "?"}${f.arrTime ? ` בשעה ${f.arrTime}` : ""}`;
  const ret = (f.retFlight || f.retDate)
    ? ` | חזרה: ${f.retDate || "?"} · טיסה ${f.retFlight || "?"}${f.retTime ? ` בשעה ${f.retTime}` : ""}`
    : "";
  return arr + ret;
};

const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function FlightDetailsModal({ open, onClose, value, onChange }: {
  open: boolean; onClose: () => void; value: Flight; onChange: (f: Flight) => void;
}) {
  if (!open) return null;
  const set = (k: keyof Flight, v: string) => onChange({ ...value, [k]: v });
  return (
    <div dir="rtl" className="fixed inset-0 z-[95] bg-black/55 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-xl font-black text-slate-900">פרטי טיסה להסעה 🚐</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 text-xl">✕</button>
        </div>
        <p className="text-sm text-slate-500 mb-4 leading-relaxed">השאטל יחכה לך ב-Geneva (GVA) או Lyon (LYS). <b className="text-slate-700">האישור הסופי להסעה ניתן עד 48 שעות</b>; אם תהיה בעיה כלשהי ניצור איתך קשר (בדרך כלל ללא תקלות).</p>

        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">טיסת הגעה ✈️</div>
        <div className="space-y-2.5 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">תאריך הגעה</label>
            <input type="date" value={value.arrDate} onChange={e => set("arrDate", e.target.value)} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">מספר טיסה</label>
              <input value={value.arrFlight} onChange={e => set("arrFlight", e.target.value)} placeholder="LY345" dir="ltr" className={`${inp} text-right`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">שעת נחיתה</label>
              <input type="time" value={value.arrTime} onChange={e => set("arrTime", e.target.value)} className={inp} />
            </div>
          </div>
        </div>

        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">טיסת חזור 🛫</div>
        <div className="space-y-2.5 mb-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">תאריך חזרה</label>
            <input type="date" value={value.retDate} onChange={e => set("retDate", e.target.value)} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">מספר טיסה</label>
              <input value={value.retFlight} onChange={e => set("retFlight", e.target.value)} placeholder="LY346" dir="ltr" className={`${inp} text-right`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">שעת המראה</label>
              <input type="time" value={value.retTime} onChange={e => set("retTime", e.target.value)} className={inp} />
            </div>
          </div>
        </div>

        <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition">שמירת פרטי טיסה</button>
      </div>
    </div>
  );
}
