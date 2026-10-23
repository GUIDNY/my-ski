"use client";
import { useEffect, useState } from "react";
import { IconPlane, IconCheck } from "@/components/Icons";
import type { FlightPriceState } from "@/lib/useFlightPrice";

// Counts a number up from 0 to `target` over `duration`ms — used purely for
// the "wow" reveal when a live price lands, requested after the sidebar
// felt cluttered with a separate info row + toggle row for the same thing.
function useCountUp(target: number | null, duration = 700): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === null) return;
    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return target === null ? 0 : value;
}

// One consolidated flight card: the cheaper of the Geneva and Lyon flights
// for the dates, a toggle to add it, and how many tickets. Still links out
// to the exact scraped Google Flights page for anyone who wants to check it.
export default function FlightAddOn({ state, airport, checked, onToggle, qty, setQty, maxQty, total, emptyText }: {
  state: FlightPriceState; airport: string;
  checked: boolean; onToggle: (v: boolean) => void;
  qty: number; setQty: (n: number) => void; maxQty: number; total: number;
  /** shown instead of "no price found" when there is nothing to look up yet */
  emptyText?: string;
}) {
  const displayed = useCountUp(state.price);
  const [revealedFor, setRevealedFor] = useState<number | null>(null);
  useEffect(() => {
    if (!state.price) return;
    const price = state.price;
    const id = requestAnimationFrame(() => setRevealedFor(price));
    return () => cancelAnimationFrame(id);
  }, [state.price]);
  const revealed = !!state.price && revealedFor === state.price;
  const step = "w-10 h-10 rounded-full border border-line-strong bg-white text-ink text-[20px] leading-none flex items-center justify-center transition-colors hover:border-ink disabled:opacity-35";

  return (
    <div className={`rounded-[18px] border transition-colors ${checked ? "border-accent ring-1 ring-accent bg-accent-soft/50" : state.price ? "border-line bg-white hover:border-line-strong" : "border-dashed border-line-strong bg-[#FBFCFE]"}`}>
      <button type="button" role="checkbox" aria-checked={checked} aria-disabled={!state.price}
        onClick={() => state.price && onToggle(!checked)}
        className={`w-full flex items-start gap-3.5 p-4 md:p-[18px] text-start rounded-[18px] ${state.price ? "cursor-pointer" : "cursor-default"}`}>
        <span className={`mt-0.5 w-[22px] h-[22px] shrink-0 rounded-md border-2 flex items-center justify-center ${checked ? "border-accent bg-accent text-white" : "border-line-strong bg-white"} ${state.price ? "" : "opacity-50"}`} aria-hidden="true">
          {checked && <IconCheck size={13} />}
        </span>
        <span className={`mt-px shrink-0 ${checked ? "text-accent" : "text-muted"}`} aria-hidden="true"><IconPlane size={20} /></span>
        <span className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="font-bold text-[16px] md:text-[17px] text-ink">טיסה ל-{airport}</span>
          <span className="text-[14px] md:text-[15px] leading-relaxed text-muted">
            {state.loading ? "בודקים מחיר טיסה…"
              : state.price ? `${state.nonstop ? "ישירה" : "עם עצירה"}${state.airline ? ` · ${state.airline}` : ""} · הכי זולה שמצאנו`
              : (emptyText ?? "לא מצאנו מחיר טיסה כרגע")}
          </span>
          {state.price ? (
            <span className={`mt-0.5 font-bold text-[15px] md:text-[16px] text-ink transition-all duration-500 ${revealed ? "opacity-100" : "opacity-0"}`}>
              €{displayed.toLocaleString("en-US")} לאדם
            </span>
          ) : state.loading ? (
            <span className="mt-1 w-4 h-4 rounded-full border-2 border-line-strong border-t-accent animate-spin" aria-hidden="true" />
          ) : null}
        </span>
      </button>
      {state.url && (
        <div className="ps-[86px] md:ps-[88px] pe-4 pb-3.5 -mt-2">
          <a href={state.url} target="_blank" rel="noopener noreferrer"
            className="text-[14px] font-bold text-accent hover:text-accent-hover">לבדוק את הטיסה בגוגל טיסות</a>
        </div>
      )}
      {checked && (
        <div className="px-4 md:px-[18px] pb-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl bg-white border border-line px-4 py-2.5">
            <span className="text-[15px] font-medium text-ink">כמה כרטיסים?</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5" role="group" aria-label="כמה כרטיסים">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="פחות" className={step}>−</button>
                <span className="w-8 text-center font-display font-bold text-[18px] text-ink" aria-live="polite">{qty}</span>
                <button type="button" onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty} aria-label="עוד" className={step}>+</button>
              </div>
              <span className="min-w-[68px] text-left font-bold text-[15px] text-ink">€{total.toLocaleString("en-US")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
