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
const equipCost = (n: number) => (n <= 0 ? 0 : n < 6 ? 30 * n : 120 + 20 * (n - 6));
const CANCEL_FLEX = 100; // flexible cancellation surcharge (flat)
const CANCEL_NONE = 100; // no-cancellation discount (flat)
const AI_DISCOUNT = 50;  // per person

function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const imgs = images?.length ? images : ["/hero-ski.jpg"];
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative h-60 overflow-hidden">
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
    <div className="card-luxury overflow-hidden">
      <Gallery images={a.images} alt={a.name} />
      <div className="p-5 text-right">
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 text-sm"><IconStar size={13} className="text-amber-400" /><span className="font-bold text-[var(--stone)]">4.9</span><span className="text-xs text-[var(--stone-soft)]">· 47 ביקורות</span></span>
          <h3 className="font-display font-medium text-lg text-[var(--charcoal)]">{a.name}</h3>
        </div>
        <p className="text-xs mb-3 flex items-center gap-1 justify-end text-[var(--stone-soft)]">
          <IconMountain size={12} className="text-[var(--gold-deep)]" /> Val Thorens, Trois Vallées · {a.type}
        </p>
        <div className="flex items-center gap-2.5 text-xs justify-end mb-3 flex-wrap text-[var(--stone)]">
          <span className="flex items-center gap-1 font-bold text-[var(--gold-deep)]"><IconUser size={12} /> עד {capacity(a)}</span>
          <span>·</span><span className="flex items-center gap-1"><IconBed size={12} /> {a.beds} חד׳</span>
          <span>·</span><span>{a.baths} אמב׳</span>
          <span>·</span><span>{a.sqm} מ״ר</span>
        </div>
        {a.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end mb-3">
            {a.amenities.slice(0, 8).map((am, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ color: "var(--stone)", background: "var(--ivory-deep)" }}>
                <IconCheck size={10} className="text-green-500" /> {am}
              </span>
            ))}
          </div>
        )}
        {a.description && <p className="text-sm leading-relaxed whitespace-pre-line line-clamp-6 text-[var(--stone)]">{a.description}</p>}
      </div>
    </div>
  );
}

function AddonCard({ icon, label, sublabel, price, checked, onChange, disabled }: {
  icon: React.ReactNode; label: string; sublabel: string; price: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      className="w-full flex items-center gap-3 p-3.5 rounded border transition-all text-right"
      style={disabled
        ? { borderColor: "rgba(28,27,23,0.08)", background: "var(--ivory-deep)", cursor: "not-allowed" }
        : checked
          ? { borderColor: "var(--gold)", background: "var(--gold-wash)" }
          : { borderColor: "rgba(28,27,23,0.1)", background: "var(--paper)" }}>
      <span className="flex-shrink-0" style={{ color: disabled ? "var(--stone-soft)" : checked ? "var(--gold-deep)" : "var(--stone-soft)" }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: disabled ? "var(--stone-soft)" : "var(--charcoal)" }}>{label}</div>
        <div className="text-xs text-[var(--stone-soft)]">{sublabel}</div>
      </div>
      {disabled
        ? <span className="text-[11px] font-bold flex-shrink-0 text-[var(--gold-deep)]">בקרוב</span>
        : <>
            <span className="text-sm font-bold flex-shrink-0 whitespace-nowrap text-[var(--gold-deep)]">{price}</span>
            <span className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0"
              style={checked ? { background: "var(--gold)", borderColor: "var(--gold)", color: "var(--ink)" } : { borderColor: "rgba(28,27,23,0.2)" }}>{checked && <IconCheck size={12} />}</span>
          </>}
    </button>
  );
}

function RadioOption({ icon, label, sublabel, badge, badgeColor, selected, onClick }: {
  icon: React.ReactNode; label: string; sublabel: string; badge?: string; badgeColor?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="w-full flex items-center gap-3 p-3.5 rounded border transition-all text-right"
      style={selected ? { borderColor: "var(--gold)", background: "var(--gold-wash)" } : { borderColor: "rgba(28,27,23,0.1)", background: "var(--paper)" }}>
      <span className="flex-shrink-0" style={{ color: selected ? "var(--gold-deep)" : "var(--stone-soft)" }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[var(--charcoal)]">{label}</div>
        <div className="text-xs text-[var(--stone-soft)]">{sublabel}</div>
      </div>
      {badge && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: badgeColor }}>{badge}</span>}
      <span className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={selected ? { borderColor: "var(--gold)", background: "var(--gold)", boxShadow: "0 0 0 2px var(--gold-wash)" } : { borderColor: "rgba(28,27,23,0.2)" }} />
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

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ivory)" }}><SkiLoader /></div>;
  if (!a || !b) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ivory)", color: "var(--stone)" }} dir="rtl">השילוב לא נמצא. <a href="/apartments" className="underline mr-1 text-[var(--gold-deep)]">חזרה לדירות</a></div>;

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
    <div className="min-h-screen" style={{ background: "var(--ivory)" }} dir="rtl">
      <header className="border-b sticky top-0 z-30" style={{ background: "var(--paper)", borderColor: "rgba(28,27,23,0.08)" }}>
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/apartments" className="text-sm transition-colors text-[var(--stone)]">→ חזרה לדירות</a>
          <a href="/"><Logo className="h-8" /></a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8 md:py-12">
        <div className="text-center mb-9">
          <span className="eyebrow block mb-3">חבילה משולבת · 2 דירות צמודות</span>
          <h1 className="font-display text-3xl font-medium text-[var(--charcoal)]">{comboName}</h1>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[var(--stone)]">
            <IconMountain size={14} className="text-[var(--gold-deep)]" /> Val Thorens, France · מתאים עד {capacity(a) + capacity(b)} אורחים
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-6 items-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AptBlock a={a} />
            <AptBlock a={b} />
          </div>

          {/* Booking panel */}
          <div className="card-luxury lg:sticky lg:top-24 overflow-hidden">
            <div className="px-6 py-5 border-b" style={{ background: "var(--gold-wash)", borderColor: "rgba(28,27,23,0.08)" }}>
              <div className="flex items-center justify-between gap-2">
                {breakdown.length > 0 && (
                  <button onClick={() => setShowBreakdown(v => !v)}
                    className="text-xs font-bold px-3 py-1.5 rounded transition-colors whitespace-nowrap flex-shrink-0"
                    style={{ color: "var(--gold-deep)", background: "var(--paper)" }}>
                    פירוט מחיר {showBreakdown ? "▲" : "▼"}
                  </button>
                )}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-[var(--stone-soft)]">/ לילה ממוצע</span>
                  <span className="font-display text-3xl font-medium text-[var(--charcoal)]">€{avgNightly.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs mt-1 text-right text-[var(--stone)]">{fmt(checkin)} — {fmt(checkout)} · {nights} לילות · {guests} אורחים</p>

              {showBreakdown && breakdown.length > 0 && (
                <div className="mt-3 rounded border overflow-hidden" style={{ background: "var(--paper)", borderColor: "var(--gold-line)" }}>
                  <div className="px-4 py-2 text-[11px] text-right" style={{ background: "var(--gold-wash)", color: "var(--stone-soft)" }}>מחיר ללילה (שתי הדירות יחד)</div>
                  <div className="max-h-52 overflow-y-auto divide-y" style={{ borderColor: "rgba(28,27,23,0.06)" }}>
                    {breakdown.map(({ date, price }, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-2 text-sm" style={{ borderColor: "rgba(28,27,23,0.06)" }}>
                        <span className="font-semibold text-[var(--charcoal)]">€{price.toLocaleString()}</span>
                        <span className="text-[var(--stone)]">{fmt(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5 border-t text-sm font-bold" style={{ background: "var(--gold-wash)", borderColor: "var(--gold-line)" }}>
                    <span className="text-[var(--gold-deep)]">€{avgNightly.toLocaleString()}</span>
                    <span className="text-[var(--stone)]">ממוצע ללילה</span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider mb-2 text-[var(--stone-soft)]">תוספות</div>
                <div className="flex flex-col gap-2">
                  <AddonCard icon={<IconSkis size={18} />} label="סקי פס · Trois Vallées" sublabel="600 ק״מ מסלולים · כל הרמות · איסוף עצמאי מהמכונה" price="מחיר בקרוב" checked={skiPass} onChange={setSkiPass} disabled />
                  <AddonCard icon={<IconBus size={18} />} label="הסעה הלוך-חזור" sublabel="שאטל ישיר משדה התעופה" price={`+€${TRANSFER_PRICE}`} checked={transfer} onChange={setTransfer} />
                  <AddonCard icon={<IconSkis size={18} />} label="השכרת ציוד סקי/סנובורד" sublabel="€30 ליום · €120 לשבוע · +€20 לכל יום נוסף" price={nights > 0 ? `+€${equipCost(nights)}` : "החל מ-€30"} checked={equipment} onChange={setEquipment} />
                  {transfer && (
                    <button onClick={() => setShowTransfer(true)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded border transition-colors text-sm w-full text-right"
                      style={{ background: "var(--gold-wash)", borderColor: "var(--gold-line)" }}>
                      <span className="font-semibold text-[var(--gold-deep)]">{flightFilled(flight) ? "✓ פרטי טיסה נשמרו · עריכה" : "מלא פרטי טיסה להסעה ←"}</span>
                      <span className="text-xs text-[var(--stone-soft)]">הגעה + חזור</span>
                    </button>
                  )}
                </div>
                <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-2.5 p-3.5 rounded border transition-all hover:border-[var(--gold-line)] hover:bg-[var(--gold-wash)]"
                  style={{ background: "var(--paper)", borderColor: "rgba(28,27,23,0.1)" }}>
                  <span className="flex-shrink-0 text-[var(--stone-soft)]"><IconPlane size={17} /></span>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="text-sm font-semibold text-[var(--charcoal)]">טיסה ל-Geneva (GVA)</div>
                    <div className="text-xs text-[var(--stone-soft)]">TLV → Geneva · {checkin ? fmt(checkin) : "בחר תאריך"} · 2.5h מ-Val Thorens</div>
                  </div>
                  <span className="text-xs font-bold flex-shrink-0 text-[var(--gold-deep)]">Skyscanner ←</span>
                </a>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider mb-2 text-[var(--stone-soft)]">מדיניות ביטול</div>
                <div className="flex flex-col gap-2">
                  <RadioOption icon={<IconShield size={18} />} label="ביטול רגיל" sublabel="בהתאם לתנאי התקנון · מחיר רגיל" selected={cancel === "regular"} onClick={() => setCancel("regular")} />
                  <RadioOption icon={<IconShield size={18} />} label="ללא אפשרות ביטול" sublabel="מחיר מוזל · לא ניתן לבטל ואין החזר כספי" badge={`−€${CANCEL_NONE}`} badgeColor="#ef4444" selected={cancel === "none"} onClick={() => setShowNoCancel(true)} />
                  <RadioOption icon={<IconShield size={18} />} label="ביטול גמיש" sublabel="80% החזר עד שבוע לפני · 50% עד 24ש׳ לפני ההמראה · אח״כ אין החזר" badge={`+€${CANCEL_FLEX}`} badgeColor="#10b981" selected={cancel === "flexible"} onClick={() => setCancel("flexible")} />
                </div>
                <a href="/terms" target="_blank" className="inline-block mt-2 text-xs hover:underline font-semibold text-[var(--gold-deep)]">קרא/י את מדיניות הביטולים בתקנון ←</a>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--stone-soft)]">רמת שירות</div>
                  <button onClick={() => setShowAiInfo(true)} className="text-xs font-semibold hover:underline text-[var(--gold-deep)]">ⓘ מידע נוסף</button>
                </div>
                <div className="flex flex-col gap-2">
                  <RadioOption icon={<IconUser size={18} />} label="שירות אנושי מלא" sublabel="נציג ישראלי זמין לפני, במהלך ואחרי" selected={service === "human"} onClick={() => setService("human")} />
                  <RadioOption icon={<IconBot size={18} />} label="AI בלבד" sublabel="ניהול עצמאי עם תמיכת צ'אטבוט · איסוף עצמאי של הסקי פס" badge={`-€${AI_DISCOUNT}`} badgeColor="#6366f1" selected={service === "ai"} onClick={() => setService("ai")} />
                </div>
              </div>

              <div className="pt-4 space-y-2" style={{ borderTop: "1px solid rgba(28,27,23,0.08)" }}>
                <Row label={a.name} value={`€${totalA.toLocaleString()}`} muted />
                <Row label={b.name} value={`€${totalB.toLocaleString()}`} muted />
                {transfer && <Row label="הסעה הלוך-חזור" value={`€${trTotal}`} muted />}
                {equipment && <Row label={`השכרת ציוד · ${nights} ימים`} value={`€${equipTotal.toLocaleString()}`} muted />}
                {skiPass && <Row label="סקי פס" value="מחיר בקרוב" muted />}
                {cancel === "flexible" && <Row label="ביטול גמיש" value={`€${flexExtra.toLocaleString()}`} muted />}
                {cancel === "none" && <Row label="ללא אפשרות ביטול" value={`−€${CANCEL_NONE.toLocaleString()}`} muted />}
                {service === "ai" && <Row label="הנחת ניהול עצמאי (AI)" value={`-€${AI_DISCOUNT.toLocaleString()}`} muted />}
              </div>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(28,27,23,0.08)" }}>
                <span className="font-bold text-lg text-[var(--charcoal)]">סה״כ</span>
                <span className="font-display text-2xl font-medium text-[var(--gold-deep)]">€{total.toLocaleString()}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[var(--stone-soft)]">* ייתכנו עמלות נוספות (כגון עמלת סליקת אשראי 1.9%). המחירים ב-€ והחיוב בש״ח לפי שער ההמרה.</p>

              <CardPaymentButton
                apartmentId={a.id} apartment={comboName}
                extraApartmentId={b.id} extraApartmentName={b.name}
                checkin={checkin} checkout={checkout} guests={guests} nights={nights}
                skiPass={skiPass} transfer={transfer} equipment={equipment} transferDetails={transferDetails} grandTotal={total} cancel={cancel} service={service}
                label="תשלום מאובטח בכרטיס" />
              <a href={wa} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-medium py-3.5 rounded transition">
                <IconWhatsApp size={20} /> תיאום בוואטסאפ
              </a>
              <button onClick={() => { navigator.clipboard?.writeText("https://skisharebook.com" + window.location.pathname + window.location.search); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="btn-ghost block w-full py-3 text-sm text-[var(--charcoal)]">
                {copied ? "✓ הקישור הועתק" : "📋 שלח הצעת מחיר (העתק קישור)"}
              </button>
              <SaveTripButton apartmentId={a.id} extraApartmentId={b.id} checkin={checkin} checkout={checkout} guests={guests}
                label="שמור לחופשות שלי"
                className="btn-ghost flex items-center justify-center gap-2 w-full py-3 text-sm" />
              <p className="text-center text-xs text-[var(--stone-soft)]">הזמנה אחת לשתי הדירות · תשלום מאובטח PayPlus</p>
            </div>
          </div>
        </div>
      </main>

      {/* Transfer flight details */}
      <FlightDetailsModal open={showTransfer} onClose={() => setShowTransfer(false)} value={flight} onChange={setFlight} />

      {/* No-cancellation confirmation + signature */}
      {showNoCancel && (
        <div dir="rtl" className="fixed inset-0 z-[95] bg-black/55 flex items-center justify-center p-4" onClick={() => setShowNoCancel(false)}>
          <div className="w-full max-w-md p-6 shadow-2xl rounded" style={{ background: "var(--paper)" }} onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-xl font-medium mb-1 text-[var(--charcoal)]">ללא אפשרות ביטול</h2>
            <p className="text-sm mb-4 text-[var(--stone)]">בחירה באפשרות זו מוזילה את המחיר ב-€{CANCEL_NONE}, אך ההזמנה <b>אינה ניתנת לביטול</b> ולא יינתן כל החזר כספי, בהתאם לתקנון.</p>
            <label className="flex items-start gap-2 cursor-pointer mb-4">
              <input type="checkbox" checked={noCancelAgreed} onChange={e => setNoCancelAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[var(--gold)]" />
              <span className="text-sm leading-relaxed text-[var(--stone)]">אני מאשר/ת שקראתי והבנתי כי <b>לא אוכל לבטל את ההזמנה</b> ולא אקבל החזר כספי בשום מקרה, ומסכים/ה ל<a href="/terms" target="_blank" className="underline text-[var(--gold-deep)]">תקנון</a>.</span>
            </label>
            <label className="block text-xs font-bold mb-1 text-[var(--stone-soft)]">חתימה (שם מלא)</label>
            <input value={signature} onChange={e => setSignature(e.target.value)} placeholder="הקלד/י את שמך המלא כחתימה"
              className="w-full border rounded px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              style={{ borderColor: "rgba(28,27,23,0.15)", background: "var(--ivory-deep)", color: "var(--charcoal)" }} />
            <div className="flex gap-2">
              <button disabled={!noCancelAgreed || signature.trim().length < 2}
                onClick={() => { setCancel("none"); setShowNoCancel(false); }}
                className="btn-gold flex-1 disabled:opacity-50 py-3">אישור וחתימה</button>
              <button onClick={() => setShowNoCancel(false)} className="btn-ghost px-5 py-3 text-[var(--stone)]">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* AI service info */}
      {showAiInfo && (
        <div dir="rtl" className="fixed inset-0 z-[95] bg-black/55 flex items-center justify-center p-4" onClick={() => setShowAiInfo(false)}>
          <div className="w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto rounded" style={{ background: "var(--paper)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl font-medium text-[var(--charcoal)]">שירות AI — איך זה עובד?</h2>
              <button onClick={() => setShowAiInfo(false)} className="w-9 h-9 rounded-full transition-colors text-xl text-[var(--stone-soft)]">✕</button>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed text-[var(--stone)]">
              <li className="flex gap-2"><span>📍</span><span>תקבל/י את הכתובת המלאה וחוקי הצ׳ק-אין / צ׳ק-אאוט.</span></li>
              <li className="flex gap-2"><span>🔑</span><span>המפתחות יחכו לך בדלת כ-48 שעות לפני ההגעה. את הדירה יש לפנות לפי שעות הצ׳ק-אאוט הרגילות.</span></li>
              <li className="flex gap-2"><span>🎿</span><span>אם הזמנת סקי פס — תאסוף/י אותו עצמאית מהמכונה במהלך השהות.</span></li>
              <li className="flex gap-2"><span>🤖</span><span>לאורך החופשה תיעזר/י בצ׳אטבוט AI לכל שאלה.</span></li>
              <li className="flex gap-2"><span>🆘</span><span>במקרים חריגים (קבלת דירה עם נזק, מקרה קיצון) תוכל/י כמובן לפנות לנציגים שלנו דרך האתר.</span></li>
            </ul>
            <button onClick={() => setShowAiInfo(false)} className="btn-gold mt-5 w-full py-3">הבנתי</button>
          </div>
        </div>
      )}
    </div>
  );
}

const Row = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm" style={{ color: muted ? "var(--stone-soft)" : "var(--stone)" }}>{label}</span>
    <span className="text-sm" style={muted ? { color: "var(--stone)" } : { fontWeight: 700, color: "var(--charcoal)" }}>{value}</span>
  </div>
);

export default function ComboPage() {
  return <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--ivory)" }} />}><ComboInner /></Suspense>;
}
