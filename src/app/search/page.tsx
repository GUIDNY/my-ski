"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Apartment } from "@/types";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;
};

type SortKey = "popular" | "price_asc" | "price_desc" | "rating";

function ApartmentCard({ apt, nights, guests, checkin, checkout }: {
  apt: Apartment & { rating?: number; reviews?: number; tag?: string; tagColor?: string };
  nights: number; guests: number; checkin: string; checkout: string;
}) {
  const total = apt.price_per_night * nights;
  const params = new URLSearchParams({ apartment: apt.id, checkin, checkout, guests: String(guests) });

  return (
    <a href={`/book?${params}`}
      className="group flex flex-col md:flex-row bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden">

      {/* Image */}
      <div className="relative md:w-72 h-52 md:h-auto flex-shrink-0 overflow-hidden">
        <img src={apt.images?.[0] ?? "/apt1.jpg"} alt={apt.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {apt.tag && (
          <div className="absolute top-3 right-3 text-white text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: apt.tagColor ?? "#2563eb" }}>
            {apt.tag}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-5 md:p-6 flex flex-col md:flex-row gap-4 text-right" dir="rtl">
        <div className="flex-1">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">{apt.type}</div>
          <h3 className="text-xl font-black text-gray-900 mb-1">{apt.name}</h3>
          <div className="text-sm text-gray-500 mb-3">Val Thorens, France</div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-4">
            {apt.amenities?.slice(0, 4).map((a, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                ✓ {a}
              </span>
            ))}
          </div>

          {/* Details */}
          <div className="flex gap-4 text-sm text-gray-500">
            <span>🛏 {apt.beds} חדרים</span>
            <span>🚿 {apt.baths} אמבטיות</span>
            <span>📐 {apt.sqm} מ״ר</span>
          </div>

          {apt.rating && (
            <div className="flex items-center gap-1.5 mt-3">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="12" height="12" viewBox="0 0 24 24"
                    fill={i <= Math.round(apt.rating!) ? "#f59e0b" : "#e5e7eb"}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <span className="text-xs font-bold text-gray-700">{apt.rating}</span>
              {apt.reviews && <span className="text-xs text-gray-400">({apt.reviews} ביקורות)</span>}
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:min-w-[160px] border-t md:border-t-0 md:border-r border-gray-100 pt-4 md:pt-0 md:pr-6">
          <div className="text-right">
            <div className="text-2xl font-black text-gray-900">€{apt.price_per_night.toLocaleString()}</div>
            <div className="text-xs text-gray-400">ללילה</div>
            {nights > 0 && (
              <div className="text-sm font-bold text-blue-600 mt-1">€{total.toLocaleString()} סה״כ</div>
            )}
            {nights > 0 && (
              <div className="text-xs text-gray-400">{nights} לילות · {guests} אנשים</div>
            )}
          </div>
          <div className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap">
            בחר דירה →
          </div>
        </div>
      </div>
    </a>
  );
}

function SearchPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const checkin  = params.get("checkin")  ?? "";
  const checkout = params.get("checkout") ?? "";
  const guests   = parseInt(params.get("guests") ?? "2");

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [sort,       setSort]       = useState<SortKey>("popular");

  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000)
    : 0;

  useEffect(() => {
    fetch("/api/apartments")
      .then(r => r.json())
      .then(d => { setApartments(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const sorted = [...apartments].sort((a, b) => {
    if (sort === "price_asc")  return a.price_per_night - b.price_per_night;
    if (sort === "price_desc") return b.price_per_night - a.price_per_night;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── Sticky search bar ───────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <a href="/" className="flex items-center gap-1.5 font-black text-gray-900 text-lg ml-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm">⛷</div>
            MySki
          </a>
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
            <span className="text-sm font-bold text-gray-700">Val Thorens</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-600">
              {checkin && checkout ? `${fmtDate(checkin)} — ${fmtDate(checkout)}` : "בחר תאריכים"}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-600">{guests} אנשים</span>
            {nights > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{nights} לילות</span>
              </>
            )}
          </div>
          <button onClick={() => router.push("/")}
            className="text-sm text-blue-600 font-semibold hover:underline">שנה חיפוש</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">בחר את הדירה שלך</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {loading ? "טוען..." : `${sorted.length} דירות זמינות · Val Thorens`}
            </p>
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            {([
              { key: "popular",    label: "הכי פופולרי" },
              { key: "price_asc",  label: "מחיר נמוך" },
              { key: "price_desc", label: "מחיר גבוה" },
            ] as const).map(s => (
              <button key={s.key} onClick={() => setSort(s.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  sort === s.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results ─────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-52 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🏔️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">אין דירות זמינות</h2>
            <p className="text-gray-500">נסה לשנות את התאריכים או מספר האנשים</p>
            <a href="/" className="mt-6 inline-block bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
              חזור לחיפוש
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sorted.map(apt => (
              <ApartmentCard key={apt.id} apt={apt}
                nights={nights} guests={guests} checkin={checkin} checkout={checkout} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">מחפש דירות...</p>
        </div>
      </div>
    }>
      <SearchPage />
    </Suspense>
  );
}
