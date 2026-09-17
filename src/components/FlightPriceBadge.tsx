import { IconPlane } from "@/components/Icons";
import type { FlightPriceState } from "@/lib/useFlightPrice";

// Presentational only — the parent fetches via useFlightPrice() (shared so
// it can compare Geneva vs Lyon prices for the "add cheaper flight" toggle
// instead of each row knowing only its own number) and passes the result
// down. The href is whatever the scraper actually used (state.url) so the
// page a customer lands on always matches the price shown; fallbackUrl only
// covers the brief loading window / a failed scrape.
export default function FlightPriceBadge({ state, label, sublabel, fallbackUrl }: {
  state: FlightPriceState; label: string; sublabel: string; fallbackUrl: string;
}) {
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
