"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Apartment } from "@/types";
import { calcTotalForRange, getEffectivePrice } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import CardPaymentButton from "@/components/CardPaymentButton";
import SaveTripButton from "@/components/SaveTripButton";
import FlightDetailsModal, { EMPTY_FLIGHT, flightToString, flightFilled, type Flight } from "@/components/FlightDetailsModal";
import { buildWaHref } from "@/lib/whatsapp";
import { IconMountain, IconUser, IconBed, IconCheck, IconWhatsApp, IconStar, IconSkis, IconBus, IconPlane, IconShield, IconBot } from "@/components/Icons";
import Logo from "@/components/Logo";

const HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmt = (s: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE[d.getMonth()]} ${d.getFullYear()}`; };
const fmtSky = (s: string) => { if (!s) return ""; const d = new Date(s); return `${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`; };
const capacity = (a: Apartment) => a.max_guests || a.beds * 2 || 2;
const TRANSFER_PRICE = 180;
const equipCost = (n: number) => (n <= 0 ? 0 : n < 7 ? 30 * n : 120 + 20 * (n - 7));
const CANCEL_FLEX = 100; // flexible cancellation surcharge (flat)
const CANCEL_NONE = 100; // no-cancellation discount (flat)
const AI_DISCOUNT = 50;  // per person

function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const imgs = images?.length ? images : ["/hero-ski.jpg"];
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative h-60 rounded-t-2xl overflow-hidden">
      <img src={imgs[idx]} alt={alt} className="w-full h-full object-cover" />
      {imgs.length > 1 && (
        <>
          <button onClick={() => setIdx((idx - 1 + imgs.length) % imgs.length)}
            className="absolute top-1/2 right-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white flex items-center justify-center shadow text-gray-700 text-lg">›</button>
          <button onClick={() => setIdx((idx + 1) % imgs.length)}
            className="absolute top-1/2 left-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white flex items-center justify-center shadow text-gray-700 text-lg">‹</button>
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
            {imgs.slice(0, 8).map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white scale-125" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AptBlock({ a }: { a: Apartment }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <Gallery images={a.images} alt={a.name} />
      <div className="p-5 text-right">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 text-sm"><IconStar size={13} className="text-amber-400" /><span className="font-bold text-gray-700">4.9</span><span className="text-gray-400 text-xs">· 47 ביקורות</span></span>
          <h3 className="font-display font-black text-gray-900 text-lg">{a.name}</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1 justify-end">
          <IconMountain size={12} className="text-blue-400" /> Val Thorens, Trois Vallées · {a.type}
        </p>
        <div className="flex items-center gap-2.5 text-xs text-gray-500 justify-end mb-3 flex-wrap">
          <span className="flex items-center gap-1 font-bold text-blue-600"><IconUser size={12} /> עד {capacity(a)}</span>
          <span>·</span><span className="flex items-center gap-1"><IconBed size={12} /> {a.beds} חד׳</span>
          <span>·</span><span>{a.baths} אמב׳</span>
          <span>·</span><span>{a.sqm} מ״ר</span>
        </div>
        {a.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end mb-3">
            {a.amenities.slice(0, 8).map((am, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full">
                <IconCheck size={10} className="text-green-500" /> {am}
              </span>
            ))}
          </div>
        )}
        {a.description && <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line line-clamp-6">{a.description}</p>}
      </div>
    </div>
  );
}

function AddonCard({ icon, label, sublabel, price, checked, onChange, disabled }: {
  icon: React.ReactNode; label: string; sublabel: string; price: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-right ${disabled ? "border-gray-100 bg-gray-50 cursor-not-allowed" : checked ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-white hover:border-blue-200"}`}>
      <span className={`flex-shrink-0 ${disabled ? "text-gray-300" : checked ? "text-blue-600" : "text-gray-400"}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${disabled ? "text-gray-400" : "text-gray-800"}`}>{label}</div>
        <div className="text-xs text-gray-400">{sublabel}</div>
      </div>
      {disabled
        ? <span className="text-[11px] font-bold text-blue-500 flex-shrink-0">בקרוב</span>
        : <>
            <span className="text-sm font-bold text-blue-600 flex-shrink-0 whitespace-nowrap">{price}</span>
            <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${checked ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300"}`}>{checked && <IconCheck size={12} />}</span>
          </>}
    </button>
  );
}

function RadioOption({ icon, label, sublabel, badge, badgeColor, selected, onClick }: {
  icon: React.ReactNode; label: string; sublabel: string; badge?: string; badgeColor?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-right ${selected ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-white hover:border-blue-200"}`}>
      <span className={`flex-shrink-0 ${selected ? "text-blue-600" : "text-gray-400"}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        <div className="text-xs text-gray-400">{sublabel}</div>
      </div>
      {badge && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: badgeColor }}>{badge}</span>}
      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selected ? "border-blue-600 bg-blue-600 ring-2 ring-blue-200" : "border-gray-300"}`} />
    </button>
  );
}

function ComboInner() {
  const params = useSearchParams();
  const aId = params.get("a") || "", bId = params.get("b") || "";
  const checkin = params.get("checkin") || "", checkout = params.get("checkout") || "";
  const guests = parseInt(params.get("guests") || "2");
  const nights = checkin && checkout ? Math.round((+new Date(checkout) - +new Date(checkin)) / 86400000) : 0;

  const [a, setA] = useState<Apartment | null>(null);
  const [b, setB] = useState<Apartment | null>(null);
  const [rulesA, setRulesA] = useState<PricingRule[]>([]);
  const [rulesB, setRulesB] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [skiPass, setSkiPass] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [equipment, setEquipment] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [flight, setFlight] = useState<Flight>(EMPTY_FLIGHT);
  const [cancel, setCancel] = useState<"regular" | "none" | "flexible">("regular");
  const [showNoCancel, setShowNoCancel] = useState(false);
  const [noCancelAgreed, setNoCancelAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [service, setService] = useState<"human" | "ai">("human");
  const [showAiInfo, setShowAiInfo] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/apartments").then(r => r.json()),
      fetch(`/api/pricing-rules?apartment_id=${aId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/pricing-rules?apartment_id=${bId}`).then(r => r.json()).catch(() => []),
    ]).then(([apts, ra, rb]) => {
      const list: Apartment[] = Array.isArray(apts) ? apts : [];
      setA(list.find(x => x.id === aId) ?? null);
      setB(list.find(x => x.id === bId) ?? null);
      setRulesA(Array.isArray(ra) ? ra : []);
      setRulesB(Array.isArray(rb) ? rb : []);
      setLoading(false);
    });
  }, [aId, bId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><SkiLoader /></div>;
  if (!a || !b) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500" dir="rtl">השילוב לא נמצא. <a href="/apartments" className="text-blue-600 underline mr-1">חזרה לדירות</a></div>;

  const totalA = nights > 0 ? calcTotalForRange(checkin, checkout, Number(a.price_per_night), rulesA) : Number(a.price_per_night);
  const totalB = nights > 0 ? calcTotalForRange(checkin, checkout, Number(b.price_per_night), rulesB) : Number(b.price_per_night);
  const trTotal = transfer ? TRANSFER_PRICE : 0;
  const equipTotal = equipment ? equipCost(nights) : 0;
  const flexExtra = cancel === "flexible" ? CANCEL_FLEX : 0;
  const noCancelDiscount = cancel === "none" ? -CANCEL_NONE : 0;
  const aiDiscount = service === "ai" ? -AI_DISCOUNT : 0;
  const total = totalA + totalB + trTotal + equipTotal + flexExtra + noCancelDiscount + aiDiscount;   // ski pass: price coming soon → not charged
  const transferDetails = transfer ? flightToString(flight) : "";
  const comboName = `${a.name} + ${b.name}`;
  const avgNightly = nights > 0 ? Math.round((totalA + totalB) / nights) : Number(a.price_per_night) + Number(b.price_per_night);
  const breakdown = (() => {
    if (!checkin || !checkout || nights <= 0) return [] as { date: Date; price: number }[];
    const out: { date: Date; price: number }[] = [];
    const end = new Date(checkout + "T12:00:00");
    for (let d = new Date(checkin + "T12:00:00"); d < end; d.setDate(d.getDate() + 1)) {
      const pa = getEffectivePrice(new Date(d), Number(a.price_per_night), rulesA);
      const pb = getEffectivePrice(new Date(d), Number(b.price_per_night), rulesB);
      out.push({ date: new Date(d), price: pa + pb });
    }
    return out;
  })();
  const skyscannerUrl = checkin && checkout
    ? `https://www.skyscanner.co.il/transport/flights/tlv/gva/${fmtSky(checkin)}/${fmtSky(checkout)}/?adultsv2=${guests}&cabinclass=economy&childrenv2=&rtn=1`
    : `https://www.skyscanner.co.il/transport/flights/tlv/gva/`;

  const wa = buildWaHref({
    intro: "היי! מעוניין/ת בחבילה משולבת של שתי דירות 🎿",
    lines: [
      `דירות: ${comboName}`, `תאריכים: ${fmt(checkin)}–${fmt(checkout)}`, `${guests} אורחים · ${nights} לילות`,
      skiPass ? "🎿 מעוניין/ת גם בסקי פס" : "", transfer ? `🚐 כולל הסעה${transferDetails ? ` (${transferDetails})` : ""}` : "", equipment ? `🎿 כולל השכרת ציוד (€${equipTotal})` : "",
      cancel === "flexible" ? "✅ מדיניות ביטול גמישה" : cancel === "none" ? "🔒 ללא אפשרות ביטול" : "", service === "ai" ? "🤖 ניהול עצמאי (AI)" : "",
    ].filter(Boolean),
    total,
  });

  return (
    <div className="min-h-screen bg-[#f8f9ff]" dir="rtl">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/apartments" className="text-sm text-gray-500 hover:text-gray-900">→ חזרה לדירות</a>
          <a href="/"><Logo className="h-8" /></a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        <div className="text-center mb-7">
          <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">חבילה משולבת · 2 דירות צמודות</span>
          <h1 className="font-display text-3xl font-black text-gray-900">{comboName}</h1>
          <p className="text-gray-500 mt-1 flex items-center justify-center gap-1.5">
            <IconMountain size={14} className="text-blue-400" /> Val Thorens, France · מתאים עד {capacity(a) + capacity(b)} אורחים
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-6 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AptBlock a={a} />
            <AptBlock a={b} />
          </div>

          {/* Booking panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm lg:sticky lg:top-24 overflow-hidden">
            <div className="bg-blue-50/60 px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between gap-2">
                {breakdown.length > 0 && (
                  <button onClick={() => setShowBreakdown(v => !v)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
                    פירוט מחיר {showBreakdown ? "▲" : "▼"}
                  </button>
                )}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-gray-400">/ לילה ממוצע</span>
                  <span className="font-display text-3xl font-black text-gray-900">€{avgNightly.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">{fmt(checkin)} — {fmt(checkout)} · {nights} לילות · {guests} אורחים</p>

              {showBreakdown && breakdown.length > 0 && (
                <div className="mt-3 bg-white rounded-xl border border-blue-100 overflow-hidden">
                  <div className="px-4 py-2 bg-blue-50/60 text-[11px] text-gray-400 text-right">מחיר ללילה (שתי הדירות יחד)</div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
                    {breakdown.map(({ date, price }, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-2 text-sm">
                        <span className="font-semibold text-gray-800">€{price.toLocaleString()}</span>
                        <span className="text-gray-500">{fmt(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5 bg-blue-50 border-t border-blue-100 text-sm font-bold">
                    <span className="text-blue-700">€{avgNightly.toLocaleString()}</span>
                    <span className="text-gray-600">ממוצע ללילה</span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">תוספות</div>
                <div className="flex flex-col gap-2">
                  <AddonCard icon={<IconSkis size={18} />} label="סקי פס · Trois Vallées" sublabel="600 ק״מ מסלולים · כל הרמות · איסוף עצמאי מהמכונה" price="מחיר בקרוב" checked={skiPass} onChange={setSkiPass} disabled />
                  <AddonCard icon={<IconBus size={18} />} label="הסעה הלוך-חזור" sublabel="שאטל ישיר משדה התעופה" price={`+€${TRANSFER_PRICE}`} checked={transfer} onChange={setTransfer} />
                  <AddonCard icon={<IconSkis size={18} />} label="השכרת ציוד סקי/סנובורד" sublabel="€30 ליום · €120 לשבוע · +€20 לכל יום נוסף" price={nights > 0 ? `+€${equipCost(nights)}` : "החל מ-€30"} checked={equipment} onChange={setEquipment} />
                  {transfer && (
                    <button onClick={() => setShowTransfer(true)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors text-sm w-full text-right">
                      <span className="text-blue-700 font-semibold">{flightFilled(flight) ? "✓ פרטי טיסה נשמרו · עריכה" : "מלא פרטי טיסה להסעה ←"}</span>
                      <span className="text-xs text-blue-400">הגעה + חזור</span>
                    </button>
                  )}
                </div>
                <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-2.5 p-3.5 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50 transition-all">
                  <span className="text-gray-400 flex-shrink-0"><IconPlane size={17} /></span>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="text-sm font-semibold text-gray-800">טיסה ל-Geneva (GVA)</div>
                    <div className="text-xs text-gray-400">TLV → Geneva · {checkin ? fmt(checkin) : "בחר תאריך"} · 2.5h מ-Val Thorens</div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 flex-shrink-0">Skyscanner ←</span>
                </a>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">מדיניות ביטול</div>
                <div className="flex flex-col gap-2">
                  <RadioOption icon={<IconShield size={18} />} label="ביטול רגיל" sublabel="בהתאם לתנאי התקנון · מחיר רגיל" selected={cancel === "regular"} onClick={() => setCancel("regular")} />
                  <RadioOption icon={<IconShield size={18} />} label="ללא אפשרות ביטול" sublabel="מחיר מוזל · לא ניתן לבטל ואין החזר כספי" badge={`−€${CANCEL_NONE}`} badgeColor="#ef4444" selected={cancel === "none"} onClick={() => setShowNoCancel(true)} />
                  <RadioOption icon={<IconShield size={18} />} label="ביטול גמיש" sublabel="80% החזר עד שבוע לפני · 50% עד 24ש׳ לפני ההמראה · אח״כ אין החזר" badge={`+€${CANCEL_FLEX}`} badgeColor="#10b981" selected={cancel === "flexible"} onClick={() => setCancel("flexible")} />
                </div>
                <a href="/terms" target="_blank" className="inline-block mt-2 text-xs text-blue-600 hover:underline font-semibold">קרא/י את מדיניות הביטולים בתקנון ←</a>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">רמת שירות</div>
                  <button onClick={() => setShowAiInfo(true)} className="text-xs font-semibold text-blue-600 hover:underline">ⓘ מידע נוסף</button>
                </div>
                <div className="flex flex-col gap-2">
                  <RadioOption icon={<IconUser size={18} />} label="שירות אנושי מלא" sublabel="נציג ישראלי זמין לפני, במהלך ואחרי" selected={service === "human"} onClick={() => setService("human")} />
                  <RadioOption icon={<IconBot size={18} />} label="AI בלבד" sublabel="ניהול עצמאי עם תמיכת צ'אטבוט · איסוף עצמאי של הסקי פס" badge={`-€${AI_DISCOUNT}`} badgeColor="#6366f1" selected={service === "ai"} onClick={() => setService("ai")} />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <Row label={a.name} value={`€${totalA.toLocaleString()}`} muted />
                <Row label={b.name} value={`€${totalB.toLocaleString()}`} muted />
                {transfer && <Row label="הסעה הלוך-חזור" value={`€${trTotal}`} muted />}
                {equipment && <Row label={`השכרת ציוד · ${nights} ימים`} value={`€${equipTotal.toLocaleString()}`} muted />}
                {skiPass && <Row label="סקי פס" value="מחיר בקרוב" muted />}
                {cancel === "flexible" && <Row label="ביטול גמיש" value={`€${flexExtra.toLocaleString()}`} muted />}
                {cancel === "none" && <Row label="ללא אפשרות ביטול" value={`−€${CANCEL_NONE.toLocaleString()}`} muted />}
                {service === "ai" && <Row label="הנחת ניהול עצמאי (AI)" value={`-€${AI_DISCOUNT.toLocaleString()}`} muted />}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="font-black text-gray-900 text-lg">סה״כ</span>
                <span className="font-display text-2xl font-black text-blue-600">€{total.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">* ייתכנו עמלות נוספות (כגון עמלת סליקת אשראי 1.9%). המחירים ב-€ והחיוב בש״ח לפי שער ההמרה.</p>

              <CardPaymentButton
                apartmentId={a.id} apartment={comboName}
                extraApartmentId={b.id} extraApartmentName={b.name}
                checkin={checkin} checkout={checkout} guests={guests} nights={nights}
                skiPass={skiPass} transfer={transfer} equipment={equipment} transferDetails={transferDetails} grandTotal={total} cancel={cancel} service={service}
                label="תשלום מאובטח בכרטיס" />
              <a href={wa} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold py-3.5 rounded-xl transition">
                <IconWhatsApp size={20} /> תיאום בוואטסאפ
              </a>
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="block w-full py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold text-center text-sm transition-colors">
                {copied ? "✓ הקישור הועתק" : "📋 שלח הצעת מחיר (העתק קישור)"}
              </button>
              <SaveTripButton apartmentId={a.id} extraApartmentId={b.id} checkin={checkin} checkout={checkout} guests={guests}
                label="שמור לחופשות שלי"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 text-gray-700 font-bold text-center text-sm transition-colors" />
              <p className="text-center text-xs text-gray-400">הזמנה אחת לשתי הדירות · תשלום מאובטח PayPlus</p>
            </div>
          </div>
        </div>
      </main>

      {/* Transfer flight details */}
      <FlightDetailsModal open={showTransfer} onClose={() => setShowTransfer(false)} value={flight} onChange={setFlight} />

      {/* No-cancellation confirmation + signature */}
      {showNoCancel && (
        <div dir="rtl" className="fixed inset-0 z-[95] bg-black/55 flex items-center justify-center p-4" onClick={() => setShowNoCancel(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl font-black text-slate-900 mb-1">ללא אפשרות ביטול</h2>
            <p className="text-sm text-slate-500 mb-4">בחירה באפשרות זו מוזילה את המחיר ב-€{CANCEL_NONE}, אך ההזמנה <b>אינה ניתנת לביטול</b> ולא יינתן כל החזר כספי, בהתאם לתקנון.</p>
            <label className="flex items-start gap-2 cursor-pointer mb-4">
              <input type="checkbox" checked={noCancelAgreed} onChange={e => setNoCancelAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-600" />
              <span className="text-sm text-slate-600 leading-relaxed">אני מאשר/ת שקראתי והבנתי כי <b>לא אוכל לבטל את ההזמנה</b> ולא אקבל החזר כספי בשום מקרה, ומסכים/ה ל<a href="/terms" target="_blank" className="text-blue-600 underline">תקנון</a>.</span>
            </label>
            <label className="block text-xs font-bold text-gray-400 mb-1">חתימה (שם מלא)</label>
            <input value={signature} onChange={e => setSignature(e.target.value)} placeholder="הקלד/י את שמך המלא כחתימה"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex gap-2">
              <button disabled={!noCancelAgreed || signature.trim().length < 2}
                onClick={() => { setCancel("none"); setShowNoCancel(false); }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition">אישור וחתימה</button>
              <button onClick={() => setShowNoCancel(false)} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* AI service info */}
      {showAiInfo && (
        <div dir="rtl" className="fixed inset-0 z-[95] bg-black/55 flex items-center justify-center p-4" onClick={() => setShowAiInfo(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-black text-slate-900">שירות AI — איך זה עובד?</h2>
              <button onClick={() => setShowAiInfo(false)} className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 text-xl">✕</button>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <li className="flex gap-2"><span>📍</span><span>תקבל/י את הכתובת המלאה וחוקי הצ׳ק-אין / צ׳ק-אאוט.</span></li>
              <li className="flex gap-2"><span>🔑</span><span>המפתחות יחכו לך בדלת כ-48 שעות לפני ההגעה. את הדירה יש לפנות לפי שעות הצ׳ק-אאוט הרגילות.</span></li>
              <li className="flex gap-2"><span>🎿</span><span>אם הזמנת סקי פס — תאסוף/י אותו עצמאית מהמכונה במהלך השהות.</span></li>
              <li className="flex gap-2"><span>🤖</span><span>לאורך החופשה תיעזר/י בצ׳אטבוט AI לכל שאלה.</span></li>
              <li className="flex gap-2"><span>🆘</span><span>במקרים חריגים (קבלת דירה עם נזק, מקרה קיצון) תוכל/י כמובן לפנות לנציגים שלנו דרך האתר.</span></li>
            </ul>
            <button onClick={() => setShowAiInfo(false)} className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition">הבנתי</button>
          </div>
        </div>
      )}
    </div>
  );
}

const Row = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={muted ? "text-gray-400 text-sm" : "text-gray-600"}>{label}</span>
    <span className={muted ? "text-gray-500 text-sm" : "font-bold text-gray-900"}>{value}</span>
  </div>
);

export default function ComboPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50" />}><ComboInner /></Suspense>;
}
