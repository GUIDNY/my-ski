"use client";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

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

const inp = "w-full min-h-[48px] rounded-xl border border-line-strong bg-white px-3.5 text-[16px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const lbl = "block text-[14px] font-bold text-ink mb-1.5";

export default function FlightDetailsModal({ open, onClose, value, onChange }: {
  open: boolean; onClose: () => void; value: Flight; onChange: (f: Flight) => void;
}) {
  const uid = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const set = (k: keyof Flight, v: string) => onChange({ ...value, [k]: v });
  const fid = (k: keyof Flight) => `${uid}-${k}`;
  // on <body>, so a sticky or transformed parent can't keep it under the site header
  return createPortal(
    <div dir="rtl" className="fixed inset-0 z-[95] bg-ink/55 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby={`${uid}-title`}
        className="bg-white w-full sm:max-w-md rounded-t-[24px] sm:rounded-[22px] p-5 sm:p-6 max-h-[90dvh] overflow-y-auto"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 id={`${uid}-title`} className="font-display font-bold text-[22px] leading-tight text-ink">פרטי הטיסה להסעה</h2>
          <button type="button" onClick={onClose} aria-label="סגירה"
            className="w-10 h-10 -mt-1 -ml-1 shrink-0 rounded-full hover:bg-soft text-muted flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <p className="text-[15px] text-body mb-5 leading-relaxed">
          השאטל מחכה לכם בשדה, בז&apos;נבה (GVA) או בליון (LYS). <b className="text-ink">אישור סופי להסעה מגיע עד 48 שעות לפני.</b> אם יש בעיה, ניצור איתכם קשר.
        </p>

        <fieldset className="mb-5">
          <legend className="font-bold text-[16px] text-ink mb-2.5">טיסת הלוך</legend>
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor={fid("arrDate")} className={lbl}>תאריך הנחיתה</label>
              <input id={fid("arrDate")} type="date" value={value.arrDate} onChange={e => set("arrDate", e.target.value)} className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={fid("arrFlight")} className={lbl}>מספר טיסה</label>
                <input id={fid("arrFlight")} value={value.arrFlight} onChange={e => set("arrFlight", e.target.value)} placeholder="LY345" dir="ltr" className={`${inp} text-right`} />
              </div>
              <div>
                <label htmlFor={fid("arrTime")} className={lbl}>שעת נחיתה</label>
                <input id={fid("arrTime")} type="time" value={value.arrTime} onChange={e => set("arrTime", e.target.value)} className={inp} />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="mb-6">
          <legend className="font-bold text-[16px] text-ink mb-2.5">טיסת חזור</legend>
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor={fid("retDate")} className={lbl}>תאריך החזרה</label>
              <input id={fid("retDate")} type="date" value={value.retDate} onChange={e => set("retDate", e.target.value)} className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={fid("retFlight")} className={lbl}>מספר טיסה</label>
                <input id={fid("retFlight")} value={value.retFlight} onChange={e => set("retFlight", e.target.value)} placeholder="LY346" dir="ltr" className={`${inp} text-right`} />
              </div>
              <div>
                <label htmlFor={fid("retTime")} className={lbl}>שעת המראה</label>
                <input id={fid("retTime")} type="time" value={value.retTime} onChange={e => set("retTime", e.target.value)} className={inp} />
              </div>
            </div>
          </div>
        </fieldset>

        <button type="button" onClick={onClose}
          className="w-full inline-flex items-center justify-center min-h-[48px] rounded-[14px] bg-accent hover:bg-accent-hover text-white font-bold text-[16px] transition-colors">
          שמירת פרטי הטיסה
        </button>
      </div>
    </div>,
    document.body
  );
}
