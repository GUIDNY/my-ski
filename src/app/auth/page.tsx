"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/AuthModal";

export default function AuthPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <div className="flex-1 bg-soft flex items-start md:items-center justify-center px-4 py-8 md:py-16" dir="rtl">
      <div className="w-full max-w-[460px] flex flex-col gap-4">
        <div className="bg-white rounded-card border border-line px-5 py-8 md:px-8 md:py-10">
          <AuthForm titleAs="h1" onDone={() => router.push("/my")} />
        </div>

        {/* a guest with an order code sees the order without an account (/my?code=…) */}
        <div className="bg-white rounded-card border border-line px-5 py-6 md:px-8 md:py-7">
          <h2 className="font-bold text-[17px] text-ink">יש לכם קוד הזמנה?</h2>
          <p className="text-[14px] leading-relaxed text-body mt-1 mb-3">אפשר לראות את ההזמנה ולעשות צ׳ק-אין גם בלי חשבון, עם הקוד שקיבלתם במייל.</p>
          <form onSubmit={e => { e.preventDefault(); const c = code.trim().toLowerCase(); if (c) router.push(`/my?code=${encodeURIComponent(c)}`); }} className="flex gap-2">
            <label htmlFor="auth-order-code" className="sr-only">קוד הזמנה</label>
            <input id="auth-order-code" value={code} onChange={e => setCode(e.target.value)} dir="ltr" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="k7m2pq"
              className="flex-1 min-w-0 min-h-[48px] rounded-xl border border-line-strong px-4 text-center font-mono tracking-wider text-[16px] text-ink placeholder:text-muted focus:outline-none focus:border-ink" />
            <button type="submit" className="shrink-0 min-h-[48px] px-5 rounded-xl bg-ink text-white font-bold hover:opacity-90 transition-opacity">לצפייה</button>
          </form>
        </div>
      </div>
    </div>
  );
}
