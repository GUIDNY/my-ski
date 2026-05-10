"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/bookings/${id}`)
      .then(r => r.json())
      .then(setBooking);
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
          🎿
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-2">ההזמנה התקבלה!</h1>
        <p className="text-gray-500 mb-6">
          שלחנו אישור לאימייל שלך. נציג שלנו יצור איתך קשר תוך 24 שעות.
        </p>

        {booking && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-right mb-6 shadow-sm">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">פרטי הזמנה</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">מספר הזמנה</span>
                <span className="font-mono font-bold text-gray-900">{String(id ?? "").slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">שם</span>
                <span className="font-semibold">{String(booking.customer_name ?? "")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">סה״כ</span>
                <span className="font-black text-blue-600">€{Number(booking.total_price ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">סטטוס</span>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold">ממתין לאישור</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <a href="/" className="flex-1 py-3.5 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-center">
            חזור לדף הבית
          </a>
          <a href="/book" className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white transition-colors text-center">
            הזמנה נוספת
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <ConfirmContent />
    </Suspense>
  );
}
