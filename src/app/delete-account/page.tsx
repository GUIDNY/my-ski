"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { PageTop, card, wrap } from "@/components/ui";

export default function DeleteAccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setEmail(session?.user?.email ?? null));
  }, []);

  const deleteAccount = async () => {
    if (!confirm("למחוק את החשבון לצמיתות? כל הנתונים האישיים שלכם יימחקו, ואי אפשר לבטל את זה.")) return;
    if (!confirm("אישור אחרון: למחוק את החשבון?")) return;
    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = "/auth"; return; }
    const r = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access_token: session.access_token }) });
    if (r.ok) { await supabase.auth.signOut(); alert("החשבון נמחק. תודה שהייתם איתנו."); window.location.href = "/"; }
    else { setBusy(false); alert("לא הצלחנו למחוק את החשבון. נסו שוב או כתבו לנו."); }
  };

  const linkCls = "font-bold text-accent hover:text-accent-hover";

  return (
    <div className="flex-1 bg-white" dir="rtl">
      <PageTop soft
        crumbs={[{ label: "דף הבית", href: "/" }, { label: "מחיקת חשבון" }]}
        title="מחיקת חשבון SkiShare"
        sub="אפשר למחוק את החשבון בכל עת, מכאן או מהאזור האישי באפליקציה." />

      <div className={`${wrap} py-8 md:py-10`}>
      <div className="max-w-[760px] flex flex-col gap-5">
        <section className={`${card} p-5 md:p-6`}>
          <h2 className="font-display font-bold text-[20px] text-ink mb-3">איך מוחקים?</h2>
          <ol className="flex flex-col gap-2 text-[16px] text-body list-decimal pr-5 leading-relaxed">
            <li>מתחברים לחשבון.</li>
            <li>נכנסים ל<Link href="/my?tab=account" className={linkCls}>אזור האישי</Link>, או לוחצים על הכפתור כאן למטה.</li>
            <li>לוחצים על &quot;למחוק את החשבון לצמיתות&quot; ומאשרים.</li>
          </ol>
        </section>

        <section className={`${card} p-5 md:p-6`}>
          <h2 className="font-display font-bold text-[20px] text-ink mb-3">מה נמחק?</h2>
          <ul className="flex flex-col gap-1.5 text-[16px] text-body list-disc pr-5 leading-relaxed">
            <li>חשבון ההתחברות (המייל והסיסמה).</li>
            <li>החופשות השמורות וההעדפות.</li>
            <li>הקישור בין ההזמנות לחשבון.</li>
          </ul>
          <p className="text-[14px] text-muted mt-4 leading-relaxed">
            חשוב לדעת: רשומות של הזמנות ותשלומים יכולות להישמר לזמן מוגבל לצורכי הנהלת חשבונות וחוק, לפי <Link href="/privacy" className={linkCls}>מדיניות הפרטיות</Link>, אבל הן כבר לא יהיו מקושרות לחשבון.
          </p>
        </section>

        <button type="button" onClick={deleteAccount} disabled={busy}
          className="w-full min-h-[52px] rounded-[14px] bg-danger hover:bg-[#912018] disabled:opacity-60 text-white font-display font-bold text-[17px] px-5 transition-colors">
          {busy ? "מוחקים…" : email ? <>למחוק את החשבון (<span dir="ltr">{email}</span>)</> : "להתחבר ולמחוק את החשבון"}
        </button>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[15px]">
          <Link href="/privacy" className={linkCls}>מדיניות פרטיות</Link>
          <span className="text-line-strong" aria-hidden="true">·</span>
          <Link href="/terms" className={linkCls}>תנאי שימוש</Link>
          <span className="text-line-strong" aria-hidden="true">·</span>
          <a href="https://wa.me/972547701899" target="_blank" rel="noopener noreferrer" className={linkCls}>צרו קשר</a>
        </div>
      </div>
      </div>
    </div>
  );
}
