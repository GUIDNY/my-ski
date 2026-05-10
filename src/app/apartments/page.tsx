"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Apartment } from "@/types";
import {
  IconMountain, IconCheck, IconStar, IconBed, IconSearch, IconCalendar,
} from "@/components/Icons";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => { if (!s) return ""; const d = new Date(s); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`; };

const getCategory = (apt: Apartment) => apt.price_per_night < 600 ? "cozy" : "premium";

type Filter = "all" | "cozy" | "premium";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",     label: "הכל" },
  { key: "cozy",    label: "Cozy Trip" },
  { key: "premium", label: "Premium Trip" },
];

function ApartmentCard({ apt, checkin, checkout, guests }: {
  apt: Apartment; checkin: string; checkout: string; guests: number;
}) {
  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : 0;
  const total  = apt.price_per_night * nights;
  const cat    = getCategory(apt);
  const query  = new URLSearchParams({ checkin, checkout, guests: String(guests) }).toString();

  return (
    <a href={`/apartments/${apt.id}?${query}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">

      {/* Image */}
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
          €{apt.price_per_night.toLocaleString()} / לילה
        </div>
      </div>

      {/* Info */}
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

        {/* Stats row */}
        <div className="flex gap-3 text-xs text-gray-400 py-3 border-t border-gray-100 mb-3">
          <span className="flex items-center gap-1"><IconBed size={12} /> {apt.beds} חד׳</span>
          <span>·</span>
          <span>{apt.baths} אמב׳</span>
          <span>·</span>
          <span>{apt.sqm} מ״ר</span>
        </div>

        {/* Amenities */}
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

/* ── Date picker banner ──────────────────────────────────── */
function DateBanner({ onSet }: { onSet: (checkin: string, checkout: string, guests: number) => void }) {
  const [ci, setCi]   = useState("");
  const [co, setCo]   = useState("");
  const [g,  setG]    = useState(2);

  const apply = () => { if (ci && co) onSet(ci, co, g); };

  return (
    <div className="bg-blue-600 text-white px-4 py-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm font-bold mb-3 flex items-center gap-2">
          <span>📅</span> בחר תאריכים לראות מחירים נכונים ותאימות
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-blue-200 font-bold">צ׳ק-אין</label>
            <input type="date" value={ci} onChange={e=>setCi(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:bg-white/30" dir="ltr" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-blue-200 font-bold">צ׳ק-אאוט</label>
            <input type="date" value={co} onChange={e=>setCo(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:bg-white/30" dir="ltr" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-blue-200 font-bold">אנשים</label>
            <select value={g} onChange={e=>setG(+e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n} className="text-gray-900">{n}</option>)}
            </select>
          </div>
          <button onClick={apply} disabled={!ci || !co}
            className="bg-white text-blue-700 font-black px-5 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors disabled:opacity-50">
            עדכן ←
          </button>
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

  const noDates = !checkin || !checkout;

  const applyDates = (ci: string, co: string, g: number) => {
    router.replace(`/apartments?checkin=${ci}&checkout=${co}&guests=${g}`);
  };

  useEffect(() => {
    fetch("/api/apartments")
      .then(r => r.json())
      .then(d => { setApartments(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const shown = filter === "all" ? apartments : apartments.filter(a => getCategory(a) === filter);

  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : 0;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── Date banner ──────────────────────────────────────── */}
      {noDates && <DateBanner onSet={applyDates} />}

      {/* ── Nav ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <a href="/" className="flex items-center gap-2 font-black text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <IconMountain size={16} className="text-white" />
            </div>
            MySki
          </a>
          {checkin && checkout && (
            <>
              <span className="text-gray-200">/</span>
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <span>{fmtDate(checkin)} — {fmtDate(checkout)}</span>
                {nights > 0 && <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{nights} לילות</span>}
              </span>
            </>
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

          {/* Filter pills */}
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
              <ApartmentCard key={apt.id} apt={apt} checkin={checkin} checkout={checkout} guests={guests} />
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
