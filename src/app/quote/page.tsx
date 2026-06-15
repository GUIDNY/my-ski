"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Apartment } from "@/types";
import {
  IconMountain, IconBed, IconCalendar, IconCheck, IconChevronLeft, IconMail, IconPhone,
} from "@/components/Icons";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;
};

const TRANSFER_PRICE = 180;
const FLEXIBLE_EXTRA = 100;
const AI_DISCOUNT = 50;

function QuotePage() {
  const params = useSearchParams();
  const router = useRouter();
  const [apt, setApt] = useState<Apartment | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  const apartmentId = params.get("apartment_id") ?? "";
  const apartment = params.get("apartment") ?? "דירה";
  const checkin = params.get("checkin") ?? "";
  const checkout = params.get("checkout") ?? "";
  const guests = parseInt(params.get("guests") ?? "2");
  const nights = parseInt(params.get("nights") ?? "1");
  const skiPass = params.get("ski_pass") === "true";
  const transfer = params.get("transfer") === "true";
  const cancel = params.get("cancel") ?? "none";
  const service = params.get("service") ?? "human";

  const aptTotal = parseInt(params.get("apt_total") ?? "0");
  const trTotal = parseInt(params.get("tr_total") ?? "0");
  const flexExtra = parseInt(params.get("flex_extra") ?? "0");
  const aiDiscount = parseInt(params.get("ai_discount") ?? "0");
  const grandTotal = parseInt(params.get("grand_total") ?? "0");

  useEffect(() => {
    if (!apartmentId) return;
    fetch(`/api/apartments/${apartmentId}`)
      .then(r => r.json())
      .then(data => setApt(data))
      .catch(() => {});
  }, [apartmentId]);

  const imgs = apt?.images?.length ? apt.images : ["/apt1.jpg", "/apt2.jpg", "/apt3.jpg"];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 transition">← חזור</button>
          <h1 className="text-xl font-black text-gray-900">הצעת מחיר מותאמת</h1>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <IconMountain size={16} className="text-white" />
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      {apt && (
        <div className="relative w-full h-96 md:h-[500px] bg-gray-200 overflow-hidden group">
          <img
            src={imgs[imgIdx]}
            alt={apartment}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Image Counter */}
          {imgs.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`transition-all ${
                    i === imgIdx
                      ? 'bg-white w-8 h-2'
                      : 'bg-white/50 w-2 h-2 hover:bg-white/80'
                  } rounded-full`}
                />
              ))}
            </div>
          )}

          {/* Navigation Arrows */}
          {imgs.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition"
              >
                <IconChevronLeft size={20} className="rotate-180" />
              </button>
              <button
                onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition"
              >
                <IconChevronLeft size={20} />
              </button>
            </>
          )}

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <p className="text-sm font-semibold opacity-90 mb-2">Val Thorens, France</p>
            <h2 className="text-5xl font-black">{apartment}</h2>
            <p className="text-base opacity-80 mt-2">הצעת מחיר בלעדית ומותאמת</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 space-y-8">

        {/* Booking Summary Card */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
          <h3 className="text-2xl font-black text-gray-900 mb-6">📅 סיכום ההזמנה</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">תאריך כניסה</p>
              <p className="text-xl font-black text-gray-900">{fmtDate(checkin)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">תאריך יציאה</p>
              <p className="text-xl font-black text-gray-900">{fmtDate(checkout)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">מספר לילות</p>
              <p className="text-xl font-black text-gray-900">{nights} לילות</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">מספר אנשים</p>
              <p className="text-xl font-black text-gray-900">{guests} {guests === 1 ? "אדם" : "אנשים"}</p>
            </div>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-gray-900">💰 פירוט המחיר</h3>

          <div className="space-y-3">
            {/* Accommodation */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition">
              <div>
                <p className="font-bold text-gray-900">לינה</p>
                <p className="text-sm text-gray-600">× {nights} לילות</p>
              </div>
              <p className="text-2xl font-black text-blue-600">€{aptTotal.toLocaleString()}</p>
            </div>

            {/* Transfer */}
            {transfer && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition">
                <div>
                  <p className="font-bold text-gray-900">🚐 הסעה הלוך-חזור</p>
                  <p className="text-sm text-gray-600">משדה התעופה ישירות</p>
                </div>
                <p className="text-2xl font-black text-blue-600">€{TRANSFER_PRICE}</p>
              </div>
            )}

            {/* Cancellation */}
            {cancel === "flexible" && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition">
                <div>
                  <p className="font-bold text-gray-900">✅ מדיניות גמישה</p>
                  <p className="text-sm text-gray-600">80% החזר עד 48 שעות לפני</p>
                </div>
                <p className="text-2xl font-black text-green-600">+€{(FLEXIBLE_EXTRA * guests).toLocaleString()}</p>
              </div>
            )}

            {/* AI Discount */}
            {service === "ai" && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition">
                <div>
                  <p className="font-bold text-gray-900">🤖 הנחת AI</p>
                  <p className="text-sm text-gray-600">ניהול עצמאי חכם</p>
                </div>
                <p className="text-2xl font-black text-indigo-600">−€{(AI_DISCOUNT * guests).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Total Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg">
          <p className="text-sm font-semibold opacity-90 mb-2">סה״כ לתשלום</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-base opacity-80">עבור {guests} {guests === 1 ? "אדם" : "אנשים"} · {nights} לילות</p>
            </div>
            <div className="text-right">
              <p className="text-6xl font-black">€{grandTotal.toLocaleString()}</p>
              <p className="text-lg font-semibold opacity-80 mt-1">~€{Math.round(grandTotal / nights)}/לילה ממוצע</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-gray-900">🏦 פרטי תשלום</h3>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 border border-amber-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">בנק</p>
                <p className="text-lg font-black text-amber-950">{process.env.NEXT_PUBLIC_BANK_NAME || "בנק הפועלים"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">SWIFT</p>
                <p className="text-lg font-black text-amber-950">{process.env.NEXT_PUBLIC_BANK_SWIFT || "POALILIT"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-amber-900 mb-1">IBAN</p>
                <p className="text-lg font-mono font-black text-amber-950">{process.env.NEXT_PUBLIC_BANK_IBAN || "IL62012673000000026026"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-amber-900 mb-1">בעל החשבון</p>
                <p className="text-lg font-black text-amber-950">{process.env.NEXT_PUBLIC_BANK_ACCOUNT || "MySki Ltd"}</p>
              </div>
            </div>
            <div className="bg-amber-200/50 border border-amber-300 rounded-lg p-4 mt-6">
              <p className="text-sm text-amber-950 font-semibold">
                ✓ בעד קבלת ההעברה, אנחנו נאשר את ההזמנה והדירה תהיה שלך
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href={`/book?apartment_id=${apartmentId}&apartment=${apartment}&checkin=${checkin}&checkout=${checkout}&guests=${guests}&ski_pass=${skiPass}&transfer=${transfer}&cancel=${cancel}&service=${service}`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-6 rounded-xl transition text-center text-lg shadow-lg">
            ← המשך להזמנה
          </a>
          <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'skishareteam@gmail.com'}`}
            className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-black py-4 px-6 rounded-xl transition text-center text-lg">
            📧 שלח שאלה
          </a>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-600 text-sm mb-1">הצעה זו תקפה ל-30 יום</p>
          <p className="text-gray-400 text-xs">MySki © 2026 · Val Thorens, France</p>
        </div>

      </div>
    </div>
  );
}

export default function QuotePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <QuotePage />
    </Suspense>
  );
}
