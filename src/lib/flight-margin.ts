/*
 * Our handling margin on flight prices, in ONE place. The scraper caches the
 * RAW Google Flights price; every surface that shows a price to a customer
 * (/api/flight-price, /api/flight-return, site proposals, the quote engine
 * via the API) adds this margin exactly once.
 */
export const FLIGHT_MARGIN_EUR = 25;
export const flightSell = (p: number | null | undefined): number | null =>
  p === null || p === undefined ? null : Number(p) + FLIGHT_MARGIN_EUR;
