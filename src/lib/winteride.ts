// Server-only client for the Winteride Partner API (transfer pricing + bookings).
// Never import this from a "use client" component — it holds a live API key
// that creates real, billable bookings once POST /bookings is called.

const BASE_URL = process.env.WINTERIDE_BASE_URL ?? "https://winteride.com/api/partner/v1";

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.WINTERIDE_API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function winterideFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `Winteride API error (${res.status})`);
  return data as T;
}

export type WinterideVehicleQuote = {
  class: string;
  vehicle_class_id: string;
  max_pax: number;
  max_luggage: number;
  on_request: boolean;
  price_cents: number;
  currency: string;
};

export type WinterideQuote = {
  in_season: boolean;
  flight: { flight_no: string | null; found: boolean; time: string | null };
  travel: { drive_minutes: number; km: number };
  private: WinterideVehicleQuote[];
  shared: { available: boolean; reason?: string };
  supplements: { id: string; name: string; price_cents: number }[];
};

export type QuoteParams = {
  airport_code: string;
  resort_slug: string;
  date: string; // YYYY-MM-DD
  pax: number;
  out_direction: "arrival" | "departure";
  flight_no?: string;
};

// Pricing only — does NOT create a booking or charge anything.
export function getQuote(params: QuoteParams) {
  return winterideFetch<WinterideQuote>("/quotes", { method: "POST", body: JSON.stringify(params) });
}

export type WinterideBooking = {
  ref: string;
  booking_id: string;
  paid_by: string;
  price_total_cents: number;
  status: string;
  allocation?: unknown;
};

export type CreateBookingParams = QuoteParams & {
  chosen_class: string; // vehicle_class_id from the quote the customer picked
  customer: { name: string; phone?: string; email?: string };
};

// Creates a REAL, billable, confirmed booking on the partner account. Only
// call this after a human (admin) has approved the request — never from a
// public-facing route.
export function createBooking(params: CreateBookingParams) {
  return winterideFetch<WinterideBooking>("/bookings", { method: "POST", body: JSON.stringify(params) });
}

export function cancelBooking(ref: string) {
  return winterideFetch<{ status: string }>(`/bookings/${ref}/cancel`, { method: "POST", body: JSON.stringify({}) });
}
