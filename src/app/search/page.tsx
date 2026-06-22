"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Apartment } from "@/types";
import {
  IconMountain, IconHome, IconDiamond, IconCheck, IconStar,
  IconCalendar, IconUser, IconSearch, IconBed,
} from "@/components/Icons";
import Logo from "@/components/Logo";
import SkiCalendar from "@/components/SkiCalendar";
import { getEffectivePrice, calcTotalForRange } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`; };

const getCategory = (apt: Apartment) => apt.price_per_night < 600 ? "cozy" : "premium";
const capacity = (apt: Apartment) => apt.max_guests || apt.beds * 2 || 2;

type Filter = "all" | "cozy" | "premium";
type RulesMap = Record<string, PricingRule[]>;

/* ── Apartment card ───────────────────────────────────────── */
function AptCard({ apt, nights, checkin, checkout, guests, rules }: {
  apt: Apartment; nights: number; checkin: string; checkout: string; guests: number;
  rules: PricingRule[];
}) {
  const total = checkin && checkout && nights > 0
    ? calcTotalForRange(checkin, checkout, apt.price_per_night, rules)
    : apt.price_per_night * nights;

  // Minimum single-night price in the selected period
  const minNightly = (() => {
    if (!checkin || !checkout || nights === 0) return apt.price_per_night;
    const end = new Date(checkout + "T12:00:00");
    let min = Infinity;
    for (let d = new Date(checkin + "T12:00:00"); d < end; d.setDate(d.getDate() + 1))
      min = Math.min(min, getEffectivePrice(new Date(d), apt.price_per_night, rules));
    return min === Infinity ? apt.price_per_night : min;
  })();
  const cat   = getCategory(apt);
  const query = new URLSearchParams({ checkin, checkout, guests: String(guests) }).toString();

  return (
    <a href={`/apartments/${apt.id}?${query}`}
      className="group flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden">

      {/* Image */}
      <div className="relative sm:w-56 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
        <img src={apt.images?.[0] ?? "/hero-ski.jpg"} alt={apt.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 50%)" }} />
        <div className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full text-white
          ${cat === "cozy" ? "bg-blue-600" : "bg-amber-500"}`}>
          {cat === "cozy" ? "Cozy" : "Premium"}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4 text-right" dir="rtl">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">{apt.type}</div>
          <h3 className="text-lg font-black text-gray-900 mb-1">{apt.name}</h3>
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <IconMountain size={12} className="text-blue-400" />
            Val Thorens, Trois Vallées
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {apt.amenities?.slice(0, 4).map((a, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full">
                <IconCheck size={10} className="text-green-500" /> {a}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><IconBed size={12} /> {apt.beds} חד׳</span>
            <span>·</span>
            <span>{apt.baths} אמב׳</span>
            <span>·</span>
            <span>{apt.sqm} מ״ר</span>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:min-w-[130px] border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0">
          <div className="text-right">
            {checkin && checkout && nights > 0 && (
              <div className="text-xs text-gray-400 font-semibold mb-0.5">החל מ</div>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900">€{minNightly.toLocaleString()}</span>
              <span className="text-xs text-gray-400">/ לילה</span>
            </div>
            {minNightly !== apt.price_per_night && (
              <div className="text-xs text-gray-400 line-through">€{apt.price_per_night}</div>
            )}
            {nights > 0 && (
              <div className="text-sm font-bold text-blue-600 mt-0.5">€{total.toLocaleString()} סה״כ</div>
            )}
            <div className="flex items-center gap-1 mt-1 justify-end">
              <IconStar size={12} className="text-amber-400" />
              <span className="text-xs font-bold text-gray-700">4.9</span>
            </div>
          </div>
          <div className="bg-gray-900 group-hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap">
            ← בחר
          </div>
        </div>
      </div>
    </a>
  );
}

/* ── Combo card (two apartments together) ─────────────────── */
function ComboCard({ a, b, total, cap, checkin, checkout, guests, nights }: {
  a: Apartment; b: Apartment; total: number; cap: number;
  checkin: string; checkout: string; guests: number; nights: number;
}) {
  const query = new URLSearchParams({ a: a.id, b: b.id, checkin, checkout, guests: String(guests) }).toString();
  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden" dir="rtl">
      <div className="flex flex-col sm:flex-row">
        {/* two thumbnails */}
        <div className="relative sm:w-56 h-40 sm:h-auto flex-shrink-0 flex">
          <img src={a.images?.[0] ?? "/hero-ski.jpg"} alt={a.name} className="w-1/2 h-full object-cover" />
          <img src={b.images?.[0] ?? "/hero-ski.jpg"} alt={b.name} className="w-1/2 h-full object-cover" />
          <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">חבילה משולבת</span>
        </div>
        <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-gray-900 mb-1">{a.name} + {b.name}</h3>
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1"><IconMountain size={12} className="text-blue-400" /> Val Thorens · 2 דירות צמודות</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1 font-bold text-blue-600"><IconUser size={12} /> עד {cap} אורחים</span>
              <span>·</span>
              <span className="flex items-center gap-1"><IconBed size={12} /> {a.beds + b.beds} חד׳ סה״כ</span>
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:min-w-[150px] border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0">
            <div className="text-right">
              {nights > 0 && <div className="text-xs text-gray-400 font-semibold mb-0.5">{nights} לילות · 2 דירות</div>}
              <div className="text-2xl font-black text-blue-600">€{total.toLocaleString()}</div>
              <div className="text-xs text-gray-400">סה״כ לשתי הדירות</div>
            </div>
            <a href={`/combo?${query}`} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap">
              ← המשך להזמנה
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
function SearchPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const checkin  = params.get("checkin")  ?? "";
  const checkout = params.get("checkout") ?? "";
  const guests   = parseInt(params.get("guests") ?? "2");

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [rulesMap,   setRulesMap]   = useState<RulesMap>({});
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<Filter>("all");
  const [dateOpen,   setDateOpen]   = useState(!checkin || !checkout);
  const [gDraft,     setGDraft]     = useState(guests);
  const [blocked,    setBlocked]    = useState<string[]>([]);
  const calendarRef  = useRef<HTMLDivElement>(null);

  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : 0;

  /* Load apartments, then fetch pricing rules for all in parallel */
  useEffect(() => {
    fetch("/api/apartments").then(r => r.json()).then((apts: Apartment[]) => {
      const list = Array.isArray(apts) ? apts : [];
      setApartments(list);
      setLoading(false);
      if (!list.length) return;
      Promise.all(
        list.map(apt =>
          fetch(`/api/pricing-rules?apartment_id=${apt.id}`)
            .then(r => r.json())
            .then(rules => ({ id: apt.id, rules: Array.isArray(rules) ? rules : [] }))
        )
      ).then(results => {
        const map: RulesMap = {};
        results.forEach(({ id, rules }) => { map[id] = rules; });
        setRulesMap(map);
      });
    });
  }, []);

  /* Which apartments are booked/unavailable for the selected dates */
  useEffect(() => {
    if (!checkin || !checkout) { setBlocked([]); return; }
    fetch(`/api/availability/blocked?checkin=${checkin}&checkout=${checkout}`)
      .then(r => r.json())
      .then(d => setBlocked(Array.isArray(d.blocked) ? d.blocked : []))
      .catch(() => setBlocked([]));
  }, [checkin, checkout]);

  /* Close calendar on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setDateOpen(false);
    };
    if (dateOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [dateOpen]);

  const available = apartments.filter(a => !blocked.includes(a.id));
  const fits = available.filter(a => capacity(a) >= guests);          // single apt holds the group
  const shown = filter === "all" ? fits : fits.filter(a => getCategory(a) === filter);

  const priceFor = (a: Apartment) =>
    checkin && checkout && nights > 0
      ? calcTotalForRange(checkin, checkout, Number(a.price_per_night), rulesMap[a.id] ?? [])
      : Number(a.price_per_night) * Math.max(nights, 1);

  // No single apartment is big enough → suggest combinations of two
  const maxSingleCap = available.length ? Math.max(...available.map(capacity)) : 0;
  const combos = (fits.length === 0 && guests > maxSingleCap)
    ? available.flatMap((a, i) => available.slice(i + 1)
        .filter(b => capacity(a) + capacity(b) >= guests)
        .map(b => ({ a, b, total: priceFor(a) + priceFor(b), cap: capacity(a) + capacity(b) })))
        .sort((x, y) => x.total - y.total)
    : [];

  /* Cheapest single night across all apartments for the selected period */
  const minPrice = apartments.length
    ? Math.min(...apartments.map(a => {
        const rules = rulesMap[a.id] ?? [];
        if (!checkin || !checkout || nights === 0) return Number(a.price_per_night);
        const end = new Date(checkout + "T12:00:00");
        let min = Infinity;
        for (let d = new Date(checkin + "T12:00:00"); d < end; d.setDate(d.getDate() + 1))
          min = Math.min(min, getEffectivePrice(new Date(d), Number(a.price_per_night), rules));
        return min === Infinity ? Number(a.price_per_night) : min;
      }))
    : null;

  const applyDates = (ci: string, co: string) => {
    router.replace(`/search?checkin=${ci}&checkout=${co}&guests=${gDraft}`);
    setDateOpen(false);
  };

  // apply the current draft (guest count + existing dates) — for guest-only changes
  const applySearch = () => {
    const q = new URLSearchParams();
    if (checkin) q.set("checkin", checkin);
    if (checkout) q.set("checkout", checkout);
    q.set("guests", String(gDraft));
    router.replace(`/search?${q.toString()}`);
    setDateOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── Sticky header ─────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <a href="/" className="flex-shrink-0"><Logo className="h-9" /></a>

          {/* Clickable search pill */}
          <button onClick={() => setDateOpen(o => !o)}
            className={`flex-1 flex items-center gap-2 rounded-xl px-4 py-2.5 border min-w-0 overflow-hidden transition-colors text-right
              ${dateOpen ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-100 hover:border-blue-200"}`}>
            <IconMountain size={13} className="text-blue-500 flex-shrink-0" />
            <span className="text-sm font-bold text-gray-700 whitespace-nowrap hidden sm:inline">Val Thorens</span>
            <span className="text-gray-200 text-xs hidden sm:block">|</span>
            <span className={`hidden sm:flex items-center gap-1.5 text-sm whitespace-nowrap ${checkin && checkout ? "text-gray-700 font-semibold" : "text-blue-500 font-bold"}`}>
              <IconCalendar size={13} />
              {checkin && checkout ? `${fmtDate(checkin)} — ${fmtDate(checkout)}` : "לחץ לבחירת תאריכים ←"}
            </span>
            <span className="text-gray-200 text-xs hidden sm:block">|</span>
            <span className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
              <IconUser size={13} /> {guests} אנשים
            </span>
            {nights > 0 && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0 border border-blue-100">
                {nights} לילות
              </span>
            )}
          </button>

          <button onClick={() => router.push("/")}
            className="text-sm text-blue-600 font-semibold hover:underline whitespace-nowrap flex-shrink-0">
            שנה חיפוש
          </button>
        </div>

        {/* ── Calendar dropdown ─────────────────────────────── */}
        {dateOpen && (
          <div className="absolute top-full left-0 right-0 z-50 px-4 pt-2 pb-4 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-lg">
            <div className="max-w-5xl mx-auto" ref={calendarRef}>
              {/* Guests row above calendar */}
              <div className="flex items-center justify-between mb-3 pt-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500">אנשים:</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setGDraft(g => Math.max(1, g - 1))}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600 font-bold text-sm transition-colors">−</button>
                    <span className="font-bold text-gray-900 w-5 text-center text-sm">{gDraft}</span>
                    <button type="button" onClick={() => setGDraft(g => Math.min(12, g + 1))}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-600 font-bold text-sm transition-colors">+</button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={applySearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors shadow-sm">
                    שמור חיפוש ←
                  </button>
                  {checkin && checkout && (
                    <button onClick={() => setDateOpen(false)} className="text-sm text-gray-400 hover:text-gray-600">סגור ×</button>
                  )}
                </div>
              </div>
              <SkiCalendar
                initialFrom={checkin || undefined}
                initialTo={checkout || undefined}
                onSelect={applyDates}
                onCancel={checkin && checkout ? () => setDateOpen(false) : undefined}
              />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Title + filter pills ──────────────────────────── */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {loading ? "טוען דירות..." : `${shown.length} דירות זמינות`}
            </h1>
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
              {nights > 0 && <span>{nights} לילות · {guests} {guests === 1 ? "אדם" : "אנשים"}</span>}
              {!loading && minPrice !== null && (
                <span className="flex items-center gap-1">
                  {nights > 0 && <span className="text-gray-300">·</span>}
                  <span className="font-bold text-gray-700">החל מ <span className="text-blue-600">€{minPrice}</span> ללילה</span>
                </span>
              )}
            </p>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setFilter("all")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <IconSearch size={14} />
              הכל
            </button>
            <button onClick={() => setFilter("cozy")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${filter === "cozy" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <IconHome size={14} />
              Cozy
            </button>
            <button onClick={() => setFilter("premium")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${filter === "premium" ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <IconDiamond size={14} />
              Premium
            </button>
          </div>
        </div>

        {/* ── Apartment list ──────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : combos.length > 0 ? (
          <div dir="rtl">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-5 text-center">
              <p className="font-black text-blue-900 text-lg mb-1">אין דירה בודדת ל-{guests} אורחים — אבל יש פתרון! 🎿</p>
              <p className="text-blue-700 text-sm">שילבנו עבורכם שתי דירות צמודות שמתאימות יחד לכל הקבוצה. מחיר כולל, הזמנה אחת.</p>
            </div>
            <div className="flex flex-col gap-4">
              {combos.map(c => (
                <ComboCard key={c.a.id + c.b.id} a={c.a} b={c.b} total={c.total} cap={c.cap}
                  checkin={checkin} checkout={checkout} guests={guests} nights={nights} />
              ))}
            </div>
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
              <IconSearch size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">לא נמצאו דירות מתאימות{guests > 1 ? ` ל-${guests} אורחים` : ""}</p>
            <button onClick={() => setFilter("all")}
              className="mt-3 text-sm text-blue-600 font-semibold hover:underline">
              הצג את כל הדירות
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {shown.map(apt => (
              <AptCard key={apt.id} apt={apt} nights={nights}
                checkin={checkin} checkout={checkout} guests={guests}
                rules={rulesMap[apt.id] ?? []} />
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
        <SkiLoader />
      </div>
    }>
      <SearchPage />
    </Suspense>
  );
}
