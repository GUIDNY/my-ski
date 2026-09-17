"use client";
import { useEffect, useState } from "react";

type State = { price: number | null; nonstop: boolean; loading: boolean };

// Self-contained so it can be dropped into both the mobile and desktop
// layout copies of the add-ons panel without threading state through the
// whole page — the server route caches by (origin, dest, checkin, checkout)
// for a few hours, so two instances querying the same dates cost one real
// scrape, not two.
export default function FlightPriceBadge({ origin, dest, checkin, checkout }: {
  origin: string; dest: string; checkin: string; checkout: string;
}) {
  const [state, setState] = useState<State>({ price: null, nonstop: false, loading: false });

  useEffect(() => {
    if (!checkin || !checkout) { setState({ price: null, nonstop: false, loading: false }); return; }
    let cancelled = false;
    setState({ price: null, nonstop: false, loading: true });
    fetch(`/api/flight-price?origin=${origin}&dest=${dest}&checkin=${checkin}&checkout=${checkout}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setState({ price: typeof d.price === "number" ? d.price : null, nonstop: !!d.nonstop, loading: false }); })
      .catch(() => { if (!cancelled) setState({ price: null, nonstop: false, loading: false }); });
    return () => { cancelled = true; };
  }, [origin, dest, checkin, checkout]);

  if (state.loading) return <span className="text-xs font-bold text-gray-400 flex-shrink-0">בודק מחיר…</span>;
  if (state.price) {
    return (
      <span className="text-xs font-bold text-blue-600 flex-shrink-0">
        מ-€{Math.round(state.price)}{state.nonstop ? " · ישירה" : ""} ←
      </span>
    );
  }
  return <span className="text-xs font-bold text-blue-600 flex-shrink-0">בדקו טיסות ←</span>;
}
