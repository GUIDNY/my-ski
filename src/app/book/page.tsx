"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Apartment, SkiPass } from "@/types";

/* ─── Types ──────────────────────────────────────────────── */
type Extras = {
  skiPassId: string | null;
  transfer: boolean;
  insurance: boolean;
  agent: boolean;
};
type Details = { name: string; email: string; phone: string; notes: string };

const STEPS = ["תוספות", "פרטים", "סיכום"];

const TRANSFER_PRICE = 55;
const INSURANCE_RATE = 0.08;
const AGENT_PRICE    = 120;

/* ─── Helpers ────────────────────────────────────────────── */
function nights(from: string, to: string) {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("he-IL", { day: "numeric", month: "long" });
}

/* ─── Step components ────────────────────────────────────── */
function StepApartment({
  apartments, selected, onSelect, checkin, checkout, guests,
  setCheckin, setCheckout, setGuests,
}: {
  apartments: Apartment[];
  selected: string | null;
  onSelect: (id: string) => void;
  checkin: string; checkout: string; guests: number;
  setCheckin: (v: string) => void;
  setCheckout: (v: string) => void;
  setGuests: (v: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Dates + guests */}
      <div className="bg-blue-50 rounded-2xl p-5 grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">הגעה</label>
          <input type="date" value={checkin} min={new Date().toISOString().split("T")[0]}
            onChange={e => setCheckin(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">יציאה</label>
          <input type="date" value={checkout} min={checkin}
            onChange={e => setCheckout(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">אנשים</label>
          <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden h-[42px]">
            <button onClick={() => setGuests(Math.max(1, guests - 1))} className="px-3 text-gray-500 hover:text-gray-900 font-bold">−</button>
            <span className="flex-1 text-center font-bold text-sm">{guests}</span>
            <button onClick={() => setGuests(Math.min(12, guests + 1))} className="px-3 text-gray-500 hover:text-gray-900 font-bold">+</button>
          </div>
        </div>
      </div>

      {/* Apartment cards */}
      <div className="grid grid-cols-1 gap-4">
        {apartments.map(apt => {
          const n = checkin && checkout ? nights(checkin, checkout) : 7;
          const total = apt.price_per_night * n;
          const isSelected = selected === apt.id;
          return (
            <button key={apt.id} onClick={() => onSelect(apt.id)}
              className={`w-full text-right flex gap-4 p-4 rounded-2xl border-2 transition-all ${
                isSelected ? "border-blue-600 bg-blue-50/50" : "border-gray-100 bg-white hover:border-gray-300"
              }`}
            >
              <img src={apt.images?.[0] ?? "/apt1.jpg"} alt={apt.name}
                className="w-28 h-20 object-cover rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-gray-900">{apt.name}</h3>
                    <p className="text-sm text-gray-500">{apt.type} · {apt.beds} חד׳ · {apt.sqm} מ״ר</p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {apt.amenities?.slice(0, 3).map((a, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-lg font-black text-gray-900">€{total.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">{n} לילות</div>
                    <div className="text-xs text-gray-500">€{apt.price_per_night}/לילה</div>
                  </div>
                </div>
              </div>
              {isSelected && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepExtras({ extras, setExtras, skiPasses, guests }: {
  extras: Extras; setExtras: (e: Extras) => void;
  skiPasses: SkiPass[]; guests: number;
}) {
  return (
    <div className="space-y-5">
      {/* Ski pass */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">🎿</div>
          <div>
            <h3 className="font-bold text-gray-900">סקי פס — Trois Vallées</h3>
            <p className="text-sm text-gray-500">600 ק״מ מסלולים, הרשת הגדולה בעולם</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button onClick={() => setExtras({ ...extras, skiPassId: null })}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-all ${
              extras.skiPassId === null ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-gray-200"
            }`}>
            <span className="font-medium text-gray-600">ללא סקי פס</span>
            {extras.skiPassId === null && <span className="text-blue-600 font-bold">✓</span>}
          </button>
          {skiPasses.filter(p => p.type === "adult").map(pass => (
            <button key={pass.id} onClick={() => setExtras({ ...extras, skiPassId: pass.id })}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                extras.skiPassId === pass.id ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-gray-200"
              }`}>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{pass.name}</div>
                <div className="text-xs text-gray-500">{pass.duration_days} ימי סקי</div>
              </div>
              <div className="text-right">
                <div className="font-black text-gray-900">€{(pass.price * guests).toLocaleString()}</div>
                <div className="text-xs text-gray-400">€{pass.price} × {guests}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Transfer */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl">🚌</div>
            <div>
              <h3 className="font-bold text-gray-900">הסעה משדה התעופה</h3>
              <p className="text-sm text-gray-500">שאטל ישיר Geneva/Lyon → Val Thorens</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-black text-gray-900">€{(TRANSFER_PRICE * guests).toLocaleString()}</span>
            <button onClick={() => setExtras({ ...extras, transfer: !extras.transfer })}
              className={`w-12 h-6 rounded-full transition-all relative ${extras.transfer ? "bg-blue-600" : "bg-gray-200"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${extras.transfer ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Insurance */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl">🛡️</div>
            <div>
              <h3 className="font-bold text-gray-900">ביטוח סקי + נסיעות</h3>
              <p className="text-sm text-gray-500">ביטול, רפואי, ציוד, חילוץ הר</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">8% מהחבילה</span>
            <button onClick={() => setExtras({ ...extras, insurance: !extras.insurance })}
              className={`w-12 h-6 rounded-full transition-all relative ${extras.insurance ? "bg-blue-600" : "bg-gray-200"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${extras.insurance ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Agent */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl">🧑‍💼</div>
            <div>
              <h3 className="font-bold text-gray-900">נציג אישי בעברית</h3>
              <p className="text-sm text-gray-500">נציג זמין לפני, במהלך ואחרי החופשה</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-black text-gray-900">€{AGENT_PRICE}</span>
            <button onClick={() => setExtras({ ...extras, agent: !extras.agent })}
              className={`w-12 h-6 rounded-full transition-all relative ${extras.agent ? "bg-blue-600" : "bg-gray-200"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${extras.agent ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDetails({ details, setDetails }: { details: Details; setDetails: (d: Details) => void }) {
  const field = (label: string, key: keyof Details, type = "text", placeholder = "") => (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">{label}</label>
      <input type={type} value={details[key]} placeholder={placeholder}
        onChange={e => setDetails({ ...details, [key]: e.target.value })}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <p className="text-sm text-gray-500">הפרטים ישמשו לאישור ההזמנה ולתקשורת עמך</p>
      {field("שם מלא", "name", "text", "ישראל ישראלי")}
      {field("אימייל", "email", "email", "israel@example.com")}
      {field("טלפון", "phone", "tel", "+972-50-000-0000")}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">הערות (אופציונלי)</label>
        <textarea value={details.notes} rows={3} placeholder="בקשות מיוחדות, קומה מועדפת..."
          onChange={e => setDetails({ ...details, notes: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function BookPage() {
  const router = useRouter();
  const searchParams = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search) : null;

  const [step, setStep]             = useState(1); // skip apt selection — comes from /search
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [skiPasses, setSkiPasses]   = useState<SkiPass[]>([]);
  const [aptId, setAptId]           = useState<string | null>(searchParams?.get("apartment") ?? null);
  const [checkin, setCheckin]       = useState(searchParams?.get("checkin") ?? "");
  const [checkout, setCheckout]     = useState(searchParams?.get("checkout") ?? "");
  const [guests, setGuests]         = useState(parseInt(searchParams?.get("guests") ?? "2"));
  const [extras, setExtras]         = useState<Extras>({ skiPassId: null, transfer: false, insurance: false, agent: false });
  const [details, setDetails]       = useState<Details>({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    fetch("/api/apartments").then(r => r.json()).then(setApartments);
    fetch("/api/ski-passes").then(r => r.json()).then(setSkiPasses);
  }, []);

  const apt      = apartments.find(a => a.id === aptId);
  const skiPass  = skiPasses.find(p => p.id === extras.skiPassId);
  const n        = checkin && checkout ? nights(checkin, checkout) : 0;
  const aptPrice = apt ? apt.price_per_night * n : 0;
  const skiPrice = skiPass ? skiPass.price * guests : 0;
  const trPrice  = extras.transfer ? TRANSFER_PRICE * guests : 0;
  const agPrice  = extras.agent ? AGENT_PRICE : 0;
  const subtotal = aptPrice + skiPrice + trPrice + agPrice;
  const insPrice = extras.insurance ? Math.round(subtotal * INSURANCE_RATE) : 0;
  const total    = subtotal + insPrice;

  // step 1=extras, 2=details, 3=summary
  const canNext = [
    null,
    true,
    details.name && details.email,
    true,
  ][step];

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartment_id: aptId,
          check_in: checkin,
          check_out: checkout,
          guests,
          total_price: total,
          status: "pending",
          customer_name: details.name,
          customer_email: details.email,
          customer_phone: details.phone,
          notes: details.notes,
          add_ons: {
            ski_pass: !!extras.skiPassId,
            ski_pass_name: skiPass?.name,
            transfer: extras.transfer,
            insurance: extras.insurance,
            agent: extras.agent,
          },
        }),
      });
      if (!res.ok) throw new Error("שגיאה בשמירת ההזמנה");
      const booking = await res.json();
      router.push(`/book/confirm?id=${booking.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "שגיאה");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm text-white">⛷</div>
            <span className="font-black text-gray-900">MySki</span>
          </a>
          <div className="text-sm text-gray-500">הזמנה מאובטחת 🔒</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Stepper — steps are 1,2,3 */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const si = i + 1; // actual step index (1,2,3)
            return (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${si <= step ? "text-blue-600" : "text-gray-300"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                    si < step  ? "bg-blue-600 border-blue-600 text-white" :
                    si === step ? "border-blue-600 text-blue-600" :
                                  "border-gray-200 text-gray-300"}`}>
                    {si < step ? "✓" : si}
                  </div>
                  <span className={`text-xs font-bold hidden md:block ${si === step ? "text-blue-600" : si < step ? "text-gray-600" : "text-gray-300"}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${si < step ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Price banner */}
        {total > 0 && (
          <div className="bg-blue-600 text-white rounded-2xl px-5 py-3 mb-6 flex items-center justify-between">
            <span className="text-sm font-medium opacity-80">סה״כ חבילה</span>
            <span className="text-2xl font-black">€{total.toLocaleString()}</span>
          </div>
        )}

        {/* Step content */}
        <div className="mb-6">
          {step === 1 && (
            <StepExtras extras={extras} setExtras={setExtras} skiPasses={skiPasses} guests={guests} />
          )}
          {step === 2 && (
            <StepDetails details={details} setDetails={setDetails} />
          )}
          {step === 3 && apt && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-black text-gray-900 mb-4 text-lg">סיכום הזמנה</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">🏠 {apt.name}</span>
                    <span className="font-bold">€{aptPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{fmtDate(checkin)} — {fmtDate(checkout)} · {n} לילות · {guests} אנשים</span>
                  </div>
                  {skiPass && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">🎿 {skiPass.name} × {guests}</span>
                      <span className="font-bold">€{skiPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {extras.transfer && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">🚌 הסעה × {guests}</span>
                      <span className="font-bold">€{trPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {extras.agent && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">🧑‍💼 נציג אישי</span>
                      <span className="font-bold">€{agPrice}</span>
                    </div>
                  )}
                  {extras.insurance && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">🛡️ ביטוח (8%)</span>
                      <span className="font-bold">€{insPrice.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-lg">
                    <span>סה״כ לתשלום</span>
                    <span className="text-blue-600">€{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm">
                <div className="font-bold text-gray-900 mb-2">פרטי הלקוח</div>
                <div className="text-gray-600 space-y-1">
                  <div>{details.name}</div>
                  <div>{details.email}</div>
                  {details.phone && <div>{details.phone}</div>}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
                ✅ ביטול חינם עד 30 יום לפני ההגעה · תשלום רק לאחר אישור
              </div>
              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)}
              className="px-6 py-3.5 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              חזור →
            </button>
          ) : (
            <a href="/search" className="px-6 py-3.5 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-center">
              בחר דירה אחרת →
            </a>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canNext}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition-colors text-lg">
              ← המשך
            </button>
          ) : (
            <button onClick={submit} disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-black py-3.5 rounded-xl transition-colors text-lg">
              {submitting ? "שולח..." : "🎿 אשר הזמנה"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
