"use client";
import { useState } from "react";
import { IconCreditCard } from "@/components/Icons";
import { field, fieldLabel } from "@/components/ui";
import { CONTACT_EMAIL, LAST_APARTMENT_KEY, cardFeeFor, type Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import { fmtDayRange, fmtEur } from "@/lib/intl/format";
import Dialog from "../Dialog";

export type Booking = {
  apartmentId: string;
  orderName: string;   // the apartment's name as the database has it (the order, the admin, the emails)
  name: string;        // its name in this language (what the customer sees, PayPlus)
  checkin: string;
  checkout: string;
  nights: number;
  guests: number;
  total: number;       // the stay, from lib/pricing.ts
};

type Err = { text: string; mail?: boolean };

/**
 * "Your details": name, email, phone and the terms, then the order
 * (POST /api/orders, the same body the Hebrew checkout sends for an
 * apartment-only booking) and the PayPlus page (POST /api/payplus/create-link,
 * total + the 1.9% card fee, back to /en|fr/pay/…).
 */
export default function CheckoutDialog({ lang, booking: b, onClose, onTaken }: {
  lang: Lang; booking: Booking; onClose: () => void; onTaken: () => void;
}) {
  const t = DICT[lang];
  const c = t.checkout;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Err | null>(null);
  // an order already created for exactly these details (so a retry after a
  // payment-link failure doesn't create a second one)
  const [made, setMade] = useState<{ sig: string; code: string } | null>(null);

  const fee = cardFeeFor(b.total);
  const toPay = b.total + fee;

  const submit = async () => {
    const n = name.trim(), e = email.trim(), p = phone.trim();
    if (n.length < 2) return setErr({ text: c.errName });
    if (!/^\S+@\S+\.\S+$/.test(e)) return setErr({ text: c.errEmail });
    if (p.replace(/\D/g, "").length < 6) return setErr({ text: c.errPhone });
    if (!agreed) return setErr({ text: c.errTerms });
    setBusy(true); setErr(null);
    const sig = JSON.stringify([b, n, e, p]);
    try {
      let code = made?.sig === sig ? made.code : "";
      if (!code) {
        const res = await fetch("/api/orders", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apartment_id: b.apartmentId, apartment: b.orderName,
            checkin: b.checkin, checkout: b.checkout, guests: b.guests, nights: b.nights,
            ski_pass: false, transfer: false, equipment: false, cancel: "regular", service: "human",
            grand_total: b.total,
            customer_name: n, customer_email: e, customer_phone: p,
          }),
        });
        const order = await res.json().catch(() => ({}));
        if (res.status === 409 || order?.error === "dates_unavailable") {
          setErr({ text: c.errTaken }); setBusy(false); onTaken(); return;
        }
        if (!order?.code) { setErr({ text: c.errOrder, mail: true }); setBusy(false); return; }
        code = String(order.code);
        setMade({ sig, code });
      }

      const link = await fetch("/api/payplus/create-link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: toPay, currency: "EUR", description: `${b.name} · ${t.common.nights(b.nights)}`,
          order_code: code, name: n, email: e, phone: p, lang,
        }),
      }).then(r => r.json()).catch(() => ({}));

      if (link?.url) {
        try { sessionStorage.setItem(LAST_APARTMENT_KEY, window.location.pathname + window.location.search); } catch { /* private mode */ }
        window.location.href = link.url;
        return;
      }
      setErr({ text: c.errPay(code.toUpperCase()), mail: true }); setBusy(false);
    } catch {
      setErr({ text: c.errNetwork, mail: true }); setBusy(false);
    }
  };

  const row = (label: string, value: string, strong = false) => (
    <div className={`flex justify-between gap-3 ${strong ? "font-bold text-ink border-t border-line pt-2" : "text-body"}`}>
      <span>{label}</span><span className={strong ? "font-display text-[18px]" : ""}>{value}</span>
    </div>
  );

  return (
    <Dialog lang={lang} title={c.title} onClose={onClose} locked={busy}
      sub={<>{b.name} · {fmtDayRange(b.checkin, b.checkout, lang, true)} · {t.common.nights(b.nights)} · {t.common.guests(b.guests)}</>}>
      <form className="flex flex-col gap-3.5" onSubmit={ev => { ev.preventDefault(); if (!busy) submit(); }} noValidate>
        <label className="block">
          <span className={fieldLabel}>{c.name}</span>
          <input value={name} onChange={ev => setName(ev.target.value)} autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className={fieldLabel}>{c.email}</span>
          <input value={email} onChange={ev => setEmail(ev.target.value)} type="email" inputMode="email" autoComplete="email" className={field} />
          <span className="block text-[13px] text-muted mt-1">{c.emailHint}</span>
        </label>
        <label className="block">
          <span className={fieldLabel}>{c.phone}</span>
          <input value={phone} onChange={ev => setPhone(ev.target.value)} type="tel" inputMode="tel" autoComplete="tel" className={field} />
          <span className="block text-[13px] text-muted mt-1">{c.phoneHint}</span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer pt-1 min-h-[44px]">
          <input type="checkbox" checked={agreed} onChange={ev => setAgreed(ev.target.checked)} className="mt-0.5 w-6 h-6 shrink-0 accent-[#1652F0]" />
          <span className="text-[15px] text-body leading-relaxed">
            {c.termsBefore}
            <a href={`/${lang}/terms`} target="_blank" rel="noopener noreferrer" className="text-accent underline font-bold">{c.termsLink}</a>
            {c.termsAfter}
          </span>
        </label>

        <div className="bg-soft rounded-2xl p-4 text-[15px] flex flex-col gap-2">
          {row(c.bookingTotal, fmtEur(b.total, lang))}
          {row(c.cardFee, fmtEur(fee, lang))}
          {row(c.toPay, fmtEur(toPay, lang), true)}
        </div>

        {err && (
          <p role="alert" className="text-[15px] text-danger bg-danger-soft rounded-xl px-3.5 py-2.5 leading-relaxed">
            {err.text}{err.mail && <> <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold underline break-all">{CONTACT_EMAIL}</a>.</>}
          </p>
        )}

        <button type="submit" disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 min-h-[52px] rounded-[14px] bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-display font-bold text-[17px] transition-colors">
          <IconCreditCard size={20} /> {busy ? c.busy : c.submit}
        </button>
        <p className="text-center text-[13px] text-muted pb-1">{c.redirect}</p>
      </form>
    </Dialog>
  );
}
