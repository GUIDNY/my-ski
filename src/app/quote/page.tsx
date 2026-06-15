"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconMountain, IconBed, IconCalendar, IconCheck,
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
  const avgNightly = parseInt(params.get("avg_nightly") ?? "0");

  const today = new Date();
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <IconMountain size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">MySki</h1>
          </div>
          <p className="text-gray-500 text-sm">הצעת מחיר ל-{apartment}</p>
        </div>

        {/* Quote Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 mb-6">

          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">הצעת מחיר</p>
                <h2 className="text-2xl font-black text-gray-900">{apartment}</h2>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  <IconMountain size={14} className="text-blue-500" />
                  Val Thorens, France
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">מתאריך</p>
                <p className="text-sm font-bold text-gray-800">{dateStr}</p>
              </div>
            </div>

            {/* Dates & Guests */}
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <IconCalendar size={14} className="text-blue-500" />
                <span className="font-semibold">{fmtDate(checkin)} — {fmtDate(checkout)}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-bold">{nights}</span>
                  <span>לילות</span>
                </span>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1">
                  <span className="font-bold">{guests}</span>
                  <span>{guests === 1 ? "אדם" : "אנשים"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-black text-gray-900 mb-4">פירוט מחיר</h3>

            <div className="space-y-3">
              {/* Accommodation */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-700">
                  <span className="font-semibold">לינה</span>
                  <span className="text-sm text-gray-500 mr-1">× {nights} לילות</span>
                </span>
                <span className="font-bold text-gray-900">€{aptTotal.toLocaleString()}</span>
              </div>

              {/* Ski Pass */}
              {skiPass && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-700">
                    <span className="font-semibold">סקי פס</span>
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mr-2">בקרוב</span>
                  </span>
                  <span className="text-xs font-semibold text-amber-600">לא כלול בהצעה</span>
                </div>
              )}

              {/* Transfer */}
              {transfer && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-700 font-semibold">הסעה הלוך-חזור</span>
                  <span className="font-bold text-gray-900">€{TRANSFER_PRICE}</span>
                </div>
              )}

              {/* Cancellation */}
              {cancel === "flexible" && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-700">
                    <span className="font-semibold">מדיניות גמישה</span>
                    <span className="text-sm text-green-600 mr-1">80% החזר</span>
                  </span>
                  <span className="font-bold text-gray-900">€{(FLEXIBLE_EXTRA * guests).toLocaleString()}</span>
                </div>
              )}

              {/* Service */}
              {service === "ai" && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-700 font-semibold">הנחת AI</span>
                  <span className="font-bold text-indigo-600">−€{(AI_DISCOUNT * guests).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Selected Options */}
          {(skiPass || transfer || cancel !== "none" || service !== "human") && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">בחירות</p>
              <div className="flex flex-wrap gap-2">
                {skiPass && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded-full px-2 py-1">
                    <IconCheck size={12} className="text-green-500" />
                    סקי פס
                  </span>
                )}
                {transfer && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded-full px-2 py-1">
                    <IconCheck size={12} className="text-green-500" />
                    הסעה הלוך-חזור
                  </span>
                )}
                {cancel === "flexible" && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded-full px-2 py-1">
                    <IconCheck size={12} className="text-green-500" />
                    ביטול גמיש
                  </span>
                )}
                {service === "ai" && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 rounded-full px-2 py-1">
                    <IconCheck size={12} className="text-green-500" />
                    AI בלבד
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="px-6 py-6 bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">סה״כ</p>
                <p className="text-white text-xs font-semibold">עבור {guests} {guests === 1 ? "אדם" : "אנשים"} · {nights} לילות</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-white mb-1">€{grandTotal.toLocaleString()}</p>
                <p className="text-white/60 text-sm">~€{Math.round(grandTotal / nights)} / לילה</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-black text-gray-900 mb-4">עלויות התשלום</h3>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-gray-600 font-medium">בנק</span>
              <span className="font-semibold text-gray-900 text-right">{process.env.NEXT_PUBLIC_BANK_NAME || "בנק הפועלים"}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-600 font-medium">IBAN</span>
              <span className="font-mono font-bold text-gray-900 text-right text-sm">{process.env.NEXT_PUBLIC_BANK_IBAN || "IL62012673000000026026"}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-600 font-medium">SWIFT</span>
              <span className="font-semibold text-gray-900 text-right">{process.env.NEXT_PUBLIC_BANK_SWIFT || "POALILIT"}</span>
            </div>
            <div className="flex justify-between items-start pt-3 border-t border-gray-300">
              <span className="text-gray-600 font-medium">בעל חשבון</span>
              <span className="font-semibold text-gray-900 text-right">{process.env.NEXT_PUBLIC_BANK_ACCOUNT || "Account Holder"}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            ✓ בעד קבלת ההעברה, אנחנו נאשר את ההזמנה והדירה תהיה שלך
          </p>
        </div>

        {/* Footer */}
        <div className="text-center py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-1">הצעה זו תקפה ל-30 יום</p>
          <p className="text-xs text-gray-400">
            MySki © 2026 · Val Thorens
          </p>
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
