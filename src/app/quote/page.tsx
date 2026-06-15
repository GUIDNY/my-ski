"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Apartment } from "@/types";
import {
  IconMountain, IconBed, IconCalendar, IconCheck, IconChevronLeft,
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
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* Top Nav */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-black text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <IconMountain size={16} className="text-white" />
            </div>
            MySki
          </a>
          <span className="text-sm text-gray-600 font-semibold">הצעת מחיר</span>
        </div>
      </div>

      {/* Hero with Images */}
      {apt && (
        <div className="relative w-full h-80 md:h-96 bg-gray-200 overflow-hidden">
          <img
            src={imgs[imgIdx]}
            alt={apartment}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.3) 100%)" }} />

          {/* Image Counter */}
          {imgs.length > 1 && (
            <>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {imgs.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`}
                  />
                ))}
              </div>

              {/* Nav Arrows */}
              <button
                onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all"
              >
                <IconChevronLeft size={18} className="rotate-180" />
              </button>
              <button
                onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all"
              >
                <IconChevronLeft size={18} />
              </button>
            </>
          )}

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <p className="text-sm font-semibold opacity-90 mb-1">Val Thorens, France</p>
            <h1 className="text-4xl font-black">{apartment}</h1>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Booking Details */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-4">פרטי ההזמנה</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dates */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">תאריכים</p>
                <p className="text-base font-black text-gray-900">{fmtDate(checkin)} — {fmtDate(checkout)}</p>
                <p className="text-sm text-gray-600 mt-1">{nights} לילות</p>
              </div>

              {/* Guests */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">הרכב</p>
                <p className="text-base font-black text-gray-900">{guests} {guests === 1 ? "אדם" : "אנשים"}</p>
              </div>

              {/* Price Per Night */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">מחיר ממוצע</p>
                <p className="text-base font-black text-blue-600">€{Math.round(aptTotal / nights)}/לילה</p>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-wider">פירוט מחיר</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">לינה × {nights} לילות</span>
                <span className="font-bold text-gray-900">€{aptTotal.toLocaleString()}</span>
              </div>
              {transfer && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">הסעה הלוך-חזור</span>
                  <span className="font-bold text-gray-900">€{TRANSFER_PRICE}</span>
                </div>
              )}
              {cancel === "flexible" && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">מדיניות גמישה × {guests}</span>
                  <span className="font-bold text-gray-900">€{(FLEXIBLE_EXTRA * guests).toLocaleString()}</span>
                </div>
              )}
              {service === "ai" && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">הנחת AI × {guests}</span>
                  <span className="font-bold text-indigo-600">−€{(AI_DISCOUNT * guests).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="p-6 bg-gray-900 text-white flex justify-between items-end">
            <div>
              <p className="text-sm opacity-70 mb-1">סה״כ לתשלום</p>
              <p className="text-xs opacity-60">עבור {guests} {guests === 1 ? "אדם" : "אנשים"} · {nights} לילות</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-black">€{grandTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Add-ons Available */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            ➕ תוספות זמינות
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 transition-colors">
              <p className="font-semibold text-gray-900">סקי פס</p>
              <p className="text-sm text-gray-600 mt-1">6 ימים, כל אזור Trois Vallées</p>
              <p className="text-lg font-black text-blue-600 mt-2">€280</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 transition-colors">
              <p className="font-semibold text-gray-900">השכרת ציוד</p>
              <p className="text-sm text-gray-600 mt-1">סט מלא - רמת פרימיום</p>
              <p className="text-lg font-black text-blue-600 mt-2">€150</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 transition-colors">
              <p className="font-semibold text-gray-900">ביטוח סקי</p>
              <p className="text-sm text-gray-600 mt-1">כיסוי מלא כולל חילוץ</p>
              <p className="text-lg font-black text-blue-600 mt-2">€45</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 transition-colors">
              <p className="font-semibold text-gray-900">הסעות</p>
              <p className="text-sm text-gray-600 mt-1">משדה התעופה וחזרה</p>
              <p className="text-lg font-black text-blue-600 mt-2">€80</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-gray-900">💳 דרכי תשלום</h3>

          <div className="space-y-4">
            {/* Bank Transfer */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <p className="font-bold text-gray-900 mb-3">העברה בנקאית</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">בנק</span>
                  <span className="font-semibold text-gray-900">{process.env.NEXT_PUBLIC_BANK_NAME || "בנק הפועלים"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IBAN</span>
                  <span className="font-mono font-bold text-gray-900">{process.env.NEXT_PUBLIC_BANK_IBAN || "IL62012673000000026026"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SWIFT</span>
                  <span className="font-semibold text-gray-900">{process.env.NEXT_PUBLIC_BANK_SWIFT || "POALILIT"}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-600">בעל חשבון</span>
                  <span className="font-semibold text-gray-900">{process.env.NEXT_PUBLIC_BANK_ACCOUNT || "MySki Ltd"}</span>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                ✓ בעד קבלת ההעברה, אנחנו נאשר את ההזמנה והדירה תהיה שלך
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-1">הצעה זו תקפה ל-30 יום</p>
          <p className="text-xs text-gray-400">MySki © 2026 · Val Thorens</p>
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
