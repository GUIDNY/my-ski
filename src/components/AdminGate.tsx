"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { isAdminEmail } from "@/lib/admins";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "no">("loading");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user;
      const ok = isAdminEmail(u?.email) || u?.user_metadata?.role === "admin";
      setState(ok ? "ok" : "no");
    });
  }, []);

  if (state === "loading") return <div className="p-10 text-center text-gray-400" dir="rtl">בודק הרשאה…</div>;
  if (state === "no") return (
    <div dir="rtl" className="p-10 text-center max-w-md mx-auto">
      <p className="text-4xl mb-3">🔒</p>
      <p className="font-black text-gray-900 text-lg mb-1">אין לך הרשאת ניהול</p>
      <p className="text-gray-500 text-sm mb-4">היכנס/י עם חשבון מנהל כדי לגשת לאזור זה.</p>
      <a href="/auth" className="inline-block bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl">התחברות</a>
    </div>
  );
  return <>{children}</>;
}
