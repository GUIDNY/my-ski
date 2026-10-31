"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IconCreditCard, IconX } from "@/components/Icons";

type Props = {
  apartmentId?: string;
  apartment: string;
  extraApartmentId?: string;
  extraApartmentName?: string;
  checkin?: string;
  checkout?: string;
  guests: number;
  nights: number;
  skiPass?: boolean;
  transfer?: boolean;
  equipment?: boolean;
  transferDetails?: string;
  flight?: boolean;
  flightPrice?: number;
  flightDetails?: string;
  cancel?: string;
  service?: string;
  grandTotal: number;
  className?: string;
  label?: string;
  // split payment: create a new group (first payer) or join an existing one
  split?: { sharesTotal: number; accommodationTotal: number; shareAmount: number; groupId?: string; area?: string };
};

const CARD_FEE_PCT = 0.019; // credit-card processing fee

const fieldCls = "w-full min-h-[48px] rounded-xl border border-line-strong bg-white px-4 text-[16px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelCls = "block text-[14px] font-bold text-ink mb-1.5";

export default function CardPaymentButton(p: Props) {
  // a quiet coupon line: only who has a code will look for it
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponErr, setCouponErr] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number; label: string } | null>(null);
  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setCouponBusy(true); setCouponErr("");
    try {
      const j = await fetch("/api/coupons/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, total: p.grandTotal }) }).then(r => r.json());
      if (j.valid) setApplied({ code, discount: j.discount, label: j.label });
      else { setApplied(null); setCouponErr("הקוד לא מוכר או שפג תוקפו"); }
    } catch { setCouponErr("לא הצלחנו לבדוק את הקוד כרגע"); }
    setCouponBusy(false);
  };
  const effTotal = Math.max(0, p.grandTotal - (applied?.discount || 0));
  const cardFee = Math.round(effTotal * CARD_FEE_PCT);
  const totalWithFee = effTotal + cardFee;
  const [currency, setCurrency] = useState<"EUR" | "ILS">("EUR");
  const [sellRate, setSellRate] = useState<number | null>(null);
  useEffect(() => { fetch("/api/fx").then(r => r.json()).then(d => setSellRate(Number(d.sell) || null)).catch(() => {}); }, []);
  const ilsTotal = sellRate ? Math.round(totalWithFee * sellRate) : null;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Escape closes the window (not while sending to the payment page)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  const submit = async () => {
    if (!name.trim()) return setErr("נא להזין שם מלא");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("נא להזין אימייל תקין");
    if (!phone.trim()) return setErr("נא להזין טלפון");
    if (!agreed) return setErr("יש לאשר את התקנון ומדיניות הביטולים");
    setBusy(true); setErr("");
    try {
      // split payment: create the group on the first payment (or reuse when joining)
      let groupId = p.split?.groupId;
      if (p.split && !groupId) {
        const g = await fetch("/api/groups", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apartment_id: p.apartmentId, extra_apartment_id: p.extraApartmentId,
            apartment_name: p.apartment, area: p.split.area,
            checkin: p.checkin, checkout: p.checkout, guests: p.guests,
            accommodation_total: p.split.accommodationTotal, shares_total: p.split.sharesTotal,
          }),
        }).then(r => r.json());
        groupId = g.id;
      }

      const order = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartment_id: p.apartmentId, apartment: p.apartment,
          extra_apartment_id: p.extraApartmentId, extra_apartment_name: p.extraApartmentName,
          checkin: p.checkin, checkout: p.checkout,
          guests: p.guests, nights: p.nights, ski_pass: p.skiPass, transfer: p.transfer, equipment: p.equipment,
          transfer_details: p.transferDetails,
          flight: p.flight, flight_price: p.flightPrice, flight_details: p.flightDetails,
          cancel: p.cancel, service: p.service, grand_total: p.grandTotal,
          coupon: applied?.code || undefined,
          group_id: groupId, share_amount: p.split?.shareAmount, shares_total: p.split?.sharesTotal,
          customer_name: name, customer_email: email, customer_phone: phone,
        }),
      }).then(r => r.json());

      if (order.error === "dates_unavailable") {
        setErr("מצטערים, התאריכים האלה כבר תפוסים בדירה הזו. אפשר לבחור תאריכים אחרים או לכתוב לנו בוואטסאפ.");
        setBusy(false); return;
      }
      if (!order.code) { setErr("לא הצלחנו ליצור את ההזמנה. אפשר לנסות שוב, או לכתוב לנו בוואטסאפ."); setBusy(false); return; }

      const res = await fetch("/api/payplus/create-link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalWithFee, currency, description: `${p.apartment} · ${p.nights} לילות`,
          order_code: order.code, name, email, phone,
        }),
      }).then(r => r.json());

      if (res.url) { window.location.href = res.url; return; }
      setErr("התשלום בכרטיס לא זמין כרגע. אפשר לסגור את ההזמנה בוואטסאפ."); setBusy(false);
    } catch {
      setErr("משהו השתבש ביצירת התשלום. אפשר לנסות שוב, או לכתוב לנו בוואטסאפ."); setBusy(false);
    }
  };

  const seg = (on: boolean) =>
    `flex-1 min-h-[44px] rounded-xl text-[15px] font-bold border transition-colors ${on ? "border-accent bg-accent-soft text-ink ring-1 ring-accent" : "border-line-strong text-body hover:border-ink"}`;

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setErr(""); }}
        className={p.className || "inline-flex items-center justify-center gap-2 w-full min-h-[52px] rounded-[14px] bg-accent hover:bg-accent-hover text-white font-display font-bold text-[17px] transition-colors"}>
        <IconCreditCard size={20} /> {p.label || "תשלום מאובטח בכרטיס"}
      </button>

      {/* the window goes on <body>: the button often sits in a sticky summary,
          which would otherwise keep the window under the site header */}
      {open && createPortal(
        <div dir="rtl" className="fixed inset-0 z-[90] bg-ink/55 flex items-end sm:items-center justify-center sm:p-4" onClick={() => !busy && setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="pay-title"
            className="bg-white w-full sm:max-w-md rounded-t-[24px] sm:rounded-[22px] p-5 sm:p-6 max-h-[92dvh] overflow-y-auto"
            style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 id="pay-title" className="font-display font-bold text-[22px] leading-tight text-ink">פרטים לתשלום</h2>
              <button type="button" onClick={() => !busy && setOpen(false)} aria-label="סגירה"
                className="w-10 h-10 -mt-1 -ml-1 shrink-0 rounded-full hover:bg-soft text-muted flex items-center justify-center"><IconX size={20} /></button>
            </div>
            <p className="text-[15px] text-muted mb-5">{p.apartment} · {p.nights} לילות · <b className="text-ink">€{p.grandTotal.toLocaleString("en-US")}</b></p>

            <div className="flex flex-col gap-3.5">
              <label className="block">
                <span className={labelCls}>שם מלא</span>
                <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" className={fieldCls} />
              </label>
              <label className="block">
                <span className={labelCls}>אימייל, לאישור ההזמנה</span>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" dir="ltr" className={`${fieldCls} text-right`} />
              </label>
              <label className="block">
                <span className={labelCls}>טלפון</span>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" autoComplete="tel" dir="ltr" className={`${fieldCls} text-right`} />
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-1">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 w-5 h-5 shrink-0 accent-[#1652F0]" />
                <span className="text-[14px] text-body leading-relaxed">
                  קראתי את <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-accent underline font-bold">התקנון ומדיניות הביטולים</a>, והם מקובלים עליי. המחירים ביורו, ואפשר לשלם גם בשקלים לפי שער ההמרה.
                </span>
              </label>

              {/* currency choice */}
              <div role="radiogroup" aria-label="מטבע לתשלום">
                <div className={labelCls}>מטבע לתשלום</div>
                <div className="flex gap-2">
                  <button type="button" role="radio" aria-checked={currency === "EUR"} onClick={() => setCurrency("EUR")} className={seg(currency === "EUR")}>€ יורו</button>
                  <button type="button" role="radio" aria-checked={currency === "ILS"} onClick={() => setCurrency("ILS")} className={seg(currency === "ILS")}>₪ שקל</button>
                </div>
              </div>

              {/* fee breakdown */}
              <div className="bg-soft rounded-2xl p-4 text-[15px] flex flex-col gap-2">
                <div className="flex justify-between text-body"><span>סכום ההזמנה</span><span>€{p.grandTotal.toLocaleString("en-US")}</span></div>
                {applied && (
                  <div className="flex justify-between text-ok-text font-bold">
                    <span>קופון {applied.code} ({applied.label}) <button type="button" onClick={() => { setApplied(null); setCouponCode(""); }} className="text-muted font-normal underline">הסרה</button></span>
                    <span>−€{applied.discount.toLocaleString("en-US")}</span>
                  </div>
                )}
                <div className="flex justify-between text-body"><span>עמלת סליקת אשראי (1.9%)</span><span>€{cardFee.toLocaleString("en-US")}</span></div>
                <div className="flex justify-between font-bold text-ink border-t border-line pt-2">
                  <span>לתשלום בכרטיס</span>
                  <span className="font-display text-[18px]">{currency === "ILS" && ilsTotal ? `₪${ilsTotal.toLocaleString("en-US")}` : `€${totalWithFee.toLocaleString("en-US")}`}</span>
                </div>
                {currency === "ILS" && (
                  <p className="text-[13px] text-muted">החיוב בשקלים לפי שער מזומן{sellRate ? ` (${sellRate.toFixed(3)})` : ""}, בערך €{totalWithFee.toLocaleString("en-US")}</p>
                )}
              </div>

              {/* the quiet coupon entry */}
              {!applied && (
                couponOpen ? (
                  <div className="flex items-center gap-2">
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="קוד קופון" dir="ltr"
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                      className="flex-1 min-h-[42px] rounded-xl border border-line-strong bg-white px-3 text-[15px] text-left focus:outline-none focus:border-accent" />
                    <button type="button" onClick={applyCoupon} disabled={couponBusy}
                      className="min-h-[42px] rounded-xl border border-line-strong px-4 text-[14px] font-bold text-body hover:border-ink disabled:opacity-50">
                      {couponBusy ? "בודק…" : "החלה"}
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setCouponOpen(true)}
                    className="self-start text-[13px] text-muted hover:text-ink underline-offset-2 hover:underline">יש לכם קוד?</button>
                )
              )}
              {couponErr && <p className="text-[13px] text-danger -mt-1">{couponErr}</p>}

              {err && <p role="alert" className="text-[15px] text-danger bg-danger-soft rounded-xl px-3.5 py-2.5">{err}</p>}

              <button type="button" onClick={submit} disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[52px] rounded-[14px] bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-display font-bold text-[17px] transition-colors">
                <IconCreditCard size={20} /> {busy ? "עוברים לתשלום…" : "להמשך לתשלום מאובטח"}
              </button>
              <p className="text-center text-[13px] text-muted">תשלום מאובטח ב-PayPlus. בהעברה בנקאית אין עמלה, ואפשר לסדר אותה מול נציג.</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
