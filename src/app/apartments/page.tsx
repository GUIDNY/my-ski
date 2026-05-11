"use client";
import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Apartment } from "@/types";
import { getEffectivePrice, calcTotalForRange } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import {
  IconMountain, IconCheck, IconStar, IconBed, IconSearch,
} from "@/components/Icons";
import SkiCalendar from "@/components/SkiCalendar";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`; };

const getCategory = (apt: Apartment) => apt.price_per_night < 600 ? "cozy" : "premium";

type Filter = "all" | "cozy" | "premium";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",     label: "הכל" },
  { key: "cozy",    label: "Cozy Trip" },
  { key: "premium", label: "Premium Trip" },
];

function ApartmentCard({ apt, checkin, checkout, guests, rules }: {
  apt: Apartment; checkin: string; checkout: string; guests: number; rules: PricingRule[];
}) {
  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : 0;
  const total = checkin && checkout && nights > 0
    ? calcTotalForRange(checkin, checkout, apt.price_per_night, rules)
    : apt.price_per_night * nights;

  const minNightlyPrice = (() => {
    if (!checkin || !checkout) return apt.price_per_night;
    const end = new Date(checkout + "T12:00:00");
    let min = Infinity;
    for (let d = new Date(checkin + "T12:00:00"); d < end; d.setDate(d.getDate() + 1))
      min = Math.min(min, getEffectivePrice(new Date(d), apt.price_per_night, rules));
    return min === Infinity ? apt.price_per_night : min;
  })();

  const cat    = getCategory(apt);
  const query  = new URLSearchParams({ checkin, checkout, guests: String(guests) }).toString();

  return (
    <a href={`/apartments/${apt.id}?${query}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">

      <div className="relative h-52 overflow-hidden flex-shrink-0">
        <img
          src={apt.images?.[0] ?? "/apt1.jpg"} alt={apt.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 55%)" }} />
        <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full text-white
          ${cat === "cozy" ? "bg-blue-600" : "bg-amber-500"}`}>
          {cat === "cozy" ? "Cozy" : "Premium"}
        </div>
        <div className="absolute bottom-3 left-3 text-white text-sm font-bold px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
          {checkin && checkout
            ? <>החל מ €{minNightlyPrice.toLocaleString()} / לילה</>
            : <>€{apt.price_per_night.toLocaleString()} / לילה</>
          }
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 text-right" dir="rtl">
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">{apt.type}</div>
            <h3 className="font-black text-gray-900 text-base truncate">{apt.name}</h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 mr-2">
            <IconStar size={13} className="text-amber-400" />
            <span className="text-sm font-bold text-gray-800">4.9</span>
          </div>
        </div>

        <div className="flex gap-3 text-xs text-gray-400 py-3 border-t border-gray-100 mb-3">
          <span className="flex items-center gap-1"><IconBed size={12} /> {apt.beds} חד׳</span>
          <span>·</span>
          <span>{apt.baths} אמב׳</span>
          <span>·</span>
          <span>{apt.sqm} מ״ר</span>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-4">
          {apt.amenities?.slice(0, 3).map((a, i) => (
            <span key={i} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
              <IconCheck size={10} className="text-green-500" /> {a}
            </span>
          ))}
        </div>

        <div className="mt-auto">
          {nights > 0 && (
            <div className="text-sm font-bold text-blue-600 mb-2">€{total.toLocaleString()} סה״כ ל-{nights} לילות</div>
          )}
          <div className="w-full py-2.5 rounded-xl bg-gray-900 group-hover:bg-blue-600 text-white font-bold text-sm text-center transition-colors">
            ← צפה בדירה
          </div>
        </div>
      </div>
    </a>
  );
}

/* ── Calendar overlay ─────────────────────────────────── */
function CalendarOverlay({ guests, onApply, onClose }: {
  guests: number;
  onApply: (ci: string, co: string, g: number) => void;
  onClose: () => void;
}) {
  const [g, setG] = useState(guests);
  const cardRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}>
      <div ref={cardRef} className="w-full max-w-2xl" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-2 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-black text-gray-900 text-lg">בחר תאריכי שהייה</h2>
              <p className="text-sm text-gray-400 mt-0.5">עונת סקי: דצמבר 2026 – מאי 2027</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-lg font-light">
              ✕
            </button>
          </div>

          <div className="p-5">
            <SkiCalendar
              onSelect={(from, to) => onApply(from, to, g)}
              onCancel={onClose}
            />

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4" dir="rtl">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">מספר אנשים</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setG(v => Math.max(1, v - 1))}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors font-bold">
                  −
                </button>
                <span className="w-8 text-center font-bold text-gray-900">{g}</span>
                <button onClick={() => setG(v => Math.min(8, v + 1))}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors font-bold">
                  +
                </button>
              </div>
              <span className="text-sm text-gray-400">{g === 1 ? "אדם אחד" : `${g} אנשים`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApartmentsPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const checkin  = params.get("checkin")  ?? "";
  const checkout = params.get("checkout") ?? "";
  const guests   = parseInt(params.get("guests") ?? "2");

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<Filter>("all");
  const [showCal,    setShowCal]    = useState(false);
  const [rulesMap,   setRulesMap]   = useState<Record<string, PricingRule[]>>({});

  const noDates = !checkin || !checkout;

  const autoOpened = useRef(false);
  useEffect(() => {
    if (noDates && !autoOpened.current) {
      autoOpened.current = true;
      setShowCal(true);
    }
  }, [noDates]);

  const applyDates = (ci: string, co: string, g: number) => {
    router.replace(`/apartments?checkin=${ci}&checkout=${co}&guests=${g}`);
    setShowCal(false);
  };

  useEffect(() => {
    fetch("/api/apartments")
      .then(r => r.json())
      .then(d => { setApartments(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (apartments.length === 0) return;
    Promise.all(
      apartments.map(apt =>
        fetch(`/api/pricing-rules?apartment_id=${apt.id}`)
          .then(r => r.json())
          .then(r => [apt.id, Array.isArray(r) ? r : []] as [string, PricingRule[]])
      )
    ).then(entries => setRulesMap(Object.fromEntries(entries)));
  }, [apartments]);

  const shown = filter === "all" ? apartments : apartments.filter(a => getCategory(a) === filter);

  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : 0;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {showCal && (
        <CalendarOverlay
          guests={guests || 2}
          onApply={applyDates}
          onClose={() => setShowCal(false)}
        />
      )}

      {/* ── Nav ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <a href="/" className="flex items-center gap-2 font-black text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <IconMountain size={16} className="text-white" />
            </div>
            MySki
          </a>
          <span className="text-gray-200">/</span>
          {checkin && checkout ? (
            <button onClick={() => setShowCal(true)}
              className="text-sm text-gray-600 flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <span>{fmtDate(checkin)} — {fmtDate(checkout)}</span>
              {nights > 0 && <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{nights} לילות</span>}
              <span className="text-xs text-gray-400 hover:text-blue-500">✏️</span>
            </button>
          ) : (
            <button onClick={() => setShowCal(true)}
              className="text-sm font-semibold text-blue-600 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors">
              📅 בחר תאריכים
            </button>
          )}
          <div className="flex-1" />
          <a href={`/search?checkin=${checkin}&checkout=${checkout}&guests=${guests}`}
            className="text-sm text-blue-600 font-semibold hover:underline whitespace-nowrap">
            → חזור לחבילות
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-blue-600 font-semibold text-sm tracking-widest uppercase mb-1">Val Thorens</p>
            <h1 className="text-3xl font-black text-gray-900">כל הדירות</h1>
            {!loading && (
              <p className="text-gray-500 mt-1 text-sm">
                {shown.length} {shown.length === 1 ? "דירה" : "דירות"} זמינות
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all
                  ${filter === f.key
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid ──────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
              <IconSearch size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">לא נמצאו דירות</p>
            <button onClick={() => setFilter("all")}
              className="mt-4 text-sm text-blue-600 font-semibold hover:underline">
              הצג את כל הדירות
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map(apt => (
              <ApartmentCard key={apt.id} apt={apt} checkin={checkin} checkout={checkout} guests={guests} rules={rulesMap[apt.id] ?? []} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApartmentsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ApartmentsPage />
    </Suspense>
  );
}
