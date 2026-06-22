"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { IconCheck } from "@/components/Icons";

function PaySuccessInner() {
  const params = useSearchParams();
  const order = params.get("order");

  // Backup confirmation: if the PayPlus IPN hasn't landed yet, mark the deposit
  // as taken so the order/progress updates immediately (idempotent with the callback).
  useEffect(() => {
    if (!order) return;
    fetch("/api/payplus/confirm", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_code: order }),
    }).catch(() => {});
  }, [order]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center text-center px-6" dir="rtl">
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
        <IconCheck size={36} />
      </div>
      <h1 className="font-display text-3xl font-black text-slate-900 mb-2">קיבלנו את הפרטים! 🎿</h1>
      <p className="text-slate-500 max-w-md mb-8">פרטי התשלום נקלטו והסכום נשמר כפיקדון. נציג SkiShare יאשר את ההזמנה, ורק לאחר האישור יבוצע החיוב בפועל. אישור הזמנה יישלח אליך במייל.</p>
      <div className="flex gap-3">
        <a href="/my" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition">לאזור האישי</a>
        <a href="/" className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold px-8 py-3.5 rounded-xl transition">לאתר</a>
      </div>
    </div>
  );
}

export default function PaySuccess() {
  return <Suspense fallback={<div className="min-h-screen bg-[#f7f9fb]" />}><PaySuccessInner /></Suspense>;
}
