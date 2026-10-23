"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { btn } from "@/components/ui";
import { StatusCard, SumRow, Tag } from "@/components/checkout/Checkout";

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

  // the API answers { error } when the booking isn't there: show the message without details
  const ok = !!booking && !booking.error;

  return (
    <StatusCard tone="ok" title="ההזמנה התקבלה"
      actions={<>
        <Link href="/search" className={btn.primary}>הזמנה נוספת</Link>
        <Link href="/" className={btn.outline}>חזרה לדף הבית</Link>
      </>}>
      <p className="text-[16px] md:text-[17px] leading-relaxed text-body max-w-[460px]">
        שלחנו אישור למייל שלכם. נציג שלנו יחזור אליכם תוך 24 שעות.
      </p>

      {ok && (
        <div className="w-full text-start border border-line rounded-2xl p-4 md:p-5 flex flex-col gap-3">
          <div className="text-[14px] font-bold text-muted">פרטי ההזמנה</div>
          <SumRow label="מספר הזמנה" value={<span dir="ltr" className="font-mono">{String(id ?? "").slice(0, 8).toUpperCase()}</span>} />
          <SumRow label="שם" value={String(booking.customer_name ?? "")} />
          <SumRow label="סה״כ" value={`€${Number(booking.total_price ?? 0).toLocaleString()}`} />
          <SumRow label="סטטוס" value={<Tag tone="warn">ממתין לאישור</Tag>} />
        </div>
      )}
    </StatusCard>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-soft" />}>
      <ConfirmContent />
    </Suspense>
  );
}
