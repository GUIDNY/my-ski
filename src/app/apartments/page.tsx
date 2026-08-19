"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Apartment } from "@/types";
import { getEffectivePrice, calcTotalForRange } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import {
  IconMountain, IconCheck, IconStar, IconBed, IconSearch,
} from "@/components/Icons";
import SkiCalendar from "@/components/SkiCalendar";
import Logo from "@/components/Logo";

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
      className="card-luxury group overflow-hidden flex flex-col">

      <div className="relative h-52 overflow-hidden flex-shrink-0">
        <img
          src={apt.images?.[0] ?? "/apt1.jpg"} alt={apt.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,15,20,0.45) 0%, transparent 55%)" }} />
        <div className="absolute top-4 right-4 text-[11px] font-bold px-3 py-1 tracking-wide"
          style={{ background: "rgba(11,15,20,0.7)", color: "var(--gold-light)", backdropFilter: "blur(6px)" }}>
          {cat === "cozy" ? "Cozy" : "Premium"}
        </div>
        <div className="absolute bottom-4 left-4 text-sm font-bold px-3 py-1.5"
          style={{ background: "rgba(11,15,20,0.7)", color: "var(--ivory)", backdropFilter: "blur(6px)" }}>
          {checkin && checkout
            ? <>החל מ <span className="text-[var(--gold-light)]">€{minNightlyPrice.toLocaleString()}</span> / לילה</>
            : <><span className="text-[var(--gold-light)]">€{apt.price_per_night.toLocaleString()}</span> / לילה</>
          }
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1 text-right" dir="rtl">
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider mb-0.5 text-[var(--stone-soft)]">{apt.type}</div>
            <h3 className="font-display font-medium text-xl truncate text-[var(--charcoal)]">{apt.name}</h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 mr-2">
            <IconStar size={13} className="text-[var(--gold)]" />
            <span className="text-sm font-bold text-[var(--gold-deep)]">4.9</span>
          </div>
        </div>

        <div className="flex gap-3 text-xs py-3 mb-4" style={{ color: "var(--stone-soft)", borderTop: "1px solid rgba(28,27,23,0.08)" }}>
          <span className="flex items-center gap-1"><IconBed size={12} /> {apt.beds} חד׳</span>
          <span>·</span>
          <span>{apt.baths} אמב׳</span>
          <span>·</span>
          <span>{apt.sqm} מ״ר</span>
        </div>

        <div className="flex gap-1.5 flex-wrap mb-5">
          {apt.amenities?.slice(0, 3).map((a, i) => (
            <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--ivory-deep)", color: "var(--stone)" }}>
              <IconCheck size={10} className="text-[var(--gold-deep)]" /> {a}
            </span>
          ))}
        </div>

        <div className="mt-auto">
          {nights > 0 && (
            <div className="text-sm font-bold mb-3 text-[var(--gold-deep)]">€{total.toLocaleString()} סה״כ ל-{nights} לילות</div>
          )}
          <div className="btn-dark w-full py-3 text-sm">
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
      style={{ background: "rgba(11,15,20,0.6)", backdropFilter: "blur(3px)" }}>
      <div ref={cardRef} className="w-full max-w-2xl" dir="rtl">
        <div style={{ background: "var(--paper)", borderRadius: 4 }} className="overflow-hidden shadow-2xl">
          <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(28,27,23,0.08)" }}>
            <div>
              <h2 className="font-display font-medium text-lg text-[var(--charcoal)]">בחר תאריכי שהייה</h2>
              <p className="text-sm mt-0.5 text-[var(--stone-soft)]">עונת סקי: דצמבר 2026 – מאי 2027</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-lg font-light text-[var(--stone-soft)]">
              ✕
            </button>
          </div>

          <div className="p-5">
            <SkiCalendar
              onSelect={(from, to) => onApply(from, to, g)}
              onCancel={onClose}
            />

            <div className="mt-4 pt-4 flex items-center gap-4" style={{ borderTop: "1px solid rgba(28,27,23,0.08)" }} dir="rtl">
              <label className="text-sm font-semibold whitespace-nowrap text-[var(--charcoal)]">מספר אנשים</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setG(v => Math.max(1, v - 1))}
                  className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors font-bold"
                  style={{ borderColor: "var(--gold-line)", color: "var(--charcoal)" }}>
                  −
                </button>
                <span className="w-8 text-center font-bold text-[var(--charcoal)]">{g}</span>
                <button onClick={() => setG(v => Math.min(8, v + 1))}
                  className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors font-bold"
                  style={{ borderColor: "var(--gold-line)", color: "var(--charcoal)" }}>
                  +
                </button>
              </div>
              <span className="text-sm text-[var(--stone-soft)]">{g === 1 ? "אדם אחד" : `${g} אנשים`}</span>
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
  const [blocked,    setBlocked]    = useState<string[]>([]);

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

  useEffect(() => {
    if (!checkin || !checkout) { setBlocked([]); return; }
    fetch(`/api/availability/blocked?checkin=${checkin}&checkout=${checkout}`)
      .then(r => r.json())
      .then(d => setBlocked(Array.isArray(d.blocked) ? d.blocked : []))
      .catch(() => setBlocked([]));
  }, [checkin, checkout]);

  const available = apartments.filter(a => !blocked.includes(a.id));
  const shown = filter === "all" ? available : available.filter(a => getCategory(a) === filter);

  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--ivory)" }} dir="rtl">

      {showCal && (
        <CalendarOverlay
          guests={guests || 2}
          onApply={applyDates}
          onClose={() => setShowCal(false)}
        />
      )}

      {/* ── Nav ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40" style={{ background: "rgba(250,247,241,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(28,27,23,0.08)" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <a href="/" className="flex items-center"><Logo className="h-9" /></a>
          <span className="text-[var(--stone-soft)]">/</span>
          {checkin && checkout ? (
            <button onClick={() => setShowCal(true)}
              className="text-sm flex items-center gap-1.5 transition-colors text-[var(--stone)]">
              <span>{fmtDate(checkin)} — {fmtDate(checkout)}</span>
              {nights > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: "var(--gold-deep)", background: "var(--gold-wash)" }}>{nights} לילות</span>}
              <span className="text-xs text-[var(--stone-soft)]">✏️</span>
            </button>
          ) : (
            <button onClick={() => setShowCal(true)}
              className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors"
              style={{ color: "var(--gold-deep)", background: "var(--gold-wash)" }}>
              📅 בחר תאריכים
            </button>
          )}
          <div className="flex-1" />
          <a href={`/search?checkin=${checkin}&checkout=${checkout}&guests=${guests}`}
            className="text-sm font-semibold hover:underline whitespace-nowrap text-[var(--gold-deep)]">
            → חזור לחבילות
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-14 md:py-16">

        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="eyebrow">Val Thorens</span>
            <h1 className="font-display text-3xl md:text-4xl font-medium mt-3 text-[var(--charcoal)]">כל הדירות</h1>
            {!loading && (
              <p className="mt-2 text-sm text-[var(--stone)]">
                {shown.length} {shown.length === 1 ? "דירה" : "דירות"} זמינות
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="px-4 py-2 text-sm font-semibold transition-all"
                style={filter === f.key
                  ? { background: "var(--ink)", color: "var(--ivory)", borderRadius: 4 }
                  : { background: "var(--paper)", color: "var(--stone)", border: "1px solid rgba(28,27,23,0.12)", borderRadius: 4 }
                }>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid ──────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-80 animate-pulse" style={{ background: "var(--paper)", border: "1px solid rgba(28,27,23,0.08)", borderRadius: 4 }} />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4" style={{ background: "var(--ivory-deep)", borderRadius: 4 }}>
              <IconSearch size={24} className="text-[var(--stone-soft)]" />
            </div>
            <p className="text-lg font-medium text-[var(--stone)]">לא נמצאו דירות</p>
            <button onClick={() => setFilter("all")}
              className="mt-4 text-sm font-semibold hover:underline text-[var(--gold-deep)]">
              הצג את כל הדירות
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ink)" }}>
        <SkiLoader />
      </div>
    }>
      <ApartmentsPage />
    </Suspense>
  );
}
