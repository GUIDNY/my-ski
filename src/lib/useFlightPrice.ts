"use client";
import { useEffect, useState } from "react";
import { AIRPORT_CITY, type DirectFlight, type ReturnLeg } from "@/lib/flight-format";
export { AIRPORT_CITY, time24, type DirectFlight, type ReturnLeg, type FlightAirport } from "@/lib/flight-format";

export type FlightPriceState = {
  price: number | null;
  nonstop: boolean;
  url: string | null;
  airline: string | null;
  /** the outbound flight, as Google Flights shows it ("6:15 AM", "1:05 AM+1") */
  departTime: string | null;
  arriveTime: string | null;
  loading: boolean;
  /** the check itself failed (not "no flight found") */
  failed: boolean;
};

const EMPTY: FlightPriceState = { price: null, nonstop: false, url: null, airline: null, departTime: null, arriveTime: null, loading: false, failed: false };
const str = (v: unknown) => (typeof v === "string" && v ? v : null);

/**
 * The cheapest round trip from Google Flights for the dates: the cheapest
 * nonstop one when there is one (then `nonstop` is true), else the cheapest
 * with stops. See /api/flight-price.
 */
export function useFlightPrice(origin: string, dest: string, checkin: string, checkout: string): FlightPriceState {
  const key = checkin && checkout ? `${origin}|${dest}|${checkin}|${checkout}` : "";
  const [result, setResult] = useState<{ key: string; state: FlightPriceState }>({ key: "", state: EMPTY });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/flight-price?origin=${origin}&dest=${dest}&checkin=${checkin}&checkout=${checkout}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setResult({ key, state: {
          price: typeof d.price === "number" ? d.price : null,
          nonstop: !!d.nonstop,
          url: str(d.url),
          airline: str(d.airline),
          departTime: str(d.departTime),
          arriveTime: str(d.arriveTime),
          loading: false,
          failed: typeof d.price !== "number" && !!d.error,
        } });
      })
      .catch(() => { if (!cancelled) setResult({ key, state: { ...EMPTY, failed: true } }); });
    return () => { cancelled = true; };
  }, [key, origin, dest, checkin, checkout]);

  if (!key) return EMPTY;
  return result.key === key ? result.state : { ...EMPTY, loading: true };
}

export type DirectFlightState = {
  /** idle: no dates · loading · found · none: no direct flight on these dates · error: could not check */
  status: "idle" | "loading" | "found" | "none" | "error";
  flight: DirectFlight | null;
};

/**
 * A flight is only ever offered when it is direct both ways, at its real
 * price. Waits for both airports before choosing, so the offer doesn't jump
 * from Geneva to Lyon after someone already picked it.
 */
export function useDirectFlight(checkin: string, checkout: string): DirectFlightState {
  const gva = useFlightPrice("TLV", "GVA", checkin, checkout);
  const lys = useFlightPrice("TLV", "LYS", checkin, checkout);
  if (!checkin || !checkout) return { status: "idle", flight: null };
  if (gva.loading || lys.loading) return { status: "loading", flight: null };

  const options = ([["GVA", gva], ["LYS", lys]] as const)
    .filter(([, s]) => s.nonstop && s.price !== null)
    .map(([airport, s]): DirectFlight => ({
      airport, city: AIRPORT_CITY[airport], price: s.price as number,
      airline: s.airline, url: s.url, departTime: s.departTime, arriveTime: s.arriveTime,
    }))
    .sort((a, b) => a.price - b.price);
  if (options.length) return { status: "found", flight: options[0] };
  return { status: gva.failed || lys.failed ? "error" : "none", flight: null };
}

/**
 * The return flight behind a direct round trip (its times), read on demand:
 * it takes a while, so only once someone actually adds the flight.
 */
export function useReturnLeg(flight: DirectFlight | null, checkin: string, checkout: string, enabled: boolean): { leg: ReturnLeg | null; loading: boolean } {
  const airport = flight?.airport ?? "";
  const key = enabled && airport && checkin && checkout ? `${airport}|${checkin}|${checkout}` : "";
  const [result, setResult] = useState<{ key: string; leg: ReturnLeg | null }>({ key: "", leg: null });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/flight-return?origin=TLV&dest=${airport}&checkin=${checkin}&checkout=${checkout}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        const r = d && d.ok && d.return ? d.return : null;
        setResult({ key, leg: r ? { departTime: str(r.departTime), arriveTime: str(r.arriveTime), airline: str(r.airline) } : null });
      })
      .catch(() => { if (!cancelled) setResult({ key, leg: null }); });
    return () => { cancelled = true; };
  }, [key, airport, checkin, checkout]);

  if (!key) return { leg: null, loading: false };
  return result.key === key ? { leg: result.leg, loading: false } : { leg: null, loading: true };
}
