"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { Apartment } from "@/types";
import {
  IconMountain, IconSkis, IconBus, IconPlane, IconShield, IconUser, IconBot,
  IconCheck, IconStar, IconCalendar, IconChevronLeft, IconWifi, IconFire,
  IconParking, IconBed, IconSnowflake,
} from "@/components/Icons";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => { if (!s) return ""; const d = new Date(s); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`; };

const SKI_DAY_PRICE  = 70;
const TRANSFER_PRICE = 180;
const FLEXIBLE_EXTRA = 100; // per person
const AI_DISCOUNT    = 50;  // per person

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi":       <IconWifi size={15} />,
  "אח":         <IconFire size={15} />,
  "חניה":       <IconParking size={15} />,
  "ג'קוזי":     <IconSnowflake size={15} />,
};
const amenityIcon = (a: string) => AMENITY_ICONS[a] ?? <IconCheck size={15} />;

/* ── Toggle row ───────────────────────────────────────────── */
function ToggleRow({ icon, label, sublabel, price, checked, onChange }: {
  icon: React.ReactNode; label: string; sublabel?: string;
  price?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-right transition-all
        ${checked ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}
    >
      <span className={`flex-shrink-0 ${checked ? "text-blue-600" : "text-gray-400"}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        {sublabel && <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>}
      </div>
      {price && <span className="text-xs font-bold text-gray-600 flex-shrink-0">{price}</span>}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
        ${checked ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
        {checked && <IconCheck size={11} className="text-white" />}
      </div>
    </button>
  );
}

/* ── Radio option ─────────────────────────────────────────── */
function RadioOption({ icon, label, sublabel, badge, badgeColor, selected, onClick }: {
  icon: React.ReactNode; label: string; sublabel: string;
  badge?: string; badgeColor?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-right transition-all
        ${selected ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}`}
    >
      <span className={`mt-0.5 flex-shrink-0 ${selected ? "text-blue-600" : "text-gray-400"}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          {badge && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: badgeColor }}>
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>
      </div>
      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0
        ${selected ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
        {selected && <div className="w-2.5 h-2.5 bg-white rounded-full mx-auto mt-0.5" />}
      </div>
    </button>
  );
}

/* ── Image gallery ───────────────────────────────────────── */
function Gallery({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  const imgs = images?.length ? images : ["/apt1.jpg", "/apt2.jpg", "/apt3.jpg"];

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-72 md:h-96 group">
      <img src={imgs[idx]} alt={name} className="w-full h-full object-cover transition-all duration-500" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 50%)" }} />

      {/* Thumbnails strip */}
      {imgs.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {imgs.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`} />
          ))}
        </div>
      )}

      {/* Arrows */}
      {imgs.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + imgs.length) % imgs.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
            <IconChevronLeft size={18} className="rotate-180" />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % imgs.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
            <IconChevronLeft size={18} />
          </button>
        </>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
function ApartmentPage() {
  const { id }     = useParams<{ id: string }>();
  const params     = useSearchParams();
  const checkin    = params.get("checkin")  ?? "";
  const checkout   = params.get("checkout") ?? "";
  const guests     = parseInt(params.get("guests") ?? "2");

  const [apt,      setApt]      = useState<Apartment | null>(null);
  const [loading,  setLoading]  = useState(true);

  // Add-ons
  const [skiPass,  setSkiPass]  = useState(false);
  const [transfer, setTransfer] = useState(false);

  // Cancellation: "none" | "flexible"
  const [cancel, setCancel] = useState<"none" | "flexible">("none");

  // Service: "human" | "ai"
  const [service, setService] = useState<"human" | "ai">("human");

  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : 7;

  useEffect(() => {
    fetch(`/api/apartments/${id}`)
      .then(r => r.json())
      .then(d => { setApt(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  /* ── Flight URLs with actual dates ─────────────────────── */
  const fmtSky = (s: string) => {
    if (!s) return "";
    const d = new Date(s);
    return `${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  };
  const skyscannerUrl = checkin && checkout
    ? `https://www.skyscanner.co.il/transport/flights/tlv/gva/${fmtSky(checkin)}/${fmtSky(checkout)}/?adultsv2=${guests}&cabinclass=economy&childrenv2=&rtn=1`
    : `https://www.skyscanner.co.il/transport/flights/tlv/gva/`;

  /* ── Price calculation ──────────────────────────────────── */
  const aptTotal      = apt ? apt.price_per_night * nights : 0;
  const skiTotal      = skiPass  ? SKI_DAY_PRICE * nights * guests : 0;
  const trTotal       = transfer ? TRANSFER_PRICE : 0;
  const flexExtra     = cancel   === "flexible" ? FLEXIBLE_EXTRA * guests : 0;
  const aiDiscount    = service  === "ai"       ? -(AI_DISCOUNT  * guests) : 0;
  const grandTotal    = aptTotal + skiTotal + trTotal + flexExtra + aiDiscount;

  /* ── Book URL ───────────────────────────────────────────── */
  const buildBookUrl = () => {
    const p = new URLSearchParams({
      apartment: apt?.name ?? id,
      checkin, checkout,
      guests: String(guests),
      ski_pass: String(skiPass),
      transfer: String(transfer),
      cancel,
      service,
    });
    return `/book?${p}`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!apt) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 text-lg" dir="rtl">
      דירה לא נמצאה
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── Top nav ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 font-black text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <IconMountain size={16} className="text-white" />
            </div>
            MySki
          </a>
          <span className="text-gray-200 text-lg font-light">/</span>
          <a href={`/search?checkin=${checkin}&checkout=${checkout}&guests=${guests}`}
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors">תוצאות חיפוש</a>
          <span className="text-gray-200 text-lg font-light">/</span>
          <span className="text-sm text-gray-700 font-semibold truncate">{apt.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT: apartment details ────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Gallery */}
            <Gallery images={apt.images} name={apt.name} />

            {/* Header */}
            <div className="mt-6 mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs font-bold tracking-widest uppercase text-blue-600 mb-1">{apt.type}</div>
                  <h1 className="text-3xl font-black text-gray-900">{apt.name}</h1>
                  <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-sm">
                    <IconMountain size={14} className="text-blue-500" />
                    Val Thorens, Trois Vallées, France
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-4 py-2.5 rounded-xl">
                  <IconStar size={16} className="text-amber-400" />
                  <span className="font-black text-gray-900">4.9</span>
                  <span className="text-gray-400 text-sm">· 47 ביקורות</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex gap-5 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><IconBed size={15} className="text-gray-400" />{apt.beds} חדרי שינה</span>
                <span>·</span>
                <span>{apt.baths} חדרי רחצה</span>
                <span>·</span>
                <span>{apt.sqm} מ״ר</span>
              </div>
            </div>

            {/* Description */}
            {apt.description && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h2 className="text-lg font-black text-gray-900 mb-3">על הדירה</h2>
                <p className="text-gray-600 leading-relaxed text-sm">{apt.description}</p>
              </div>
            )}

            {/* Amenities */}
            {apt.amenities?.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h2 className="text-lg font-black text-gray-900 mb-4">מה כלול</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {apt.amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <span className="text-blue-500">{amenityIcon(a)}</span>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-3">מיקום</h2>
              <div className="bg-blue-50 rounded-2xl p-5 text-sm text-gray-600 border border-blue-100">
                <div className="flex items-center gap-2 font-bold text-gray-800 mb-1">
                  <IconMountain size={16} className="text-blue-600" />
                  Val Thorens
                </div>
                <p>הכפר הגבוה ביותר באירופה · 2,300 מ׳ · שלג מובטח נובמבר–מאי · גישה ישירה ל-600 ק״מ מסלולים</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: booking sidebar ─────────────────────────── */}
          <div className="lg:w-[400px] flex-shrink-0">
            <div className="sticky top-20">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">

                {/* Price header */}
                <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-gray-50 to-blue-50 border-b border-gray-100">
                  <div className="text-3xl font-black text-gray-900">
                    €{apt.price_per_night.toLocaleString()}
                    <span className="text-base font-medium text-gray-400"> / לילה</span>
                  </div>
                  {checkin && checkout && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <IconCalendar size={14} />
                      {fmtDate(checkin)} — {fmtDate(checkout)} · {nights} לילות · {guests} אנשים
                    </div>
                  )}
                </div>

                <div className="px-6 py-5 flex flex-col gap-5">

                  {/* ── Ski Pass ──────────────────────────────────── */}
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">תוספות</div>
                    <div className="flex flex-col gap-2">
                      <ToggleRow
                        icon={<IconSkis size={18} />}
                        label="סקי פס · Trois Vallées"
                        sublabel="600 ק״מ מסלולים · כל הרמות"
                        price={`+€${SKI_DAY_PRICE}/יום/אדם`}
                        checked={skiPass} onChange={setSkiPass}
                      />
                      <ToggleRow
                        icon={<IconBus size={18} />}
                        label="הסעה הלוך-חזור"
                        sublabel="שאטל ישיר משדה התעופה"
                        price={`+€${TRANSFER_PRICE}`}
                        checked={transfer} onChange={setTransfer}
                      />
                    </div>
                    <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-2.5 p-3.5 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50 transition-all">
                      <span className="text-gray-400 flex-shrink-0"><IconPlane size={17} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800">טיסה ל-Geneva (GVA)</div>
                        <div className="text-xs text-gray-400">TLV → Geneva · {checkin ? fmtDate(checkin) : "בחר תאריך"} · 2.5h מ-Val Thorens</div>
                      </div>
                      <span className="text-xs font-bold text-blue-600 flex-shrink-0">Skyscanner ←</span>
                    </a>
                  </div>

                  {/* ── Cancellation policy ───────────────────────── */}
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">מדיניות ביטול</div>
                    <div className="flex flex-col gap-2">
                      <RadioOption
                        icon={<IconShield size={18} />}
                        label="לא ניתן לביטול"
                        sublabel="מחיר מוזל — אין החזר כספי"
                        selected={cancel === "none"}
                        onClick={() => setCancel("none")}
                      />
                      <RadioOption
                        icon={<IconShield size={18} />}
                        label="מדיניות גמישה"
                        sublabel="80% החזר עד 48 שעות לפני"
                        badge={`+€${FLEXIBLE_EXTRA}/אדם`}
                        badgeColor="#10b981"
                        selected={cancel === "flexible"}
                        onClick={() => setCancel("flexible")}
                      />
                    </div>
                  </div>

                  {/* ── Service level ─────────────────────────────── */}
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">רמת שירות</div>
                    <div className="flex flex-col gap-2">
                      <RadioOption
                        icon={<IconUser size={18} />}
                        label="שירות אנושי מלא"
                        sublabel="נציג ישראלי זמין לפני, במהלך ואחרי"
                        selected={service === "human"}
                        onClick={() => setService("human")}
                      />
                      <RadioOption
                        icon={<IconBot size={18} />}
                        label="AI בלבד"
                        sublabel="ניהול עצמאי עם תמיכת צ'אטבוט"
                        badge={`-€${AI_DISCOUNT}/אדם`}
                        badgeColor="#6366f1"
                        selected={service === "ai"}
                        onClick={() => setService("ai")}
                      />
                    </div>
                  </div>

                  {/* ── Price breakdown ───────────────────────────── */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">סיכום מחיר</div>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">€{apt.price_per_night} × {nights} לילות</span>
                        <span className="font-semibold text-gray-800">€{aptTotal.toLocaleString()}</span>
                      </div>
                      {skiPass && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">סקי פס × {guests} × {nights} ימים</span>
                          <span className="font-semibold text-gray-800">€{skiTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {transfer && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">הסעה הלוך-חזור</span>
                          <span className="font-semibold text-gray-800">€{TRANSFER_PRICE}</span>
                        </div>
                      )}
                      {cancel === "flexible" && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">מדיניות גמישה × {guests}</span>
                          <span className="font-semibold text-gray-800">€{flexExtra.toLocaleString()}</span>
                        </div>
                      )}
                      {service === "ai" && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">הנחת AI × {guests}</span>
                          <span className="font-semibold text-indigo-600">−€{(AI_DISCOUNT * guests).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-3">
                      <span className="font-black text-gray-900">סה״כ</span>
                      <span className="text-2xl font-black text-gray-900">€{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* ── CTA ───────────────────────────────────────── */}
                  <a href={buildBookUrl()}
                    className="block w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-center text-base transition-colors shadow-sm">
                    ← המשך להזמנה
                  </a>

                  <p className="text-center text-xs text-gray-400">
                    {cancel === "flexible" ? "80% החזר עד 48 שעות לפני" : "לא ניתן לביטול לאחר ההזמנה"}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ApartmentPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ApartmentPage />
    </Suspense>
  );
}
