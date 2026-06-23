"use client";
import { useState, useEffect } from "react";
import { IconCreditCard } from "@/components/Icons";

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
  cancel?: string;
  service?: string;
  grandTotal: number;
  className?: string;
  label?: string;
  // split payment: create a new group (first payer) or join an existing one
  split?: { sharesTotal: number; accommodationTotal: number; shareAmount: number; groupId?: string; area?: string };
};

const CARD_FEE_PCT = 0.019; // credit-card processing fee

export default function CardPaymentButton(p: Props) {
  const cardFee = Math.round(p.grandTotal * CARD_FEE_PCT);
  const totalWithFee = p.grandTotal + cardFee;
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
          cancel: p.cancel, service: p.service, grand_total: p.grandTotal,
          group_id: groupId, share_amount: p.split?.shareAmount, shares_total: p.split?.sharesTotal,
          customer_name: name, customer_email: email, customer_phone: phone,
        }),
      }).then(r => r.json());

      const res = await fetch("/api/payplus/create-link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalWithFee, currency, description: `${p.apartment} · ${p.nights} לילות`,
          order_code: order.code, name, email, phone,
        }),
      }).then(r => r.json());

      if (res.url) { window.location.href = res.url; return; }
      setErr("התשלום בכרטיס לא זמין כרגע. אפשר לסגור בוואטסאפ 🙏"); setBusy(false);
    } catch {
      setErr("שגיאה ביצירת התשלום. נסו שוב או בוואטסאפ."); setBusy(false);
    }
  };

  return (
    <>
      <button onClick={() => { setOpen(true); setErr(""); }}
        className={p.className || "flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-display font-bold py-3.5 rounded-xl text-center transition shadow-sm shadow-blue-600/20"}>
        <IconCreditCard size={20} /> {p.label || "תשלום מאובטח בכרטיס"}
      </button>

      {open && (
        <div dir="rtl" className="fixed inset-0 z-[90] bg-black/55 flex items-end sm:items-center justify-center p-3" onClick={() => !busy && setOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-xl font-black text-slate-900">פרטים לתשלום</h2>
              <button onClick={() => !busy && setOpen(false)} className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 text-xl">✕</button>
            </div>
            <p className="text-sm text-slate-500 mb-5">{p.apartment} · {p.nights} לילות · <b className="text-slate-800">€{p.grandTotal.toLocaleString()}</b></p>

            <div className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="שם מלא"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="אימייל (לאישור ההזמנה)" dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="טלפון" dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-600" />
                <span className="text-xs text-slate-500 leading-relaxed">
                  קראתי ואני מאשר/ת את <a href="/terms" target="_blank" className="text-blue-600 underline font-semibold">התקנון ומדיניות הביטולים</a>. המחירים ב-€ והחיוב בש״ח לפי שער המרה.
                </span>
              </label>

              {/* currency choice */}
              <div>
                <div className="text-xs font-bold text-slate-400 mb-1.5">מטבע לתשלום</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setCurrency("EUR")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition ${currency === "EUR" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"}`}>€ יורו</button>
                  <button type="button" onClick={() => setCurrency("ILS")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition ${currency === "ILS" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"}`}>₪ שקל</button>
                </div>
              </div>

              {/* fee breakdown */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-sm space-y-1.5">
                <div className="flex justify-between text-slate-500"><span>סכום ההזמנה</span><span>€{p.grandTotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-slate-500"><span>עמלת סליקת אשראי (1.9%)</span><span>€{cardFee.toLocaleString()}</span></div>
                <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-1.5">
                  <span>לתשלום בכרטיס</span>
                  <span>{currency === "ILS" && ilsTotal ? `₪${ilsTotal.toLocaleString()}` : `€${totalWithFee.toLocaleString()}`}</span>
                </div>
                {currency === "ILS" && (
                  <p className="text-[11px] text-slate-400 pt-0.5">החיוב בש״ח לפי שער מזומן {sellRate ? `(${sellRate.toFixed(3)})` : ""} · ≈ €{totalWithFee.toLocaleString()}</p>
                )}
              </div>

              {err && <p className="text-red-600 text-sm">{err}</p>}

              <button onClick={submit} disabled={busy}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-display font-bold py-3.5 rounded-xl transition">
                <IconCreditCard size={20} /> {busy ? "מעביר לתשלום…" : "המשך לתשלום מאובטח"}
              </button>
              <p className="text-center text-[11px] text-slate-400">תשלום מאובטח · PayPlus · ללא עמלה בהעברה בנקאית — דברו עם נציג</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
