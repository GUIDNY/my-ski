"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Apartment } from "@/types";
import {
  IconMountain, IconHome, IconDiamond, IconSkis, IconBus, IconPlane,
  IconCheck, IconStar, IconCalendar, IconUser, IconSearch,
} from "@/components/Icons";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => { if (!s) return ""; const d = new Date(s); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`; };

const SKI_DAY_PRICE  = 70;
const TRANSFER_PRICE = 180;
const getCategory    = (apt: Apartment) => apt.price_per_night < 600 ? "cozy" : "premium";

type Category = "cozy" | "premium" | null;

/* ── Small stat badge ─────────────────────────────────────── */
function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className="text-gray-400">{icon}</span>
      {label}
    </div>
  );
}

/* ── Add-on toggle row ────────────────────────────────────── */
function AddonRow({ icon, label, price, checked, onChange, link }: {
  icon: React.ReactNode; label: string; price?: string;
  checked?: boolean; onChange?: (v: boolean) => void; link?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5 text-sm text-gray-700">
        <span className="text-gray-400">{icon}</span>
        {label}
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="text-xs font-semibold text-blue-600 hover:underline">חיפוש טיסה ←</a>
      ) : (
        <div className="flex items-center gap-2">
          {price && <span className="text-xs text-gray-500">{price}</span>}
          <button onClick={() => onChange?.(!checked)}
            className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${checked ? "bg-blue-600" : "bg-gray-200"}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${checked ? "right-0.5" : "left-0.5"}`} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Package card (Cozy / Premium) ───────────────────────── */
function PackageCard({
  type, apartments, nights, guests, selected, onSelect,
}: {
  type: Category; apartments: Apartment[]; nights: number; guests: number;
  selected: boolean; onSelect: () => void;
}) {
  const [skiPass,  setSkiPass]  = useState(false);
  const [transfer, setTransfer] = useState(false);

  if (!type) return null;
  const isCozy    = type === "cozy";
  const label     = isCozy ? "Cozy Trip" : "Premium Trip";
  const minPrice  = apartments.length ? Math.min(...apartments.map(a => a.price_per_night)) : 0;
  const baseTotal = minPrice * nights;
  const skiTotal  = skiPass ? SKI_DAY_PRICE * nights * guests : 0;
  const trTotal   = transfer ? TRANSFER_PRICE : 0;
  const grandTotal = baseTotal + skiTotal + trTotal;

  const flightUrl = `https://www.skyscanner.co.il/flights/tlv/lys/${new Date().getFullYear() + 1}12/`;

  return (
    <div
      onClick={onSelect}
      className={`relative flex-1 rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden
        ${selected ? (isCozy ? "border-blue-500 shadow-lg shadow-blue-100" : "border-amber-400 shadow-lg shadow-amber-50") : "border-gray-100 hover:border-gray-200 hover:shadow-md"}
      `}
    >
      {/* Header strip */}
      <div className={`px-6 pt-6 pb-4 ${isCozy ? "bg-gradient-to-br from-slate-50 to-blue-50" : "bg-gradient-to-br from-amber-50 to-orange-50"}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isCozy ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}>
          {isCozy ? <IconHome size={20} /> : <IconDiamond size={20} />}
        </div>
        <div className={`text-xs font-bold tracking-widest uppercase mb-1 ${isCozy ? "text-blue-600" : "text-amber-600"}`}>
          {label}
        </div>
        <div className="text-3xl font-black text-gray-900">
          מ-€{minPrice.toLocaleString()}
          <span className="text-base font-medium text-gray-400"> / לילה</span>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {apartments.length} {apartments.length === 1 ? "דירה זמינה" : "דירות זמינות"}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-6 bg-white">
        {/* Add-ons */}
        <div className="mt-4 mb-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">הוסף לחבילה</div>
          <AddonRow
            icon={<IconSkis size={16} />}
            label="סקי פס · Trois Vallées"
            price={`+€${SKI_DAY_PRICE}/יום`}
            checked={skiPass} onChange={setSkiPass}
          />
          <AddonRow
            icon={<IconBus size={16} />}
            label="הסעה הלוך-חזור"
            price={`+€${TRANSFER_PRICE}`}
            checked={transfer} onChange={setTransfer}
          />
          <AddonRow
            icon={<IconPlane size={16} />}
            label="טיסה ל-Lyon / Geneva"
            link={flightUrl}
          />
        </div>

        {/* Price estimate */}
        <div className={`rounded-xl p-4 ${isCozy ? "bg-blue-50" : "bg-amber-50"}`}>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-gray-500">דירה ({nights} לילות)</span>
            <span className="font-semibold text-gray-700">מ-€{baseTotal.toLocaleString()}</span>
          </div>
          {skiPass && (
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-500">סקי פס × {guests}</span>
              <span className="font-semibold text-gray-700">€{skiTotal.toLocaleString()}</span>
            </div>
          )}
          {transfer && (
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-500">הסעה</span>
              <span className="font-semibold text-gray-700">€{TRANSFER_PRICE}</span>
            </div>
          )}
          <div className={`flex justify-between items-center border-t pt-2 mt-2 ${isCozy ? "border-blue-100" : "border-amber-100"}`}>
            <span className="text-sm font-bold text-gray-700">סה״כ מוערך</span>
            <span className="text-lg font-black text-gray-900">מ-€{grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className={`mt-4 w-full py-3.5 rounded-xl font-bold text-sm transition-all
            ${selected
              ? (isCozy ? "bg-blue-600 text-white shadow-sm" : "bg-amber-500 text-white shadow-sm")
              : "bg-gray-900 text-white hover:bg-gray-700"
            }`}
        >
          {selected ? "נבחר ✓" : `בחר ${label}`}
        </button>
      </div>
    </div>
  );
}

/* ── Apartment result card ────────────────────────────────── */
function AptCard({ apt, nights, guests, checkin, checkout }: {
  apt: Apartment; nights: number; guests: number; checkin: string; checkout: string;
}) {
  const total  = apt.price_per_night * nights;
  const cat    = getCategory(apt);
  const params = new URLSearchParams({ checkin, checkout, guests: String(guests) });

  return (
    <a href={`/apartments/${apt.id}?${params}`}
      className="group flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden">

      {/* Image */}
      <div className="relative sm:w-64 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
        <img src={apt.images?.[0] ?? "/apt1.jpg"} alt={apt.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
        <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full text-white
          ${cat === "cozy" ? "bg-blue-600" : "bg-amber-500"}`}>
          {cat === "cozy" ? "Cozy" : "Premium"}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4 text-right" dir="rtl">
        <div className="flex-1">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{apt.type}</div>
          <h3 className="text-lg font-black text-gray-900 mb-0.5">{apt.name}</h3>
          <p className="text-sm text-gray-400 mb-3">Val Thorens, France</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {apt.amenities?.slice(0, 4).map((a, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full">
                <IconCheck size={11} className="text-green-500" /> {a}
              </span>
            ))}
          </div>
          <div className="flex gap-3 text-xs text-gray-400">
            <Stat icon={<IconBed size={12} />} label={`${apt.beds} חד׳`} />
            <span>·</span>
            <Stat icon={null} label={`${apt.baths} אמב׳`} />
            <span>·</span>
            <span>{apt.sqm} מ״ר</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:min-w-[140px] border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-5">
          <div className="text-right sm:text-left">
            <div className="text-xl font-black text-gray-900">€{apt.price_per_night.toLocaleString()}</div>
            <div className="text-xs text-gray-400">ללילה</div>
            {nights > 0 && <div className="text-sm font-bold text-blue-600 mt-1">€{total.toLocaleString()} סה״כ</div>}
          </div>
          <div className="bg-gray-900 group-hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap">
            ← בחר
          </div>
        </div>
      </div>
    </a>
  );
}

/* ── Main page ────────────────────────────────────────────── */
function SearchPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const checkin  = params.get("checkin")  ?? "";
  const checkout = params.get("checkout") ?? "";
  const guests   = parseInt(params.get("guests") ?? "2");

  const [apartments,   setApartments]   = useState<Apartment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedCat,  setSelectedCat]  = useState<Category>(null);

  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : 0;

  useEffect(() => {
    fetch("/api/apartments").then(r => r.json())
      .then(d => { setApartments(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const cozy    = apartments.filter(a => getCategory(a) === "cozy");
  const premium = apartments.filter(a => getCategory(a) === "premium");
  const shown   = selectedCat ? apartments.filter(a => getCategory(a) === selectedCat) : [];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── Sticky header ─────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <a href="/" className="flex items-center gap-2 font-black text-gray-900 text-base">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <IconMountain size={16} className="text-white" />
            </div>
            MySki
          </a>
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 border border-gray-100 min-w-0 flex-wrap">
            <span className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
              <IconMountain size={14} className="text-blue-500" /> Val Thorens
            </span>
            <span className="text-gray-300 text-xs">|</span>
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <IconCalendar size={13} />
              {checkin && checkout ? `${fmtDate(checkin)} — ${fmtDate(checkout)}` : "בחר תאריכים"}
            </span>
            <span className="text-gray-300 text-xs">|</span>
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <IconUser size={13} /> {guests} אנשים
            </span>
            {nights > 0 && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mr-1">
                {nights} לילות
              </span>
            )}
          </div>
          <button onClick={() => router.push("/")}
            className="text-sm text-blue-600 font-semibold hover:underline whitespace-nowrap">שנה חיפוש</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Hero title ────────────────────────────────────── */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-2">בחר את חבילת הסקי שלך</h1>
          <p className="text-gray-500">
            {nights > 0 ? `${nights} לילות · ` : ""}Val Thorens · {guests} {guests === 1 ? "אדם" : "אנשים"}
          </p>
        </div>

        {/* ── Package cards ──────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {[1,2].map(i => <div key={i} className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <PackageCard type="cozy" apartments={cozy} nights={nights} guests={guests}
              selected={selectedCat === "cozy"} onSelect={() => setSelectedCat(c => c === "cozy" ? null : "cozy")} />
            <PackageCard type="premium" apartments={premium} nights={nights} guests={guests}
              selected={selectedCat === "premium"} onSelect={() => setSelectedCat(c => c === "premium" ? null : "premium")} />
          </div>
        )}

        {/* ── Divider + all apartments link ──────────────────── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-200" />
          <a href={`/apartments?checkin=${checkin}&checkout=${checkout}&guests=${guests}`}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium whitespace-nowrap">
            <IconSearch size={15} />
            צפה בכל הדירות
          </a>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* ── Filtered apartment list ─────────────────────────── */}
        {selectedCat && (
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-4">
              {selectedCat === "cozy" ? "Cozy Trip" : "Premium Trip"} · {shown.length} דירות
            </h2>
            <div className="flex flex-col gap-4">
              {shown.map(apt => (
                <AptCard key={apt.id} apt={apt} nights={nights} guests={guests}
                  checkin={checkin} checkout={checkout} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IconBed({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16M2 8h20v12H2M2 8a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5"/><path d="M2 13h20"/>
    </svg>
  );
}

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchPage />
    </Suspense>
  );
}
