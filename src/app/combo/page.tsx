"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Apartment, SkiPass } from "@/types";
import { stayBreakdown, skiDaysFromNights, equipCost } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import CardPaymentButton from "@/components/CardPaymentButton";
import SaveTripButton from "@/components/SaveTripButton";
import TransferChooser from "@/components/TransferChooser";
import type { TransferOption } from "@/lib/transfer-options";
import FlightAddOn from "@/components/FlightAddOn";
import { useDirectFlight, useReturnLeg, time24 } from "@/lib/useFlightPrice";
import { BAGGAGE_PRICE, TROLLEY_PRICE, LIFT_DATES, PASS_AREA_LABEL, liftsOpenForStay, packagePassArea, passTier, shortDate, type PassArea } from "@/lib/deal-pricing";
import FlightDetailsModal, { EMPTY_FLIGHT, flightToString, flightFilled, type Flight } from "@/components/FlightDetailsModal";
import { buildWaHref } from "@/lib/whatsapp";
import { encodeExtras } from "@/lib/quote-extras";
import { codeOf } from "@/lib/transfer-options";
import { IconUser, IconBed, IconWhatsApp, IconSkis, IconBus, IconPlane, IconShield, IconBot, IconCalendar, IconUsers, IconChevronLeft, IconInfo } from "@/components/Icons";
import { btn, card, chip, wrap, EmptyState, PageTop, Check } from "@/components/ui";
import { FormSection, OptionCard, Tag, SumRow, TrustList, MobileBar, IcoLink, IcoX } from "@/components/checkout/Checkout";

const HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmt = (s: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE[d.getMonth()]} ${d.getFullYear()}`; };
const fmtShort = (s: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ב${HE[d.getMonth()]}`; };
const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;

function Stepper({ value, onChange, max, label }: { value: number; onChange: (n: number) => void; max: number; label: string }) {
  const b = "w-10 h-10 rounded-full border border-line-strong bg-white text-ink text-[20px] leading-none flex items-center justify-center transition-colors hover:border-ink disabled:opacity-35 disabled:hover:border-line-strong";
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={label}>
      <button type="button" className={b} onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} aria-label="פחות">−</button>
      <span className="w-8 text-center font-display font-bold text-[18px] text-ink" aria-live="polite">{value}</span>
      <button type="button" className={b} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="עוד">+</button>
    </div>
  );
}
const capacity = (a: Apartment) => a.max_guests || a.beds * 2 || 2;
const TRANSFER_PRICE = 180;
const CANCEL_FLEX = 100; // flexible cancellation surcharge (flat)
const CANCEL_NONE = 100; // no-cancellation discount (flat)
const AI_DISCOUNT = 50;  // per person

function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const imgs = images?.length ? images : ["/hero-ski.jpg"];
  const [idx, setIdx] = useState(0);
  return (
    <div className="relative h-56 md:h-72 bg-soft-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgs[idx]} alt={`${alt}, תמונה ${idx + 1} מתוך ${imgs.length}`} className="w-full h-full object-cover" />
      {imgs.length > 1 && (
        <>
          <button type="button" onClick={() => setIdx((idx - 1 + imgs.length) % imgs.length)} aria-label="התמונה הקודמת"
            className="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-ink">
            <IconChevronLeft size={18} className="rotate-180" />
          </button>
          <button type="button" onClick={() => setIdx((idx + 1) % imgs.length)} aria-label="התמונה הבאה"
            className="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-ink">
            <IconChevronLeft size={18} />
          </button>
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5" aria-hidden="true">
            {imgs.slice(0, 8).map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
          <span className="absolute top-3 left-3 bg-ink/70 text-white rounded-full px-2.5 py-1 text-[12px] font-bold" aria-hidden="true">{idx + 1}/{imgs.length}</span>
        </>
      )}
    </div>
  );
}

function AptBlock({ a, n }: { a: Apartment; n: number }) {
  return (
    <article className={`${card} overflow-hidden`}>
      <div className="relative">
        <Gallery images={a.images} alt={a.name} />
        <span className="absolute top-3 right-3 bg-white text-ink rounded-full px-3 py-1 text-[13px] font-bold">דירה {n}</span>
      </div>
      <div className="p-5 md:p-6 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-display font-bold text-[22px] md:text-[24px] text-ink">{a.name}</h2>
          <span className="text-[15px] text-muted">ואל טורנס, שלושת העמקים{a.type ? ` · ${a.type}` : ""}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={chip}><IconUser size={15} className="text-accent" /> עד {capacity(a)} אנשים</span>
          {a.beds > 0 && <span className={chip}><IconBed size={15} className="text-accent" /> {a.beds} חדרים</span>}
          {a.baths > 0 && <span className={chip}>{a.baths} חדרי רחצה</span>}
          {a.sqm > 0 && <span className={chip}>{a.sqm} מ&quot;ר</span>}
        </div>
        {a.amenities?.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[15px] text-ink">
            {a.amenities.slice(0, 8).map((am, i) => (
              <li key={i} className="flex items-start gap-2"><Check className="mt-[3px]" />{am}</li>
            ))}
          </ul>
        )}
        {a.description && <p className="text-[15px] md:text-[16px] text-body leading-relaxed whitespace-pre-line line-clamp-6">{a.description}</p>}
      </div>
    </article>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div dir="rtl" className="fixed inset-0 z-[95] bg-ink/55 flex items-end sm:items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className="bg-white rounded-card w-full max-w-[460px] p-6 max-h-[88vh] overflow-y-auto" style={{ boxShadow: "0 18px 40px rgba(8,18,38,0.25)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="font-display font-bold text-[21px] text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="סגירה" className="shrink-0 w-10 h-10 -mt-1 -ml-1 rounded-full hover:bg-soft text-muted flex items-center justify-center"><IcoX /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ComboInner() {
  const params = useSearchParams();
  const aId = params.get("a") || "", bId = params.get("b") || "";
  const checkin = params.get("checkin") || "", checkout = params.get("checkout") || "";
  const guests = parseInt(params.get("guests") || "2");
  const nights = checkin && checkout ? Math.round((+new Date(checkout) - +new Date(checkin)) / 86400000) : 0;
  // A stay of N nights only yields N-1 actual ski days (arrival/departure days aren't spent on the slopes)
  const skiDays = skiDaysFromNights(nights);

  const [a, setA] = useState<Apartment | null>(null);
  const [b, setB] = useState<Apartment | null>(null);
  const [rulesA, setRulesA] = useState<PricingRule[]>([]);
  const [rulesB, setRulesB] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [passes, setPasses] = useState<SkiPass[]>([]);
  const [skiPass, setSkiPass] = useState(false);
  const [skiArea, setSkiArea] = useState<PassArea>(packagePassArea(checkin, checkout) ?? "val_thorens");
  const [skiQty, setSkiQty] = useState(guests || 1);
  const [bookFlight, setBookFlight] = useState(false);
  const [bookFlightQty, setBookFlightQty] = useState(guests || 1);
  const [baggage, setBaggage] = useState(false);
  const [baggageQty, setBaggageQty] = useState(guests || 1);
  const [trolley, setTrolley] = useState(false);
  const [trolleyQty, setTrolleyQty] = useState(guests || 1);
  const direct = useDirectFlight(checkin, checkout);
  const directFlight = direct.status === "found" ? direct.flight : null;
  const flightOn = bookFlight && !!directFlight;
  const bagOn = baggage && flightOn;
  const trolleyOn = trolley && flightOn;
  const returnLeg = useReturnLeg(directFlight, checkin, checkout, flightOn);
  const preFlightDone = useRef(false);
  const preFlight = params.get("flight") === "1";
  useEffect(() => {
    if (!preFlight || preFlightDone.current || !directFlight) return;
    preFlightDone.current = true;
    setBookFlight(true); setBookFlightQty(guests || 1); setBaggage(true); setBaggageQty(guests || 1);
  }, [preFlight, directFlight, guests]);
  const [transfer, setTransfer] = useState(false);
  const [equipment, setEquipment] = useState(false);
  const [equipQty, setEquipQty] = useState(guests || 1);
  const [showTransfer, setShowTransfer] = useState(false);
  const [flight, setFlight] = useState<Flight>(EMPTY_FLIGHT);
  const [trPick, setTrPick] = useState<TransferOption | null>(null);
  const [cancel, setCancel] = useState<"regular" | "none" | "flexible">("regular");
  const [showNoCancel, setShowNoCancel] = useState(false);
  const [noCancelAgreed, setNoCancelAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [service, setService] = useState<"human" | "ai">("human");
  const [showAiInfo, setShowAiInfo] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [splitCount, setSplitCount] = useState(1);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [quoteUrl, setQuoteUrl] = useState<string | null>(null);
  const [qCopied, setQCopied] = useState(false);

  useEffect(() => {
    fetch("/api/ski-passes").then(r => r.json()).then(d => { if (Array.isArray(d)) setPasses(d); }).catch(() => {});
  }, []);

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

  if (loading) return <SkiLoader />;
  if (!a || !b) return (
    <div className={`${wrap} max-w-[720px] py-12 md:py-16`}>
      <EmptyState title="השילוב לא נמצא" text="אחת הדירות כבר לא זמינה או שהקישור לא מלא. אפשר לחפש שוב לתאריכים שלכם."
        action={<><Link href="/search" className={btn.primary}>לחיפוש דירות</Link><Link href="/apartments" className={btn.outline}>לכל הדירות</Link></>} />
    </div>
  );

  // each apartment priced like the bots price it (Airbnb calendar + cleaning for ours)
  const stayA = nights > 0 ? stayBreakdown(checkin, checkout, Number(a.price_per_night), rulesA) : null;
  const stayB = nights > 0 ? stayBreakdown(checkin, checkout, Number(b.price_per_night), rulesB) : null;
  const totalA = stayA ? stayA.total : Number(a.price_per_night);
  const totalB = stayB ? stayB.total : Number(b.price_per_night);
  const cleaningFee = (stayA ? stayA.fee : 0) + (stayB ? stayB.fee : 0);
  const trTotal = transfer ? (trPick ? trPick.total : TRANSFER_PRICE) : 0;
  const equipTotal = equipment ? equipCost(skiDays) * equipQty : 0;
  const flexExtra = cancel === "flexible" ? CANCEL_FLEX * Math.max(guests || 1, 1) : 0;
  const noCancelDiscount = cancel === "none" ? -CANCEL_NONE : 0;
  const aiDiscount = service === "ai" ? -AI_DISCOUNT : 0;
  const passOpen = (area: PassArea) => liftsOpenForStay(area, checkin, checkout);
  const tierFor = (area: PassArea) => passTier(passes, area, skiDays);
  const skiTier = tierFor(skiArea);
  const skiOn = skiPass && passOpen(skiArea) && !!skiTier;
  const skiTotal = skiOn && skiTier ? skiTier.price * skiQty : 0;
  const bookFlightTotal = flightOn && directFlight ? directFlight.price * bookFlightQty : 0;
  const baggageTotal = bagOn ? BAGGAGE_PRICE * baggageQty : 0;
  const trolleyTotal = trolleyOn ? TROLLEY_PRICE * trolleyQty : 0;
  const total = totalA + totalB + skiTotal + trTotal + equipTotal + bookFlightTotal + baggageTotal + trolleyTotal + flexExtra + noCancelDiscount + aiDiscount;
  const passLabel = `סקי פס ${PASS_AREA_LABEL[skiArea]}${skiTier ? `, ${skiTier.duration_days} ימים` : ""}`;
  const legText = (label: string, date: string, d: string | null, a: string | null) => `${label} ${fmt(date)}${d && a ? ` ${time24(d)}–${time24(a)}` : ""}`;
  const flightDetails = flightOn && directFlight
    ? [
        `טיסה ישירה הלוך וחזור TLV⇄${directFlight.airport}${directFlight.airline ? ` (${directFlight.airline})` : ""}`,
        legText("הלוך", checkin, directFlight.departTime, directFlight.arriveTime),
        legText("חזור", checkout, returnLeg.leg?.departTime ?? null, returnLeg.leg?.arriveTime ?? null),
        `€${directFlight.price} לאדם × ${bookFlightQty}`,
        bagOn ? `מזוודה €${BAGGAGE_PRICE} × ${baggageQty}` : null,
        trolleyOn ? `טרולי €${TROLLEY_PRICE} × ${trolleyQty}` : null,
      ].filter(Boolean).join(" · ")
    : "";
  // split: the FULL total (both apartments + all add-ons) divided equally between payers
  const payers = Math.min(splitCount, Math.max(guests, 1));
  const shareAmount = Math.round(total / payers);
  const payNow = payers > 1 ? shareAmount : total;
  const comboExtras = encodeExtras({
    ...(skiOn ? { pass: { area: skiArea, qty: skiQty } } : {}),
    ...(transfer ? { transfer: { qty: guests || 1, ...(trPick ? { kind: codeOf(trPick) || undefined } : {}) } } : {}),
    ...(equipment ? { equipment: { qty: equipQty } } : {}),
    ...(flightOn ? { flight: { qty: bookFlightQty } } : {}),
    ...(bagOn ? { bag: { qty: baggageQty } } : {}),
    ...(trolleyOn ? { trolley: { qty: trolleyQty } } : {}),
  });
  const handleSendQuote = async () => {
    setCreatingQuote(true);
    const slug = `${a.name}-${b.name}`.trim().replace(/\s+/g, "-").replace(/[/?#&+]/g, "");
    try {
      const res = await fetch("/api/quotes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartment_id: a.id, extra_apartment_id: b.id, apartment: `${a.name} + ${b.name}`,
          checkin, checkout, guests, nights, ski_pass: skiOn, transfer, equipment, cancel, service,
          apt_total: totalA + totalB, grand_total: total,
        }),
      });
      if (!res.ok) throw new Error("quote");
      const { id: shortId } = await res.json();
      setQuoteUrl(`https://skisharebook.com/q/${encodeURIComponent(slug)}/${shortId}${comboExtras ? `?x=${comboExtras}` : ""}`);
    } catch {
      setQuoteUrl("https://skisharebook.com" + window.location.pathname + window.location.search);
    } finally {
      setCreatingQuote(false);
    }
  };
  const choosePass = (area: PassArea) => {
    if (!passOpen(area)) return;
    if (skiOn && skiArea === area) { setSkiPass(false); return; }
    setSkiArea(area);
    if (!skiOn) { setSkiPass(true); setSkiQty(Math.min(skiQty || 1, guests) || 1); }
  };
  const passPrice = (area: PassArea) => {
    if (!passOpen(area)) return `סגור בתאריכים האלה · פתוח ${shortDate(LIFT_DATES[area][0])}–${shortDate(LIFT_DATES[area][1])}`;
    const t = tierFor(area);
    return t ? `${eur(t.price)} לאדם · ${t.duration_days} ימים` : undefined;
  };
  const maxGuests = Math.max(guests, 1);
  const transferDetails = transfer ? flightToString(flight) : "";
  const comboName = `${a.name} + ${b.name}`;
  const avgNightly = nights > 0 ? Math.round((totalA + totalB - cleaningFee) / nights) : Number(a.price_per_night) + Number(b.price_per_night);
  const breakdown = stayA && stayB && checkin && checkout
    ? stayA.nights.map((n, i) => ({ date: n.date, price: n.price + (stayB.nights[i]?.price ?? 0) }))
    : [] as { date: Date; price: number }[];
  const wa = buildWaHref({
    intro: "היי! אשמח לפרטים על חבילה משולבת של שתי דירות 🎿",
    lines: [
      `דירות: ${comboName}`, `תאריכים: ${fmt(checkin)}–${fmt(checkout)}`, `${guests} אורחים · ${nights} לילות`,
      skiOn ? `🎿 ${passLabel} ל-${skiQty} אנשים (€${skiTotal})` : "", flightOn ? `✈️ ${flightDetails} (€${bookFlightTotal})` : "", bagOn ? `🧳 מזוודה ל-${baggageQty} אנשים (€${baggageTotal})` : "", trolleyOn ? `🧳 טרולי ל-${trolleyQty} אנשים (€${trolleyTotal})` : "", transfer ? `🚐 כולל הסעה${trPick ? `: ${trPick.name} (€${trPick.total})` : ""}${transferDetails ? ` (${transferDetails})` : ""}` : "", equipment ? `🎿 כולל השכרת ציוד ל-${equipQty} אנשים (€${equipTotal})` : "",
      cancel === "flexible" ? "✅ מדיניות ביטול גמישה" : cancel === "none" ? "🔒 ללא אפשרות ביטול" : "", service === "ai" ? "🤖 ניהול עצמאי (AI)" : "",
    ].filter(Boolean),
    total,
  });

  const goToSummary = () => document.getElementById("combo-summary")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const searchHref = `/search?checkin=${checkin}&checkout=${checkout}&guests=${guests}`;

  return (
    <div className="flex-1 bg-white">
      <PageTop
        crumbs={[{ label: "דף הבית", href: "/" }, { label: "חיפוש", href: searchHref }, { label: comboName }]}
        title={comboName}
        sub={`ואל טורנס · שתי דירות צמודות בהזמנה אחת · מתאים עד ${capacity(a) + capacity(b)} אורחים`}
        aside={<>
          <span className={chip}><IconCalendar size={16} className="text-accent" /> {fmtShort(checkin)} עד {fmtShort(checkout)} · {nights} לילות</span>
          <span className={chip}><IconUsers size={16} className="text-accent" /> {guests} אורחים</span>
        </>}
      />

      <div className={`${wrap} pt-5 md:pt-6 pb-12 md:pb-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 items-start`}>
        <div className="flex flex-col gap-6 min-w-0">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <AptBlock a={a} n={1} />
            <AptBlock a={b} n={2} />
          </div>

          <FormSection title="תוספות" sub="מוסיפים לחבילה רק מה שצריך">
            <div className="flex flex-col gap-2.5">
              <OptionCard type="checkbox" selected={skiOn && skiArea === "trois_vallees"} onSelect={() => choosePass("trois_vallees")} disabled={!passOpen("trois_vallees")}
                icon={<IconSkis size={20} />} title="סקי פס שלושת העמקים" sub="600 ק״מ מסלולים, איסוף עצמאי מהמכונה" price={passPrice("trois_vallees")} />
              <OptionCard type="checkbox" selected={skiOn && skiArea === "val_thorens"} onSelect={() => choosePass("val_thorens")} disabled={!passOpen("val_thorens")}
                icon={<IconSkis size={20} />} title="סקי פס ואל טורנס ואורל" sub="המסלולים של הכפר עצמו" price={passPrice("val_thorens")} />
              {skiOn && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-line px-4 py-2.5">
                  <span className="text-[15px] font-medium text-ink">כמה אנשים צריכים סקי פס?</span>
                  <div className="flex items-center gap-3">
                    <Stepper value={skiQty} onChange={setSkiQty} max={maxGuests} label="כמות סקי פס" />
                    <span className="min-w-[68px] text-left font-bold text-[15px] text-ink">{eur(skiTotal)}</span>
                  </div>
                </div>
              )}
              <OptionCard type="checkbox" selected={transfer} onSelect={() => setTransfer(!transfer)}
                icon={<IconBus size={20} />} title="הסעה משדה התעופה" sub={trPick ? `${trPick.name} · לכל הקבוצה` : "רכב פרטי או שאטל משותף, לפי הטיסה"}
                price={transfer && trPick ? `€${trPick.total}` : "להוספה"} />
              {transfer && (
                <TransferChooser pax={guests || 1} outDate={flight.arrDate || checkin} retDate={flight.retDate || checkout}
                  outFlight={flight.arrFlight} retFlight={flight.retFlight}
                  airport={flightOn && directFlight ? directFlight.airport : null}
                  value={trPick?.key ?? null} onChange={setTrPick} onFlightClick={() => setShowTransfer(true)} />
              )}
              {transfer && (
                <button type="button" onClick={() => setShowTransfer(true)}
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-dashed border-accent bg-accent-soft px-4 min-h-[56px] text-start">
                  <span className="flex items-center gap-2.5 text-[15px] font-bold text-accent">
                    <IconPlane size={18} />
                    {flightFilled(flight) ? "פרטי הטיסה נשמרו · עריכה" : "למילוי פרטי הטיסה להסעה"}
                  </span>
                  <span className="text-[13px] text-muted shrink-0">הגעה וחזור</span>
                </button>
              )}
              <OptionCard type="checkbox" selected={equipment} onSelect={() => { const v = !equipment; setEquipment(v); if (v) setEquipQty(guests || 1); }}
                icon={<IconSkis size={20} />} title="השכרת ציוד סקי או סנובורד" sub="€30 ליום · €120 לשבוע · +€20 לכל יום נוסף"
                price={skiDays > 0 ? `€${equipCost(skiDays)} לאדם` : "החל מ-€30"} />
              {equipment && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-line px-4 py-2.5">
                  <span className="text-[15px] font-medium text-ink">כמה אנשים צריכים ציוד?</span>
                  <div className="flex items-center gap-3">
                    <Stepper value={equipQty} onChange={setEquipQty} max={maxGuests} label="כמות ציוד" />
                    <span className="min-w-[68px] text-left font-bold text-[15px] text-ink">{eur(equipTotal)}</span>
                  </div>
                </div>
              )}
              <FlightAddOn state={direct} ret={returnLeg} checkin={checkin} checkout={checkout}
                checked={flightOn}
                onToggle={v => { setBookFlight(v); if (v) { setBookFlightQty(guests || 1); setBaggage(true); setBaggageQty(guests || 1); } }}
                qty={bookFlightQty} setQty={n => { setBaggageQty(b => (b === bookFlightQty || b > n ? n : b)); setTrolleyQty(b => (b > n ? n : b)); setBookFlightQty(n); }} maxQty={maxGuests} total={bookFlightTotal}
                bag={{ on: bagOn, unit: BAGGAGE_PRICE, qty: baggageQty, setQty: setBaggageQty, total: baggageTotal,
                  toggle: () => { const v = !baggage; setBaggage(v); if (v) setBaggageQty(Math.min(baggageQty || guests, guests) || 1); } }}
                trolley={{ on: trolleyOn, unit: TROLLEY_PRICE, qty: trolleyQty, setQty: setTrolleyQty, total: trolleyTotal,
                  toggle: () => { const v = !trolley; setTrolley(v); if (v) setTrolleyQty(Math.min(trolleyQty || bookFlightQty, bookFlightQty) || 1); } }} />
            </div>
          </FormSection>

          <FormSection title="מדיניות ביטול">
            <div role="radiogroup" aria-label="מדיניות ביטול" className="flex flex-col gap-2.5">
              <OptionCard selected={cancel === "regular"} onSelect={() => setCancel("regular")}
                icon={<IconShield size={20} />} title="ביטול רגיל" sub="לפי תנאי התקנון, במחיר הרגיל" />
              <OptionCard selected={cancel === "none"} onSelect={() => setShowNoCancel(true)}
                icon={<IconShield size={20} />} title="ללא אפשרות ביטול" badge={<Tag tone="danger">{`−€${CANCEL_NONE}`}</Tag>}
                sub="מחיר מוזל, אי אפשר לבטל ואין החזר כספי" />
              <OptionCard selected={cancel === "flexible"} onSelect={() => setCancel("flexible")}
                icon={<IconShield size={20} />} title="ביטול גמיש" badge={<Tag tone="ok">{`+€${CANCEL_FLEX} לאדם`}</Tag>}
                sub="80% החזר עד שבוע לפני, 50% עד 24 שעות לפני ההמראה, אחר כך אין החזר" />
            </div>
            <Link href="/terms" target="_blank" className={`${btn.link} mt-3 text-[15px]`}>למדיניות הביטולים בתקנון ←</Link>
          </FormSection>

          <FormSection title="רמת שירות">
            <div role="radiogroup" aria-label="רמת שירות" className="flex flex-col gap-2.5">
              <OptionCard selected={service === "human"} onSelect={() => setService("human")}
                icon={<IconUser size={20} />} title="שירות אנושי מלא" sub="נציג ישראלי זמין לפני, במהלך ואחרי" />
              <OptionCard selected={service === "ai"} onSelect={() => setService("ai")}
                icon={<IconBot size={20} />} title="AI בלבד" badge={<Tag tone="accent">{`−€${AI_DISCOUNT}`}</Tag>}
                sub="ניהול עצמאי עם תמיכת צ'אטבוט, איסוף עצמאי של הסקי פס" />
            </div>
            <button type="button" onClick={() => setShowAiInfo(true)} className={`${btn.link} mt-3 text-[15px]`}>
              <IconInfo size={16} /> איך עובד שירות AI?
            </button>
          </FormSection>
        </div>

        {/* ── summary + payment ───────────────────────────── */}
        <aside id="combo-summary" aria-label="סיכום והזמנה" className="scroll-mt-[76px] lg:sticky lg:top-[96px]">
          <div className={`${card} p-5 md:p-6 flex flex-col gap-4`} style={{ boxShadow: "0 16px 40px rgba(11,27,51,0.08)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[18px] text-ink">החבילה שלכם</span>
                <span className="text-[14px] text-muted">{fmt(checkin)} עד {fmt(checkout)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-display font-extrabold text-[24px] leading-none text-ink">€{avgNightly.toLocaleString()}</span>
                <span className="text-[13px] text-muted mt-1">ללילה בממוצע</span>
              </div>
            </div>

            {breakdown.length > 0 && (
              <div>
                <button type="button" onClick={() => setShowBreakdown(v => !v)} aria-expanded={showBreakdown}
                  className={`${btn.link} text-[14px]`}>
                  {showBreakdown ? "להסתיר את הפירוט" : "פירוט לפי לילות"}
                  <span aria-hidden="true" className={`transition-transform ${showBreakdown ? "rotate-180" : ""}`}>⌄</span>
                </button>
                {showBreakdown && (
                  <div className="mt-2 rounded-2xl border border-line overflow-hidden">
                    <div className="px-4 py-2 bg-soft text-[13px] text-muted">מחיר ללילה, שתי הדירות יחד</div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-line">
                      {breakdown.map(({ date, price }, i) => (
                        <div key={i} className="flex justify-between items-center px-4 py-2 text-[14px]">
                          <span className="text-body">{fmt(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`)}</span>
                          <span className="font-bold text-ink">€{price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    {cleaningFee > 0 && (
                      <div className="flex justify-between items-center px-4 py-2 text-[14px] border-t border-line">
                        <span className="text-body">ניקיון (פעם אחת)</span>
                        <span className="font-bold text-ink">€{cleaningFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center px-4 py-2.5 bg-accent-soft border-t border-line text-[14px] font-bold">
                      <span className="text-ink">ממוצע ללילה</span>
                      <span className="text-accent">€{avgNightly.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-line pt-4 flex flex-col gap-2.5">
              <SumRow label={a.name} value={`€${totalA.toLocaleString()}`} />
              <SumRow label={b.name} value={`€${totalB.toLocaleString()}`} />
              {transfer && <SumRow label="הסעה הלוך וחזור" value={`€${trTotal}`} />}
              {equipment && <SumRow label={`השכרת ציוד · ${skiDays} ימים × ${equipQty}`} value={`€${equipTotal.toLocaleString()}`} />}
              {skiOn && <SumRow label={`${passLabel} × ${skiQty}`} value={eur(skiTotal)} />}
              {flightOn && directFlight && <SumRow label={`טיסה ישירה ל${directFlight.city} × ${bookFlightQty}`} value={eur(bookFlightTotal)} />}
              {bagOn && <SumRow label={`מזוודה לבטן × ${baggageQty}`} value={eur(baggageTotal)} />}
              {trolleyOn && <SumRow label={`טרולי × ${trolleyQty}`} value={eur(trolleyTotal)} />}
              {cancel === "flexible" && <SumRow label="ביטול גמיש" value={`€${flexExtra.toLocaleString()}`} />}
              {cancel === "none" && <SumRow label="ללא אפשרות ביטול" value={`−€${CANCEL_NONE.toLocaleString()}`} tone="ok" />}
              {service === "ai" && <SumRow label="הנחת ניהול עצמאי (AI)" value={`−€${AI_DISCOUNT.toLocaleString()}`} tone="ok" />}
            </div>
            <div className="border-t border-line pt-4 flex items-baseline justify-between gap-3">
              <span className="text-[15px] text-muted">סה״כ לכל החבורה</span>
              <span className="font-display font-extrabold text-[34px] leading-none text-ink">€{total.toLocaleString()}</span>
            </div>
            <p className="text-[13px] text-muted leading-relaxed">ייתכנו עמלות נוספות (למשל עמלת סליקת אשראי של 1.9%). המחירים ביורו, והחיוב בשקלים לפי שער ההמרה.</p>

            {guests > 1 && (
              <div className="rounded-2xl bg-soft px-4 py-3 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-[15px] text-ink">כמה משלמים?</span>
                  <Stepper value={payers} onChange={setSplitCount} max={guests} label="כמה משלמים" />
                </div>
                {payers > 1 && (
                  <div className="rounded-xl bg-white border border-line px-3.5 py-3 text-[14px]">
                    <div className="flex justify-between font-bold text-ink text-[15px]">
                      <span>החלק שלכם לתשלום עכשיו</span>
                      <span>{eur(payNow)}</span>
                    </div>
                    <p className="text-muted mt-1 leading-relaxed">הסה&quot;כ ({eur(total)}) מתחלק שווה ל-{payers}. אחרי התשלום תקבלו קישור לשלוח לחברים.</p>
                  </div>
                )}
              </div>
            )}

            <CardPaymentButton
              apartmentId={a.id} apartment={comboName}
              extraApartmentId={b.id} extraApartmentName={b.name}
              checkin={checkin} checkout={checkout} guests={guests} nights={nights}
              skiPass={skiOn} transfer={transfer} equipment={equipment} transferDetails={transferDetails}
              flight={flightOn} flightPrice={bookFlightTotal + baggageTotal + trolleyTotal} flightDetails={flightDetails} grandTotal={payNow} cancel={cancel} service={service}
              split={payers > 1 ? { sharesTotal: payers, accommodationTotal: total, shareAmount, area: "Val Thorens, Trois Vallées" } : undefined}
              className={`${btn.primaryLg} w-full`}
              label={payers > 1 ? "לשלם את החלק שלכם בכרטיס" : "תשלום מאובטח בכרטיס"} />
            <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn.outline} w-full`}>
              <span className="text-[#128C4B]"><IconWhatsApp size={18} /></span> תיאום בוואטסאפ
            </a>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={handleSendQuote} disabled={creatingQuote}
                className="flex items-center justify-center gap-1.5 min-h-[46px] px-2 rounded-xl border border-line hover:border-line-strong bg-white text-ink text-[14px] font-bold transition-colors whitespace-nowrap disabled:opacity-45">
                {creatingQuote ? "רגע…" : "הצעת מחיר"}
              </button>
              <button type="button" onClick={() => { navigator.clipboard?.writeText("https://skisharebook.com" + window.location.pathname + window.location.search); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center justify-center gap-1.5 min-h-[46px] px-2 rounded-xl border border-line hover:border-line-strong bg-white text-ink text-[14px] font-bold transition-colors whitespace-nowrap" aria-live="polite">
                <IcoLink size={16} /> {copied ? "הועתק" : "שיתוף"}
              </button>
              <SaveTripButton apartmentId={a.id} extraApartmentId={b.id} checkin={checkin} checkout={checkout} guests={guests}
                label="שמירה"
                className="flex items-center justify-center gap-1.5 min-h-[46px] px-2 rounded-xl border border-line hover:border-line-strong bg-white text-ink text-[14px] font-bold transition-colors whitespace-nowrap" />
            </div>
            <TrustList items={[
              "הזמנה אחת לשתי הדירות",
              "כל אחד יכול לשלם את החלק שלו",
              "תשלום מאובטח דרך PayPlus",
              "אפשר לבחור ביטול גמיש",
            ]} />
          </div>
        </aside>
      </div>

      <MobileBar>
        <div className="flex flex-col min-w-0">
          <span className="font-display font-extrabold text-[22px] leading-none text-ink">€{total.toLocaleString()}</span>
          <span className="text-[13px] text-muted mt-1">{nights} לילות · {guests} אורחים</span>
        </div>
        <button type="button" onClick={goToSummary} className={`${btn.primary} flex-1`}>להזמנה</button>
      </MobileBar>

      {quoteUrl && (
        <Dialog title="הצעת המחיר מוכנה" onClose={() => setQuoteUrl(null)}>
          <div className="flex flex-col gap-3">
            <p className="text-[14px] text-muted">הצעה לשתי הדירות יחד, עם כל מה שבחרתם. אפשר לשלוח אותה לחברים.</p>
            <div className="flex gap-2">
              <input readOnly value={quoteUrl} dir="ltr" className="w-full min-h-[48px] rounded-xl border border-line-strong px-3 text-[14px] text-right bg-soft min-w-0" onFocus={e => e.currentTarget.select()} />
              <button type="button" onClick={() => { navigator.clipboard?.writeText(quoteUrl); setQCopied(true); setTimeout(() => setQCopied(false), 2000); }} className={`${btn.primary} px-5 shrink-0`}>
                {qCopied ? "הועתק" : "העתקה"}
              </button>
            </div>
            <a href={`https://wa.me/?text=${encodeURIComponent(`הצעת מחיר ל-${a.name} + ${b.name} 🎿\n${quoteUrl}`)}`} target="_blank" rel="noopener noreferrer" className={`${btn.outline} w-full`}>
              <span className="text-[#128C4B]"><IconWhatsApp size={18} /></span> שליחה בוואטסאפ
            </a>
            <a href={quoteUrl} target="_blank" rel="noopener noreferrer" className={`${btn.outline} w-full`}>לפתוח</a>
          </div>
        </Dialog>
      )}

      {/* Transfer flight details */}
      <FlightDetailsModal open={showTransfer} onClose={() => setShowTransfer(false)} value={flight} onChange={setFlight} />

      {/* No-cancellation confirmation + signature */}
      {showNoCancel && (
        <Dialog title="ללא אפשרות ביטול" onClose={() => setShowNoCancel(false)}>
          <p className="text-[15px] text-body leading-relaxed mb-4">
            האפשרות הזו מוזילה את המחיר ב-€{CANCEL_NONE}, אבל ההזמנה <b className="text-ink">לא ניתנת לביטול</b> ולא יינתן החזר כספי, לפי התקנון.
          </p>
          <label className="flex items-start gap-3 cursor-pointer mb-4 rounded-2xl border border-line p-3.5">
            <input type="checkbox" checked={noCancelAgreed} onChange={e => setNoCancelAgreed(e.target.checked)} className="mt-0.5 w-5 h-5 shrink-0 accent-[#1652F0]" />
            <span className="text-[14px] text-body leading-relaxed">
              קראתי והבנתי ש<b className="text-ink">אי אפשר לבטל את ההזמנה</b> ושלא יינתן החזר כספי בשום מקרה, וה<Link href="/terms" target="_blank" className="font-bold text-accent">תקנון</Link> מקובל עליי.
            </span>
          </label>
          <label htmlFor="no-cancel-sign" className="block text-[14px] font-bold text-ink mb-1.5">חתימה (שם מלא)</label>
          <input id="no-cancel-sign" value={signature} onChange={e => setSignature(e.target.value)} placeholder="השם המלא שלכם, כחתימה"
            className="w-full min-h-[48px] rounded-xl border border-line-strong bg-white px-4 text-[16px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 mb-5" />
          <div className="flex gap-2">
            <button type="button" disabled={!noCancelAgreed || signature.trim().length < 2}
              onClick={() => { setCancel("none"); setShowNoCancel(false); }}
              className={`${btn.primary} flex-1`}>אישור וחתימה</button>
            <button type="button" onClick={() => setShowNoCancel(false)} className={btn.outline}>ביטול</button>
          </div>
        </Dialog>
      )}

      {/* AI service info */}
      {showAiInfo && (
        <Dialog title="שירות AI, איך זה עובד?" onClose={() => setShowAiInfo(false)}>
          <ul className="flex flex-col gap-3 text-[15px] text-body leading-relaxed">
            {[
              "מקבלים את הכתובת המלאה ואת שעות הצ׳ק-אין והצ׳ק-אאוט.",
              "המפתחות מחכים בדלת כ-48 שעות לפני ההגעה. מפנים את הדירה לפי שעות הצ׳ק-אאוט הרגילות.",
              "מי שהזמין סקי פס אוסף אותו בעצמו מהמכונה במהלך השהות.",
              "לאורך החופשה עונה צ׳אטבוט AI על כל שאלה.",
              "במקרים חריגים (נזק בדירה, מקרה קיצון) אפשר תמיד לפנות לנציגים שלנו דרך האתר.",
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2.5"><Check className="mt-[4px]" /><span>{t}</span></li>
            ))}
          </ul>
          <button type="button" onClick={() => setShowAiInfo(false)} className={`${btn.primary} w-full mt-5`}>הבנתי</button>
        </Dialog>
      )}
    </div>
  );
}

export default function ComboPage() {
  return <Suspense fallback={<SkiLoader />}><ComboInner /></Suspense>;
}
