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
    if (target === null) { setValue(0); return; }
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
  return value;
}

// One consolidated flight card — replaces what used to be two separate
// "check the price" info rows (Geneva + Lyon) plus a third "add flight"
// toggle for the cheaper of the two: same information, a third of the
// visual weight. Still links out to the exact scraped Google Flights page
// via a small inline "צפו" link for anyone who wants to double-check it.
export default function FlightAddOn({ state, airport, checked, onToggle, qty, setQty, maxQty, total }: {
  state: FlightPriceState; airport: string;
  checked: boolean; onToggle: (v: boolean) => void;
  qty: number; setQty: (n: number) => void; maxQty: number; total: number;
}) {
  const displayed = useCountUp(state.price);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (state.price) { const id = requestAnimationFrame(() => setRevealed(true)); return () => cancelAnimationFrame(id); }
    setRevealed(false);
  }, [state.price]);

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${checked ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white"}`}>
      <button type="button" onClick={() => state.price && onToggle(!checked)} disabled={!state.price}
        className={`w-full flex items-center gap-3 p-3.5 text-right ${!state.price ? "cursor-default" : "cursor-pointer"}`}>
        <span className={`flex-shrink-0 ${checked ? "text-blue-600" : "text-gray-400"}`}><IconPlane size={18} /></span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-800">הוסיפו טיסה ל-{airport}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {state.loading ? "בודקים מחיר טיסה…"
              : state.price ? `${state.nonstop ? "ישירה" : "עם עצירה"} · הזולה ביותר שמצאנו`
              : "לא נמצא מחיר כרגע"}
            {state.url && (
              <a href={state.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                className="text-blue-500 font-semibold hover:underline mr-1.5">צפו ←</a>
            )}
          </div>
        </div>
        {state.price ? (
          <span className={`text-sm font-black flex-shrink-0 text-blue-600 transition-all duration-500 ${revealed ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
            €{displayed} <span className="font-normal text-gray-400">לאדם</span>
          </span>
        ) : (
          <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-400 animate-spin flex-shrink-0" />
        )}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
          {checked && <IconCheck size={11} className="text-white" />}
        </div>
      </button>
      {checked && (
        <div className="flex items-center justify-between px-3.5 pb-3 pt-1 border-t border-blue-100">
          <span className="text-xs font-bold text-blue-700">כמה כרטיסים?</span>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}
              className="w-7 h-7 rounded-full bg-white border border-blue-200 text-blue-600 font-black disabled:opacity-40 leading-none">−</button>
            <span className="font-black text-gray-900 w-5 text-center">{qty}</span>
            <button type="button" onClick={() => setQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty}
              className="w-7 h-7 rounded-full bg-white border border-blue-200 text-blue-600 font-black disabled:opacity-40 leading-none">+</button>
            <span className="text-xs font-bold text-blue-700 w-16 text-left">= €{total.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
