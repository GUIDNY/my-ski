"use client";
import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { btn, chip } from "@/components/ui";
import { StatusCard } from "@/components/checkout/Checkout";
import { helperWaHref } from "@/lib/helper-whatsapp";

const NEXT_STEPS = [
  "אנחנו בודקים שהכל פנוי ומאשרים את ההזמנה.",
  "רק אחרי האישור הכרטיס מחויב בפועל.",
  "אישור ההזמנה מגיע אליכם במייל, ואפשר לראות אותה גם באזור האישי.",
];

function PaySuccessInner() {
  const params = useSearchParams();
  const order = params.get("order");

  // PayPlus adds the transaction / payment page ids to this redirect; the server
  // checks them with PayPlus before marking anything as paid.
  const transactionUid = params.get("transaction_uid") || params.get("transactionUid") || "";
  const pageRequestUid = params.get("page_request_uid") || params.get("payment_request_uid") || params.get("pageRequestUid") || "";

  // Backup confirmation: if the PayPlus IPN hasn't landed yet, mark the deposit
  // as taken so the order/progress updates immediately (idempotent with the callback).
  useEffect(() => {
    if (!order) return;
    fetch("/api/payplus/confirm", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_code: order, transaction_uid: transactionUid, page_request_uid: pageRequestUid }),
    }).catch(() => {});
  }, [order, transactionUid, pageRequestUid]);

  return (
    <StatusCard tone="ok" title="קיבלנו את הפרטים"
      actions={<>
        <Link href="/my" className={btn.primary}>לאזור האישי</Link>
        <Link href="/" className={btn.outline}>לאתר</Link>
      </>}>
      {order && <span className={chip}>מספר הזמנה <b dir="ltr" className="font-bold">{order.toUpperCase()}</b></span>}
      <p className="text-[16px] md:text-[17px] leading-relaxed text-body max-w-[480px]">
        פרטי התשלום נקלטו והסכום נשמר כפיקדון. נציג SkiShare יאשר את ההזמנה, ורק אחרי האישור יבוצע החיוב בפועל.
      </p>
      <div className="w-full text-start bg-soft border border-line rounded-2xl p-4 md:p-5">
        <div className="font-bold text-[16px] text-ink mb-3">מה קורה עכשיו</div>
        <ol className="flex flex-col gap-2.5">
          {NEXT_STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] text-body leading-relaxed">
              <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-line text-ink text-[13px] font-bold flex items-center justify-center" aria-hidden="true">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="text-[14px] text-muted">
        שאלה על ההזמנה?{" "}
        <a href={helperWaHref("היי, שילמתי באתר ויש לי שאלה על ההזמנה")} target="_blank" rel="noopener noreferrer" className="font-bold text-accent hover:text-accent-hover">כתבו לנו בוואטסאפ</a>
      </p>
    </StatusCard>
  );
}

export default function PaySuccess() {
  return <Suspense fallback={<div className="flex-1 bg-soft" />}><PaySuccessInner /></Suspense>;
}
