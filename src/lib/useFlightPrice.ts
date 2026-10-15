"use client";
import { useEffect, useState } from "react";

export type FlightPriceState = { price: number | null; nonstop: boolean; url: string | null; airline: string | null; loading: boolean };

const EMPTY: FlightPriceState = { price: null, nonstop: false, url: null, airline: null, loading: false };

// Shared so the apartment page can compare the Geneva and Lyon prices
// against each other (to pick the cheaper one for the "add flight to
// package" toggle) instead of each row only knowing its own number.
export function useFlightPrice(origin: string, dest: string, checkin: string, checkout: string): FlightPriceState {
  const [state, setState] = useState<FlightPriceState>(EMPTY);

  useEffect(() => {
    if (!checkin || !checkout) { setState(EMPTY); return; }
    let cancelled = false;
    setState({ ...EMPTY, loading: true });
    fetch(`/api/flight-price?origin=${origin}&dest=${dest}&checkin=${checkin}&checkout=${checkout}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setState({
          price: typeof d.price === "number" ? d.price : null,
          nonstop: !!d.nonstop,
          url: typeof d.url === "string" ? d.url : null,
          airline: typeof d.airline === "string" ? d.airline : null,
          loading: false,
        });
      })
      .catch(() => { if (!cancelled) setState(EMPTY); });
    return () => { cancelled = true; };
  }, [origin, dest, checkin, checkout]);

  return state;
}
