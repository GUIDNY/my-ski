"use client";
import { useEffect, useState } from "react";
import { codeOf, type TransferAnswer, type TransferOption } from "@/lib/transfer-options";

/*
 * The transfer of a deal: every option for the trip's dates, airport and
 * flight (shared shuttle when the flight has one, every private car that
 * takes the group), live Winteride prices. Picks the best one by itself and
 * reports the pick up (the deal adds its price); the customer can change it.
 */

const SHARED_WHY: Record<string, string> = {
  no_flight: "עם מספר טיסה נבדוק אם יש לה שאטל משותף, בדרך כלל זול יותר",
  flight_not_found: "לא מצאנו את הטיסה אצל חברת ההסעות, אז מוצגים רכבים פרטיים",
};

export default function TransferChooser({ pax, outDate, retDate, outFlight, retFlight, airport: fixedAirport, luggage, ski, value, onChange, onFlightClick, preferCode }: {
  pax: number; outDate: string; retDate: string;
  outFlight?: string; retFlight?: string;
  /** the deal's flight lands here: no airport choice then */
  airport?: "GVA" | "LYS" | null;
  luggage?: number; ski?: number;
  value: string | null;
  onChange: (o: TransferOption | null) => void;
  /** the option a quote link carried (CLASS_CODE), picked first while it's offered */
  preferCode?: string;
  /** opens the flight details form (for the shuttle) */
  onFlightClick?: () => void;
}) {
  const [airportSel, setAirportSel] = useState<"GVA" | "LYS">(fixedAirport ?? "GVA");
  const airport = fixedAirport ?? airportSel;
  const key = [airport, outDate, retDate, outFlight || "", retFlight || "", pax, luggage ?? "", ski ?? ""].join("|");
  const [res, setRes] = useState<{ key: string; a: TransferAnswer | null }>({ key: "", a: null });
  const loading = !!(outDate || retDate) && res.key !== key;

  useEffect(() => {
    if (!outDate && !retDate) return;
    let cancelled = false;
    const t = setTimeout(() => {
      fetch("/api/transfers/options", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ airport, outDate, retDate, outFlight, retFlight, pax, luggage, ski }) })
        .then(r => r.json()).then((a: TransferAnswer) => { if (!cancelled) setRes({ key, a }); })
        .catch(() => { if (!cancelled) setRes({ key, a: null }); });
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const a = res.key === key ? res.a : null;
  const options = a?.ok ? a.options : [];
  // keep the pick valid: the customer's choice while it's still offered, otherwise the best one
  useEffect(() => {
    if (loading) return;
    const cur = options.find(o => o.key === value);
    const next = cur ?? (preferCode ? options.find(o => codeOf(o) === preferCode) : undefined) ?? options.find(o => o.key === a?.best) ?? null;
    if ((next?.key ?? null) !== value || (cur && next)) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, a, value]);

  if (!outDate && !retDate) return <p className="text-[14px] text-muted">בוחרים תאריכים ורואים את כל אפשרויות ההסעה במחיר חי.</p>;

  return (
    <div className="flex flex-col gap-2.5">
      {!fixedAirport && (
        <div role="radiogroup" aria-label="שדה תעופה" className="grid grid-cols-2 gap-1 bg-soft border border-line rounded-xl p-1">
          {(["GVA", "LYS"] as const).map(c => (
            <button key={c} type="button" role="radio" aria-checked={airport === c} onClick={() => setAirportSel(c)}
              className={`min-h-[40px] rounded-lg text-[14px] font-bold transition-colors ${airport === c ? "bg-ink text-white" : "text-ink hover:bg-white"}`}>
              {c === "GVA" ? "מז'נבה" : "מליון"}
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <div className="flex flex-col gap-2" aria-hidden="true">{[1, 2, 3].map(i => <div key={i} className="h-[58px] rounded-xl bg-soft-2 animate-pulse" />)}</div>
      ) : !options.length ? (
        <p className="text-[14px] text-warn bg-warn-soft rounded-xl px-3.5 py-2.5">לא הצלחנו לקבל עכשיו מחיר הסעה. נשלים אותו באישור ההזמנה.</p>
      ) : (
        <div role="radiogroup" aria-label="סוג ההסעה" className="flex flex-col gap-2">
          {options.map(o => {
            const on = o.key === value;
            return (
              <button key={o.key} type="button" role="radio" aria-checked={on} disabled={!o.fits && o.kind === "shared"}
                onClick={() => onChange(o)}
                className={`rounded-xl border text-right px-3.5 py-2.5 min-h-[58px] flex items-center justify-between gap-3 transition-colors disabled:opacity-50 ${on ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line bg-white hover:border-line-strong"}`}>
                <span className="flex flex-col">
                  <span className="font-bold text-[15px] text-ink">
                    {o.name}
                    {o.key === a?.best && <span className="ms-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-ok-soft text-ok-text align-middle">{o.kind === "shared" ? "הכי משתלם" : "מתאים לכם"}</span>}
                    {o.onRequest && <span className="ms-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-soft text-muted align-middle">באישור ידני</span>}
                  </span>
                  <span className={`text-[13px] ${o.fits ? "text-muted" : "text-warn"}`}>
                    {o.kind === "shared" ? `מושב לכל נוסע, לפי הטיסה${o.seatsLeft != null && o.seatsLeft < 8 ? ` · נשארו ${o.seatsLeft} מקומות` : ""}` : `עד ${o.maxPax} נוסעים · עד ${o.maxBags} תיקים${o.fits ? "" : " · קטן לכמות התיקים"}`}
                  </span>
                </span>
                <span className="flex flex-col items-end shrink-0">
                  <span className="font-display font-extrabold text-[18px] text-ink">€{o.total}</span>
                  <span className="text-[12px] text-muted">€{o.perPerson} לאדם</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {!loading && a?.ok && a.sharedReason && (
        <p className="text-[13px] text-muted">
          {SHARED_WHY[a.sharedReason] ?? "לטיסה הזו אין שאטל משותף, אז מוצגים רכבים פרטיים"}
          {a.sharedReason === "no_flight" && onFlightClick && <> · <button type="button" onClick={onFlightClick} className="font-bold text-accent hover:underline">להוסיף מספר טיסה</button></>}
        </p>
      )}
      {!loading && a?.driveMinutes ? <p className="text-[13px] text-muted">כ-{Math.floor(a.driveMinutes / 60)}:{String(a.driveMinutes % 60).padStart(2, "0")} שעות נסיעה, עד דלת הדירה. מחיר לכל הקבוצה, {retDate && outDate ? "הלוך וחזור" : "כיוון אחד"}.</p> : null}
    </div>
  );
}
