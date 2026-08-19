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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--ivory)" }} dir="rtl">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6" style={{ background: "var(--accent-wash)" }}>
          🎿
        </div>

        <span className="eyebrow block mb-2">הזמנה התקבלה</span>
        <h1 className="font-display text-3xl font-medium mb-2" style={{ color: "var(--charcoal)" }}>ההזמנה התקבלה!</h1>
        <p className="mb-6" style={{ color: "var(--stone)" }}>
          שלחנו אישור לאימייל שלך. נציג שלנו יצור איתך קשר תוך 24 שעות.
        </p>

        {booking && (
          <div className="card-luxury p-6 text-right mb-6">
            <div className="eyebrow mb-3">פרטי הזמנה</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5" style={{ borderBottom: "1px solid rgba(22,32,46,0.06)" }}>
                <span style={{ color: "var(--stone-soft)" }}>מספר הזמנה</span>
                <span className="font-mono font-bold" style={{ color: "var(--charcoal)" }}>{String(id ?? "").slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: "1px solid rgba(22,32,46,0.06)" }}>
                <span style={{ color: "var(--stone-soft)" }}>שם</span>
                <span className="font-semibold" style={{ color: "var(--charcoal)" }}>{String(booking.customer_name ?? "")}</span>
              </div>
              <div className="flex justify-between py-1.5" style={{ borderBottom: "1px solid rgba(22,32,46,0.06)" }}>
                <span style={{ color: "var(--stone-soft)" }}>סה״כ</span>
                <span className="font-bold" style={{ color: "var(--accent-deep)" }}>€{Number(booking.total_price ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span style={{ color: "var(--stone-soft)" }}>סטטוס</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "var(--accent-wash)", color: "var(--accent-deep)" }}>ממתין לאישור</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <a href="/" className="btn-ghost flex-1 py-3.5 text-center">
            חזור לדף הבית
          </a>
          <a href="/book" className="btn-primary flex-1 py-3.5 text-center">
            הזמנה נוספת
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ivory)" }}>טוען...</div>}>
      <ConfirmContent />
    </Suspense>
  );
}
