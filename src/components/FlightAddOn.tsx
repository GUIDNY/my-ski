"use client";
import { IconPlane, IconCheck, IconBriefcase } from "@/components/Icons";
import type { DirectFlightState } from "@/lib/useFlightPrice";
import { time24, type ReturnLeg } from "@/lib/flight-format";

const WEEKDAYS = ["יום א׳", "יום ב׳", "יום ג׳", "יום ד׳", "יום ה׳", "יום ו׳", "שבת"];
const dayLabel = (iso: string) => { const d = new Date(iso + "T12:00:00"); return `${WEEKDAYS[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}`; };
const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;

function Stepper({ label, qty, setQty, max, total }: { label: string; qty: number; setQty: (n: number) => void; max: number; total: number }) {
  const step = "w-10 h-10 rounded-full border border-line-strong bg-white text-ink text-[20px] leading-none flex items-center justify-center transition-colors hover:border-ink disabled:opacity-35";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl bg-white border border-line px-4 py-2.5">
      <span className="text-[15px] font-medium text-ink">{label}</span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5" role="group" aria-label={label}>
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="פחות" className={step}>−</button>
          <span className="w-8 text-center font-display font-bold text-[18px] text-ink" aria-live="polite">{qty}</span>
          <button type="button" onClick={() => setQty(Math.min(max, qty + 1))} disabled={qty >= max} aria-label="עוד" className={step}>+</button>
        </div>
        <span className="min-w-[68px] text-left font-bold text-[15px] text-ink tabular-nums">{eur(total)}</span>
      </div>
    </div>
  );
}

/** "הלוך  שבת 2.1" and under it "יוצאת 06:15 · נוחתת 09:40" */
function Leg({ label, date, depart, arrive, pending }: { label: string; date: string; depart: string | null; arrive: string | null; pending?: boolean }) {
  const d = time24(depart), a = time24(arrive);
  return (
    <div className="flex items-start gap-2 text-[14px] md:text-[15px] leading-snug">
      <span className="shrink-0 w-[38px] font-bold text-ink">{label}</span>
      <span className="flex flex-col text-body">
        <span>{dayLabel(date)}</span>
        {d && a ? <span>יוצאת <b className="text-ink tabular-nums" dir="ltr">{d}</b> · נוחתת <b className="text-ink tabular-nums" dir="ltr">{a}</b></span>
          : pending ? <span className="text-muted">בודקים שעות…</span> : null}
      </span>
    </div>
  );
}

/*
 * The flight add-on. Only a real direct round trip is ever offered: the
 * cheapest direct one of Geneva and Lyon for the dates, at its live Google
 * Flights price, with both legs spelled out. When there is no direct flight
 * the card says so and there is nothing to add. A checked bag belongs to the
 * flight, so it sits inside this card.
 */
export default function FlightAddOn({ state, ret, checkin, checkout, checked, onToggle, qty, setQty, maxQty, total, bag }: {
  state: DirectFlightState;
  ret: { leg: ReturnLeg | null; loading: boolean };
  checkin: string; checkout: string;
  checked: boolean; onToggle: (v: boolean) => void;
  qty: number; setQty: (n: number) => void; maxQty: number; total: number;
  bag: { on: boolean; toggle: () => void; qty: number; setQty: (n: number) => void; total: number; unit: number };
}) {
  const f = state.status === "found" ? state.flight : null;

  if (!f) {
    const text = state.status === "loading" ? "בודקים טיסות ישירות מתל אביב לז'נבה ולליון…"
      : state.status === "none" ? "אין טיסה ישירה הלוך וחזור בתאריכים האלה, אז אין טיסה להוסיף."
      : state.status === "error" ? "לא הצלחנו לבדוק טיסות כרגע. נסו שוב עוד מעט, או כתבו לנו ונבדוק."
      : "בחרו תאריכים ונבדוק אם יש טיסה ישירה.";
    return (
      <div className="flex items-start gap-3.5 rounded-[18px] border border-dashed border-line-strong bg-[#FBFCFE] p-4 md:p-[18px]">
        <span className="mt-px shrink-0 text-muted" aria-hidden="true"><IconPlane size={20} /></span>
        <span className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="font-bold text-[16px] md:text-[17px] text-ink">טיסה ישירה</span>
          <span className="text-[14px] md:text-[15px] leading-relaxed text-muted" aria-live="polite">{text}</span>
          {state.status === "none" && (
            <span className="text-[14px] leading-relaxed text-muted">בלוח התאריכים, מטוס קטן מסמן ימים שיש בהם בדרך כלל טיסה ישירה.</span>
          )}
        </span>
        {state.status === "loading" && <span className="mt-1 w-4 h-4 shrink-0 rounded-full border-2 border-line-strong border-t-accent animate-spin" aria-hidden="true" />}
      </div>
    );
  }

  const outAirline = f.airline;
  const backAirline = ret.leg?.airline && ret.leg.airline !== outAirline ? ret.leg.airline : null;
  const airlineText = backAirline ? `הלוך ${outAirline ?? ""}, חזור ${backAirline}` : outAirline;

  return (
    <div className={`rounded-[18px] border transition-colors ${checked ? "border-accent ring-1 ring-accent bg-accent-soft/50" : "border-line bg-white hover:border-line-strong"}`}>
      <button type="button" role="checkbox" aria-checked={checked} onClick={() => onToggle(!checked)}
        className="w-full flex items-start gap-3.5 p-4 md:p-[18px] text-start rounded-[18px] cursor-pointer">
        <span className={`mt-0.5 w-[22px] h-[22px] shrink-0 rounded-md border-2 flex items-center justify-center ${checked ? "border-accent bg-accent text-white" : "border-line-strong bg-white"}`} aria-hidden="true">
          {checked && <IconCheck size={13} />}
        </span>
        <span className={`mt-px shrink-0 ${checked ? "text-accent" : "text-muted"}`} aria-hidden="true"><IconPlane size={20} /></span>
        <span className="flex-1 min-w-0 flex flex-col gap-1.5">
          <span className="font-bold text-[16px] md:text-[17px] text-ink">טיסה ישירה הלוך וחזור, תל אביב ⇄ {f.city}</span>
          <span className="text-[14px] text-muted">{airlineText ? `${airlineText} · ` : ""}הכי זולה שמצאנו בטיסות הישירות</span>
          <span className="mt-1 flex flex-col gap-1">
            <Leg label="הלוך" date={checkin} depart={f.departTime} arrive={f.arriveTime} />
            <Leg label="חזור" date={checkout} depart={ret.leg?.departTime ?? null} arrive={ret.leg?.arriveTime ?? null} pending={ret.loading} />
            {(f.departTime || ret.leg?.departTime) && <span className="text-[13px] text-muted">השעות לפי השעון המקומי בכל שדה.</span>}
          </span>
          <span className="mt-1 font-bold text-[15px] md:text-[16px] text-ink">{eur(f.price)} לאדם, הלוך וחזור</span>
          <span className="text-[13px] leading-snug text-muted">המחיר כמו ב-Google Flights עכשיו, והוא יכול להשתנות עד שסוגרים את הטיסה.</span>
        </span>
      </button>
      {f.url && (
        <div className="ps-[86px] md:ps-[88px] pe-4 pb-3.5 -mt-2">
          <a href={f.url} target="_blank" rel="noopener noreferrer"
            className="text-[14px] font-bold text-accent hover:text-accent-hover">לראות את הטיסה ב-Google Flights</a>
        </div>
      )}
      {checked && (
        <div className="px-4 md:px-[18px] pb-4 flex flex-col gap-2.5">
          <Stepper label="כמה כרטיסים?" qty={qty} setQty={setQty} max={maxQty} total={total} />
          <button type="button" role="checkbox" aria-checked={bag.on} onClick={bag.toggle}
            className={`w-full flex items-start gap-3 rounded-2xl border px-4 py-3 text-start transition-colors ${bag.on ? "border-accent bg-white" : "border-line bg-white hover:border-line-strong"}`}>
            <span className={`mt-0.5 w-[20px] h-[20px] shrink-0 rounded-md border-2 flex items-center justify-center ${bag.on ? "border-accent bg-accent text-white" : "border-line-strong bg-white"}`} aria-hidden="true">
              {bag.on && <IconCheck size={12} />}
            </span>
            <span className={`shrink-0 ${bag.on ? "text-accent" : "text-muted"}`} aria-hidden="true"><IconBriefcase size={18} /></span>
            <span className="flex-1 min-w-0 flex flex-col gap-0.5">
              <span className="font-bold text-[15px] text-ink">מזוודה לבטן</span>
              <span className="text-[14px] text-muted">הלוך וחזור · {eur(bag.unit)} לאדם</span>
            </span>
          </button>
          {bag.on && <Stepper label="כמה מזוודות?" qty={bag.qty} setQty={bag.setQty} max={maxQty} total={bag.total} />}
        </div>
      )}
    </div>
  );
}
