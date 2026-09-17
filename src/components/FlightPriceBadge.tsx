"use client";
import { useEffect, useState } from "react";
import { IconPlane } from "@/components/Icons";

type State = { price: number | null; nonstop: boolean; url: string | null; loading: boolean };

// Renders the whole clickable row (icon + label + price), not just the
// price text — the href has to come from this component, because it must
// be the *exact* URL the price was scraped from (previously the row linked
// to a separately-built Skyscanner/Google Flights URL that could show a
// different fare than what was displayed, which was a real, reported bug).
export default function FlightPriceBadge({ origin, dest, checkin, checkout, label, sublabel, fallbackUrl }: {
  origin: string; dest: string; checkin: string; checkout: string;
  label: string; sublabel: string; fallbackUrl: string;
}) {
  const [state, setState] = useState<State>({ price: null, nonstop: false, url: null, loading: false });

  useEffect(() => {
    if (!checkin || !checkout) { setState({ price: null, nonstop: false, url: null, loading: false }); return; }
    let cancelled = false;
    setState({ price: null, nonstop: false, url: null, loading: true });
    fetch(`/api/flight-price?origin=${origin}&dest=${dest}&checkin=${checkin}&checkout=${checkout}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setState({
          price: typeof d.price === "number" ? d.price : null,
          nonstop: !!d.nonstop,
          url: typeof d.url === "string" ? d.url : null,
          loading: false,
        });
      })
      .catch(() => { if (!cancelled) setState({ price: null, nonstop: false, url: null, loading: false }); });
    return () => { cancelled = true; };
  }, [origin, dest, checkin, checkout]);

  return (
    <a href={state.url || fallbackUrl} target="_blank" rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2.5 p-3.5 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50 transition-all">
      <span className="text-gray-400 flex-shrink-0"><IconPlane size={17} /></span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        <div className="text-xs text-gray-400">{sublabel}</div>
      </div>
      {state.loading ? (
        <span className="text-xs font-bold text-gray-400 flex-shrink-0">בודק מחיר…</span>
      ) : state.price ? (
        <span className="text-xs font-bold text-blue-600 flex-shrink-0">
          מ-€{Math.round(state.price)}{state.nonstop ? " · ישירה" : ""} ←
        </span>
      ) : (
        <span className="text-xs font-bold text-blue-600 flex-shrink-0">בדקו טיסות ←</span>
      )}
    </a>
  );
}
