"use client";
import { useEffect, useState } from "react";

export type FlightPriceState = { price: number | null; nonstop: boolean; url: string | null; loading: boolean };

// Shared so the apartment page can compare the Geneva and Lyon prices
// against each other (to pick the cheaper one for the "add flight to
// package" toggle) instead of each row only knowing its own number.
export function useFlightPrice(origin: string, dest: string, checkin: string, checkout: string): FlightPriceState {
  const [state, setState] = useState<FlightPriceState>({ price: null, nonstop: false, url: null, loading: false });

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

  return state;
}
