"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Apartment, SkiPass } from "@/types";
import { IconSkis, IconBus, IconPlane, IconShield, IconUser, IconBot, IconCalendar, IconUsers, IconMinus, IconPlus } from "@/components/Icons";
import { btn, chip, field, fieldLabel, wrap, PageTop, EmptyState } from "@/components/ui";
import { FormSection, OptionCard, Tag, SumRow, Note, TrustList, MobileBar, StatusCard, IcoLock, Ltr } from "@/components/checkout/Checkout";

/* ── Constants ──────────────────────────────────────────────── */
const TRANSFER_PP  = 90; // per person per direction
const FLEXIBLE_PP  = 100;
const AI_DISC_PP   = 50;

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate  = (s: string) => { if (!s) return ""; const d = new Date(s); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtShort = (s: string) => { if (!s) return ""; const d = new Date(s); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`; };
const nightsN  = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
const fmtSky   = (s: string) => { const d = new Date(s); return `${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`; };
const orderRef = (id: string) => `VT-${id.replace(/-/g,"").slice(0,6).toUpperCase()}`;

/* ── Signature pad ─────────────────────────────────────────── */
function SignaturePad({ onChange }: { onChange: (v: string) => void }) {
  const ref   = useRef<HTMLCanvasElement>(null);
  const down  = useRef(false);
  const empty = useRef(true);

  const getXY = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = ref.current!;
    const rect   = canvas.getBoundingClientRect();
    const src    = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: (src.clientX - rect.left) * (canvas.width / rect.width), y: (src.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    down.current  = true;
    empty.current = false;
    const ctx = ref.current!.getContext("2d")!;
    const { x, y } = getXY(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!down.current) return;
    e.preventDefault();
    const ctx = ref.current!.getContext("2d")!;
    ctx.strokeStyle = "#0B1B33";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    const { x, y } = getXY(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    down.current = false;
    if (!empty.current) onChange(ref.current!.toDataURL());
  };

  const clear = () => {
    const canvas = ref.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    empty.current = true;
    onChange("");
  };

  return (
    <div className="relative border-2 border-dashed border-line-strong rounded-2xl overflow-hidden bg-soft" style={{ touchAction: "none" }}>
      <canvas ref={ref} width={400} height={100} className="w-full h-28 cursor-crosshair" aria-label="משטח חתימה"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
      <button type="button" onClick={clear}
        className="absolute top-2 left-2 min-h-[32px] px-3 rounded-lg border border-line bg-white text-[13px] font-bold text-muted hover:text-danger transition-colors">
        ניקוי
      </button>
      <span className="absolute bottom-1.5 right-3 text-[13px] text-muted/70 select-none pointer-events-none">חתימה</span>
    </div>
  );
}

/* ── Small pieces ──────────────────────────────────────────── */
function Field({ id, label, children, hint }: { id: string; label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabel}>{label}</label>
      {children}
      {hint && <p className="text-[13px] text-muted mt-1">{hint}</p>}
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: readonly (readonly [T, string])[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1 p-1 rounded-[14px] bg-white border border-line">
      {options.map(([k, text]) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} onClick={() => onChange(k)}
          className={`min-h-[44px] rounded-[10px] text-[14px] md:text-[15px] font-bold transition-colors ${value === k ? "bg-ink text-white" : "text-ink hover:bg-soft"}`}>
          {text}
        </button>
      ))}
    </div>
  );
}

/* ── Confirmation screen ───────────────────────────────────── */
function Confirmation({ bookingId, apt, checkin, checkout, guests, nights, skiPass, transfer, cancel, service, total, details, skyscannerUrl }: {
  bookingId: string; apt: Apartment | null; checkin: string; checkout: string; guests: number; nights: number;
  skiPass: SkiPass | null; transfer: boolean; cancel: string; service: string; total: number;
  details: { name: string; email: string; phone: string }; skyscannerUrl: string;
}) {
  return (
    <StatusCard tone="ok" title="ההזמנה התקבלה"
      actions={<>
        <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer" className={btn.primary}>
          <IconPlane size={18} /> חיפוש טיסה לז&apos;נבה
        </a>
        <Link href="/" className={btn.outline}>חזרה לדף הבית</Link>
      </>}>
      <span className={chip}>הזמנה מספר <b dir="ltr" className="font-bold text-accent">{orderRef(bookingId)}</b></span>

      <div className="w-full text-start border border-line rounded-2xl overflow-hidden">
        <div className="bg-ink text-white px-5 py-4">
          <div className="text-[13px] text-white/70">SkiShare · ואל טורנס</div>
          <div className="font-display font-bold text-[20px]">{apt?.name ?? "דירה"}</div>
          <div className="text-[14px] text-white/85 mt-0.5">{fmtShort(checkin)} עד {fmtShort(checkout)} · {nights} לילות · {guests} אנשים</div>
        </div>
        <div className="px-5 py-4 flex flex-col gap-2.5">
          <SumRow label="שם" value={details.name} />
          <SumRow label="אימייל" value={<span dir="ltr">{details.email}</span>} />
          {details.phone && <SumRow label="טלפון" value={<span dir="ltr">{details.phone}</span>} />}
          <SumRow label="הגעה" value={fmtDate(checkin)} />
          <SumRow label="יציאה" value={fmtDate(checkout)} />
          {skiPass && <SumRow label="סקי פס" value={`${skiPass.name} × ${guests}`} />}
          {transfer && <SumRow label="הסעה" value="כלול" />}
          <SumRow label="מדיניות ביטול" value={cancel === "flexible" ? "גמישה (80% החזר)" : "לא ניתן לביטול"} />
          <SumRow label="שירות" value={service === "ai" ? "AI בלבד" : "שירות אנושי"} />
          <div className="border-t border-line pt-3 mt-1">
            <SumRow strong label="סה״כ" value={<span className="font-display font-extrabold text-[22px]">€{total.toLocaleString()}</span>} />
          </div>
        </div>
      </div>

      <Note tone="warn" className="w-full text-start">
        <b>הצעת המחיר תקפה ל-24 שעות.</b> תוך 24 שעות נציג SkiShare יחזור אליכם עם אישור הזמנה סופי.
      </Note>
    </StatusCard>
  );
}

/* ── Main book page ────────────────────────────────────────── */
function BookPage() {
  const params    = useSearchParams();
  const aptId     = params.get("apartment_id") ?? "";
  const aptName   = params.get("apartment") ?? "";
  const checkin   = params.get("checkin") ?? "";
  const checkout  = params.get("checkout") ?? "";
  const guests    = parseInt(params.get("guests") ?? "2");
  const initCancel  = (params.get("cancel") as "none" | "flexible") ?? "none";
  const initService = (params.get("service") as "human" | "ai") ?? "human";

  const nights = checkin && checkout ? nightsN(checkin, checkout) : 0;
  const skyscannerUrl = checkin && checkout
    ? `https://www.skyscanner.co.il/transport/flights/tlv/gva/${fmtSky(checkin)}/${fmtSky(checkout)}/?adultsv2=${guests}&cabinclass=economy&childrenv2=&rtn=1`
    : `https://www.skyscanner.co.il/transport/flights/tlv/gva/`;

  /* ── State ───────────────────────────────────────────────── */
  const [apt,        setApt]        = useState<Apartment | null>(null);
  const [skiPasses,  setSkiPasses]  = useState<SkiPass[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Selections
  const [selectedPass, setSelectedPass]   = useState<string | null>(null);
  const [transfer,     setTransfer]       = useState(params.get("transfer") === "true");
  const [cancel,       setCancel]         = useState<"none" | "flexible">(initCancel);
  const [service,      setService]        = useState<"human" | "ai">(initService);

  // Transfer details
  const [isElAlChecked, setIsElAlChecked] = useState(false);
  const [tDirection,  setTDirection]  = useState<"both"|"outbound"|"return">("both");
  const [tPassengers, setTPassengers] = useState(guests);
  const [tAirportIn,  setTAirportIn]  = useState("GVA");
  const [tArrival,    setTArrival]    = useState("");
  const [tFlightIn,   setTFlightIn]   = useState("");
  const [tAirportOut, setTAirportOut] = useState("GVA");
  const [tDeparture,  setTDeparture]  = useState("");
  const [tFlightOut,  setTFlightOut]  = useState("");

  // Personal details
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Payment
  const [cardNum,    setCardNum]    = useState("");
  const [cardName,   setCardName]   = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv,    setCardCvv]    = useState("");
  const [signature,  setSignature]  = useState("");
  const [terms,      setTerms]      = useState(false);

  // Submission
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  /* ── Load data ───────────────────────────────────────────── */
  useEffect(() => {
    const loadApt = aptId
      ? fetch(`/api/apartments/${aptId}`).then(r => r.json())
      : fetch("/api/apartments").then(r => r.json()).then((list: Apartment[]) =>
          list.find(a => a.name === aptName || a.id === aptName) ?? null);

    Promise.all([
      loadApt,
      fetch("/api/ski-passes").then(r => r.json()),
    ]).then(([aptData, passes]) => {
      setApt(aptData);
      const adultPasses = Array.isArray(passes) ? passes.filter((p: SkiPass) => p.type === "adult") : [];
      setSkiPasses(adultPasses);
      setLoading(false);
    });
  }, [aptId, aptName]);

  /* ── Constraint: flexible + AI not allowed ───────────────── */
  const setCancelSafe = (v: "none" | "flexible") => {
    setCancel(v);
    if (v === "flexible") setService("human");
  };
  const setServiceSafe = (v: "human" | "ai") => {
    setService(v);
    if (v === "ai") setCancel("none");
  };

  /* ── Price ───────────────────────────────────────────────── */
  const skiPass    = skiPasses.find(p => p.id === selectedPass);
  const aptPrice   = apt ? apt.price_per_night * nights : 0;
  const skiPrice   = 0; // price TBD — quoted separately
  const tDirs      = tDirection === "both" ? 2 : 1;
  const trPrice    = transfer && isElAlChecked ? TRANSFER_PP * tDirs * tPassengers : 0;
  const flexPrice  = cancel === "flexible" ? FLEXIBLE_PP * guests : 0;
  const aiDisc     = service === "ai" ? -(AI_DISC_PP * guests) : 0;
  const subtotal   = aptPrice + skiPrice + trPrice + flexPrice + aiDisc;
  const total      = subtotal;

  /* ── Card formatting ─────────────────────────────────────── */
  const fmtCard   = (v: string) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExpiry = (v: string) => { const d = v.replace(/\D/g,"").slice(0,4); return d.length >= 3 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };

  /* ── Submit ──────────────────────────────────────────────── */
  const submit = async () => {
    if (!name || !email) { setError("נא למלא שם ואימייל"); return; }
    if (!terms) { setError("נא לאשר את התקנון"); return; }
    if (transfer && (!tArrival || !tDeparture)) { setError("נא למלא פרטי טיסה להסעה"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartment_id: apt?.id ?? aptId ?? null,
          check_in: checkin,
          check_out: checkout,
          guests,
          total_price: total,
          status: "pending",
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          add_ons: {
            ski_pass: !!selectedPass,
            ski_pass_name: skiPass?.name,
            ski_pass_days: skiPass?.duration_days,
            transfer,
            transfer_is_elal: transfer ? isElAlChecked : null,
            transfer_airport_in: transfer ? tAirportIn : null,
            transfer_arrival: transfer ? tArrival : null,
            transfer_flight_in: transfer ? tFlightIn : null,
            transfer_airport_out: transfer ? tAirportOut : null,
            transfer_departure: transfer ? tDeparture : null,
            transfer_flight_out: transfer ? tFlightOut : null,
            cancel_policy: cancel,
            service_level: service,
          },
          notes,
        }),
      });
      if (!res.ok) throw new Error("שגיאה בשמירת ההזמנה");
      const booking = await res.json();
      setConfirmedId(booking.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Confirmation ────────────────────────────────────────── */
  if (confirmedId) return (
    <Confirmation
      bookingId={confirmedId} apt={apt} checkin={checkin} checkout={checkout}
      guests={guests} nights={nights} skiPass={skiPass ?? null}
      transfer={transfer} cancel={cancel} service={service} total={total}
      details={{ name, email, phone }} skyscannerUrl={skyscannerUrl}
    />
  );

  if (loading) return <SkiLoader />;

  // no apartment in the link (or it no longer exists): there is nothing to book
  if (!apt) return (
    <div className={`${wrap} max-w-[720px] py-12 md:py-16`}>
      <EmptyState title="לא נבחרה דירה"
        text="כדי להשלים הזמנה צריך לבחור דירה ותאריכים. אפשר לחפש לפי התאריכים שלכם."
        action={<><Link href="/search" className={btn.primary}>לחיפוש דירות</Link><Link href="/apartments" className={btn.outline}>לכל הדירות</Link></>} />
    </div>
  );

  // the summary's button runs the same checks; when something is missing it
  // brings the visitor to the message above the main button
  const submitFromSummary = () => {
    const blocked = !name || !email || !terms || (transfer && (!tArrival || !tDeparture));
    submit();
    if (blocked) setTimeout(() => {
      const el = document.getElementById("book-error") ?? document.getElementById("book-pay");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const aptHref = apt ? `/apartments/${apt.id}?checkin=${checkin}&checkout=${checkout}&guests=${guests}` : undefined;
  const stayLine = `${fmtShort(checkin)} עד ${fmtShort(checkout)} · ${nights} לילות · ${guests} אנשים`;

  const priceLines = (
    <div className="flex flex-col gap-2.5">
      <SumRow label={`€${apt?.price_per_night ?? 0} × ${nights} לילות`} value={`€${aptPrice.toLocaleString()}`} />
      {skiPass && <SumRow label={`${skiPass.name} × ${guests}`} value="הצעת מחיר בנפרד" tone="warn" />}
      {transfer && (
        isElAlChecked
          ? <SumRow label={`הסעה × ${tPassengers} × ${tDirs} כיוונים`} value={`€${trPrice.toLocaleString()}`} />
          : <SumRow label={`הסעה × ${tPassengers} × ${tDirs} כיוונים`} value="הצעת מחיר בנפרד" tone="warn" />
      )}
      {cancel === "flexible" && <SumRow label={`ביטול גמיש × ${guests}`} value={`€${flexPrice.toLocaleString()}`} />}
      {service === "ai" && <SumRow label={`הנחת AI × ${guests}`} value={`−€${Math.abs(aiDisc).toLocaleString()}`} tone="ok" />}
    </div>
  );

  const passAreas = (["val_thorens", "trois_vallees", null] as const)
    .map(area => ({
      area,
      label: area === "val_thorens" ? "ואל טורנס ואורל" : area === "trois_vallees" ? "שלושת העמקים" : "ילדים",
      passes: skiPasses.filter(p => p.area === area).sort((a, b) => a.duration_days - b.duration_days),
    }))
    .filter(g => g.passes.length > 0);

  return (
    <div className="flex-1 bg-soft">
      <PageTop
        crumbs={[{ label: "דף הבית", href: "/" }, ...(apt ? [{ label: apt.name, href: aptHref }] : []), { label: "השלמת הזמנה" }]}
        title="השלמת הזמנה"
        sub={apt ? `${apt.name} · ${stayLine}` : stayLine}
        aside={<span className={`${chip} bg-white`}><IcoLock size={16} /> הזמנה מאובטחת</span>}
      />

      <div className={`${wrap} pt-5 md:pt-6 pb-12 md:pb-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 lg:gap-7 items-start`}>

        {/* phone and tablet: the order at the top, the price lines fold open */}
        {apt && (
          <div className="lg:hidden bg-white border border-line rounded-card overflow-hidden">
            <div className="flex gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={apt.images?.[0] ?? "/apt1.jpg"} alt={apt.name} className="w-24 h-20 rounded-xl object-cover shrink-0" />
              <div className="min-w-0 flex flex-col justify-center gap-1">
                <div className="font-display font-bold text-[18px] text-ink truncate">{apt.name}</div>
                <div className="text-[14px] text-muted">{stayLine}</div>
              </div>
            </div>
            <details className="group border-t border-line">
              <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 min-h-[52px]">
                <span className="text-[15px] font-bold text-ink">פירוט המחיר</span>
                <span className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-[20px] text-ink">€{total.toLocaleString()}</span>
                  <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">⌄</span>
                </span>
              </summary>
              <div className="px-4 pb-4 pt-1">{priceLines}</div>
            </details>
          </div>
        )}

        {/* ── the form ─────────────────────────────────────── */}
        <div className="flex flex-col gap-5 min-w-0">

          <FormSection step={1} title="סקי פס" sub="המחיר של הסקי פס נשלח בהצעת מחיר נפרדת">
            <div className="flex flex-col gap-3">
              <OptionCard selected={selectedPass === null} onSelect={() => setSelectedPass(null)} title="ללא סקי פס" />
              {passAreas.length > 0 && (
                <details className="group rounded-[18px] border border-line bg-white">
                  <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 min-h-[52px]">
                    <span className="flex items-center gap-2.5 text-[15px] font-bold text-ink"><span className="text-muted"><IconSkis size={18} /></span>מחירון הסקי פס לעיון</span>
                    <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">⌄</span>
                  </summary>
                  <div className="px-4 pb-4 flex flex-col gap-4">
                    {passAreas.map(g => (
                      <div key={g.area ?? "child"}>
                        <div className="text-[14px] font-bold text-muted mb-1.5">{g.label}</div>
                        <ul className="flex flex-col divide-y divide-line border-y border-line">
                          {g.passes.map(pass => (
                            <li key={pass.id} className="flex items-center justify-between gap-3 py-2.5">
                              <span className="min-w-0">
                                <span className="block text-[15px] text-ink">{pass.name}</span>
                                <span className="block text-[13px] text-muted">{pass.duration_days} ימי סקי</span>
                              </span>
                              <span className="shrink-0 font-bold text-[15px] text-ink">€{pass.price.toLocaleString("en-US")}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <p className="text-[13px] text-muted">המחירים לאדם. המחיר הסופי נשלח בהצעת מחיר נפרדת.</p>
                  </div>
                </details>
              )}
            </div>
          </FormSection>

          <FormSection step={2} title="הסעה משדה התעופה">
            <div className="flex flex-col gap-3">
              <OptionCard type="checkbox" selected={transfer} onSelect={() => setTransfer(!transfer)}
                icon={<IconBus size={20} />}
                title="שאטל ישיר מז'נבה או ליון לואל טורנס" sub={`€${TRANSFER_PP} לאדם לכל כיוון`} />

              {transfer && (
                <div className="bg-soft border border-line rounded-[18px] p-4 md:p-5 flex flex-col gap-5">
                  <OptionCard type="checkbox" selected={isElAlChecked} onSelect={() => setIsElAlChecked(v => !v)}
                    icon={<IconPlane size={20} />}
                    title="זו טיסת אל על ישירה" sub={`מחיר מאושר: €${TRANSFER_PP} לאדם לכל כיוון`}
                    badge={isElAlChecked ? <Tag tone="ok">אל על</Tag> : undefined} />

                  <div>
                    <div className={fieldLabel} id="t-dir">כיוון נסיעה</div>
                    <Segmented label="כיוון נסיעה" value={tDirection} onChange={setTDirection}
                      options={[["both", "הלוך וחזור"], ["outbound", "הלוך בלבד"], ["return", "חזור בלבד"]] as const} />
                  </div>

                  <div>
                    <div className={fieldLabel}>נוסעים</div>
                    <div className="inline-flex items-center gap-3 bg-white border border-line rounded-[14px] px-2 min-h-[52px]">
                      <button type="button" onClick={() => setTPassengers(v => Math.max(1, v - 1))} aria-label="פחות נוסעים"
                        className="w-10 h-10 rounded-full border border-line-strong flex items-center justify-center text-ink hover:border-ink transition-colors"><IconMinus size={16} /></button>
                      <span className="font-display font-bold text-[20px] text-ink w-7 text-center" aria-live="polite">{tPassengers}</span>
                      <button type="button" onClick={() => setTPassengers(v => Math.min(20, v + 1))} aria-label="עוד נוסע"
                        className="w-10 h-10 rounded-full border border-line-strong flex items-center justify-center text-ink hover:border-ink transition-colors"><IconPlus size={16} /></button>
                      <span className="text-[15px] text-muted pe-2">{tPassengers === 1 ? "אדם" : "אנשים"}</span>
                    </div>
                  </div>

                  {(tDirection === "both" || tDirection === "outbound") && (
                    <fieldset className="bg-white border border-line rounded-2xl p-4 flex flex-col gap-3">
                      <legend className="sr-only">טיסת הלוך</legend>
                      <div className="flex items-center gap-2 font-bold text-[15px] text-ink"><IconPlane size={18} className="text-accent" /> טיסת הלוך, נחיתה בשדה</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field id="t-air-in" label="שדה תעופה">
                          <select id="t-air-in" value={tAirportIn} onChange={e => setTAirportIn(e.target.value)} className={field}>
                            <option value="GVA">ז&apos;נבה (GVA)</option>
                            <option value="LYS">ליון (LYS)</option>
                          </select>
                        </Field>
                        <Field id="t-arr" label="שעת נחיתה">
                          <input id="t-arr" type="time" value={tArrival} onChange={e => setTArrival(e.target.value)} className={field} />
                        </Field>
                        <div className="sm:col-span-2">
                          <Field id="t-fl-in" label="מספר טיסה">
                            <input id="t-fl-in" type="text" value={tFlightIn} onChange={e => setTFlightIn(e.target.value.toUpperCase())}
                              placeholder="LY323 / FR1234" className={`${field} font-mono text-right`} dir="ltr" />
                          </Field>
                        </div>
                      </div>
                    </fieldset>
                  )}

                  {(tDirection === "both" || tDirection === "return") && (
                    <fieldset className="bg-white border border-line rounded-2xl p-4 flex flex-col gap-3">
                      <legend className="sr-only">טיסת חזור</legend>
                      <div className="flex items-center gap-2 font-bold text-[15px] text-ink"><IconPlane size={18} className="text-accent" /> טיסת חזור, המראה מהשדה</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field id="t-air-out" label="שדה תעופה">
                          <select id="t-air-out" value={tAirportOut} onChange={e => setTAirportOut(e.target.value)} className={field}>
                            <option value="GVA">ז&apos;נבה (GVA)</option>
                            <option value="LYS">ליון (LYS)</option>
                          </select>
                        </Field>
                        <Field id="t-dep" label="שעת המראה">
                          <input id="t-dep" type="time" value={tDeparture} onChange={e => setTDeparture(e.target.value)} className={field} />
                        </Field>
                        <div className="sm:col-span-2">
                          <Field id="t-fl-out" label="מספר טיסה">
                            <input id="t-fl-out" type="text" value={tFlightOut} onChange={e => setTFlightOut(e.target.value.toUpperCase())}
                              placeholder="LY324 / FR1235" className={`${field} font-mono text-right`} dir="ltr" />
                          </Field>
                        </div>
                      </div>
                    </fieldset>
                  )}

                  {isElAlChecked ? (
                    <Note tone="ok" className="flex flex-wrap items-center justify-between gap-2 font-bold">
                      <span>מחיר מאושר לטיסת אל על ישירה</span>
                      <span dir="ltr">€{TRANSFER_PP} × {tDirs} × {tPassengers} = €{trPrice}</span>
                    </Note>
                  ) : (
                    <Note tone="warn">הצעת מחיר להסעה תישלח אליכם בהקדם (בערך €{TRANSFER_PP} לאדם לכל כיוון).</Note>
                  )}
                </div>
              )}

              <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-[18px] border border-line bg-white hover:border-line-strong px-4 min-h-[56px] transition-colors">
                <span className="flex items-center gap-2.5 text-[15px] text-ink">
                  <span className="text-muted"><IconPlane size={18} /></span>
                  עוד לא הזמנתם טיסה? חיפוש טיסה מתל אביב לז&apos;נבה
                </span>
                <span className="text-[14px] font-bold text-accent shrink-0">Skyscanner ←</span>
              </a>
            </div>
          </FormSection>

          <FormSection step={3} title="מדיניות ביטול">
            <div role="radiogroup" aria-label="מדיניות ביטול" className="flex flex-col gap-2.5">
              <OptionCard selected={cancel === "none"} onSelect={() => setCancelSafe("none")}
                icon={<IconShield size={20} />}
                title="לא ניתן לביטול" sub="מחיר מוזל, אין החזר כספי אחרי ההזמנה" />
              <OptionCard selected={cancel === "flexible"} onSelect={() => setCancelSafe("flexible")}
                icon={<IconShield size={20} />}
                title="מדיניות גמישה" badge={<Tag tone="ok"><Ltr>+€{FLEXIBLE_PP}</Ltr> לאדם</Tag>}
                sub="80% החזר עד 48 שעות לפני ההגעה"
                note={cancel === "flexible" ? <span className="text-[13px] font-bold text-warn">מדיניות גמישה כוללת שירות אנושי מלא</span> : undefined} />
            </div>
            <Link href="/cancellation-policy" target="_blank" className={`${btn.link} mt-3 text-[15px]`}>למדיניות הביטול המלאה ←</Link>
          </FormSection>

          <FormSection step={4} title="רמת שירות">
            <div role="radiogroup" aria-label="רמת שירות" className="flex flex-col gap-2.5">
              <OptionCard selected={service === "human"} onSelect={() => setServiceSafe("human")}
                icon={<IconUser size={20} />}
                title="שירות אנושי מלא" sub="נציג ישראלי זמין לפני, במהלך ואחרי הנסיעה" />
              <OptionCard selected={service === "ai"} onSelect={() => setServiceSafe("ai")}
                icon={<IconBot size={20} />}
                title="AI בלבד" badge={<Tag tone="accent">חוסכים €{AI_DISC_PP * guests}</Tag>}
                sub={`ניהול עצמאי עם תמיכת צ׳אטבוט, חיסכון של €${AI_DISC_PP} לאדם`}
                note={<span className="text-[13px] font-bold text-danger">אי אפשר לשלב עם מדיניות ביטול גמישה</span>} />
            </div>
          </FormSection>

          <FormSection step={5} title="פרטים אישיים">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="b-name" label="שם מלא *">
                  <input id="b-name" value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי" autoComplete="name" className={field} />
                </Field>
                <Field id="b-phone" label="טלפון">
                  <input id="b-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="050-000-0000" type="tel" autoComplete="tel" className={`${field} text-right`} dir="ltr" />
                </Field>
              </div>
              <Field id="b-email" label="אימייל *">
                <input id="b-email" value={email} onChange={e => setEmail(e.target.value)} placeholder="israel@example.com" type="email" autoComplete="email" className={`${field} text-right`} dir="ltr" />
              </Field>
              <Field id="b-notes" label="הערות">
                <textarea id="b-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="בקשות מיוחדות…"
                  className={`${field} py-3 resize-none`} />
              </Field>
            </div>
          </FormSection>

          <FormSection id="book-pay" step={6} title="תשלום ואישור" sub="פרטי התשלום כאן הם הדגמה">
            <div className="flex flex-col gap-4">
              <Field id="c-num" label="מספר כרטיס">
                <input id="c-num" value={cardNum} onChange={e => setCardNum(fmtCard(e.target.value))} inputMode="numeric" autoComplete="off"
                  placeholder="1234 5678 9012 3456" maxLength={19} className={`${field} font-mono tracking-widest text-right`} dir="ltr" />
              </Field>
              <Field id="c-name" label="שם בעל הכרטיס">
                <input id="c-name" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="ISRAEL ISRAELI" autoComplete="off"
                  className={`${field} text-right`} dir="ltr" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field id="c-exp" label="תוקף">
                  <input id="c-exp" value={cardExpiry} onChange={e => setCardExpiry(fmtExpiry(e.target.value))} inputMode="numeric" autoComplete="off"
                    placeholder="MM/YY" maxLength={5} className={`${field} font-mono text-center`} dir="ltr" />
                </Field>
                <Field id="c-cvv" label="CVV">
                  <input id="c-cvv" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,"").slice(0,4))} inputMode="numeric" autoComplete="off"
                    placeholder="123" maxLength={4} className={`${field} font-mono text-center`} dir="ltr" />
                </Field>
              </div>

              <div>
                <div className={fieldLabel}>חתימה</div>
                <SignaturePad onChange={setSignature} />
                <p className="text-[13px] text-muted mt-1.5">חותמים עם העכבר או עם האצבע</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer rounded-2xl border border-line bg-white p-4">
                <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-0.5 w-5 h-5 shrink-0 accent-[#1652F0]" />
                <span className="text-[15px] text-body leading-relaxed">
                  קראתי, ו<Link href="/cancellation-policy" target="_blank" className="font-bold text-accent hover:text-accent-hover">תנאי השירות ומדיניות הביטול</Link> של SkiShare מקובלים עליי
                </span>
              </label>

              {error && <div id="book-error" className="scroll-mt-[96px]"><Note tone="danger">{error}</Note></div>}

              <button type="button" onClick={submit} disabled={submitting || !terms} className={`${btn.primaryLg} w-full`}>
                {submitting
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />שולחים…</span>
                  : <>לאישור ההזמנה · €{total.toLocaleString()}</>}
              </button>
              <p className="text-[13px] text-muted text-center">הצעת המחיר תקפה ל-24 שעות · תשלום מאובטח</p>
            </div>
          </FormSection>
        </div>

        {/* ── the order summary (desktop) ──────────────────── */}
        <aside aria-label="סיכום ההזמנה" className="hidden lg:block lg:sticky lg:top-[96px]">
          <div className="bg-white border border-line rounded-card overflow-hidden" style={{ boxShadow: "0 16px 40px rgba(11,27,51,0.08)" }}>
            {apt && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={apt.images?.[0] ?? "/apt1.jpg"} alt={apt.name} className="w-full h-40 object-cover" />
              </>
            )}
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[14px] text-muted">ואל טורנס · שלושת העמקים</span>
                <span className="font-display font-bold text-[21px] text-ink">{apt?.name ?? "ההזמנה שלכם"}</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className={chip}><IconCalendar size={15} className="text-accent" /> {fmtShort(checkin)} עד {fmtShort(checkout)}</span>
                  <span className={chip}><IconUsers size={15} className="text-accent" /> {guests} · {nights} לילות</span>
                </div>
                <Link href="/search" className={`${btn.link} text-[14px] mt-1`}>לשינוי הבחירה</Link>
              </div>
              <div className="border-t border-line pt-4">{priceLines}</div>
              <div className="border-t border-line pt-4 flex items-baseline justify-between gap-3">
                <span className="text-[15px] text-muted">סה״כ לתשלום</span>
                <span className="font-display font-extrabold text-[32px] leading-none text-ink">€{total.toLocaleString()}</span>
              </div>
              <button type="button" onClick={submitFromSummary} disabled={submitting} className={`${btn.primaryLg} w-full`}>
                לאישור ההזמנה
              </button>
              <TrustList items={[
                "תשלום מאובטח",
                "הצעת המחיר תקפה ל-24 שעות",
                <>אפשר לבחור <Link href="/cancellation-policy" target="_blank" className="font-bold text-accent hover:text-accent-hover">ביטול גמיש</Link></>,
              ]} />
            </div>
          </div>
        </aside>
      </div>

      <MobileBar>
        <div className="flex flex-col min-w-0">
          <span className="font-display font-extrabold text-[22px] leading-none text-ink">€{total.toLocaleString()}</span>
          <span className="text-[13px] text-muted mt-1">סה״כ לתשלום</span>
        </div>
        <button type="button" onClick={submitFromSummary} disabled={submitting} className={`${btn.primary} flex-1`}>
          לאישור ההזמנה
        </button>
      </MobileBar>
    </div>
  );
}

export default function BookPageWrapper() {
  return (
    <Suspense fallback={<SkiLoader />}>
      <BookPage />
    </Suspense>
  );
}
