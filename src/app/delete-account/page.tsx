"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Logo from "@/components/Logo";

export default function DeleteAccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setEmail(session?.user?.email ?? null));
  }, []);

  const deleteAccount = async () => {
    if (!confirm("למחוק את החשבון לצמיתות? כל הנתונים האישיים שלך יימחקו. פעולה זו אינה הפיכה.")) return;
    if (!confirm("אישור אחרון — למחוק את החשבון?")) return;
    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = "/auth"; return; }
    const r = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access_token: session.access_token }) });
    if (r.ok) { await supabase.auth.signOut(); alert("החשבון נמחק. תודה שהיית איתנו 🎿"); window.location.href = "/"; }
    else { setBusy(false); alert("שגיאה במחיקת החשבון. נסו שוב או פנו אלינו."); }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff]" dir="rtl">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-900">→ לאתר</a>
          <a href="/"><Logo className="h-8" /></a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display text-3xl font-black text-gray-900 mb-2">מחיקת חשבון SkiShare</h1>
        <p className="text-gray-500 mb-8">אפשר למחוק את חשבון SkiShare שלך בכל עת, ישירות מכאן או מהאזור האישי באפליקציה.</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-display text-lg font-black text-gray-900 mb-3">איך מוחקים?</h2>
          <ol className="space-y-2 text-gray-600 text-sm list-decimal pr-5">
            <li>התחברו לחשבון שלכם.</li>
            <li>היכנסו ל<a href="/my" className="text-blue-600 hover:underline font-semibold">אזור האישי</a> (או לחצו על הכפתור למטה).</li>
            <li>לחצו על <b>"מחיקת חשבון לצמיתות"</b> ואשרו.</li>
          </ol>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-display text-lg font-black text-gray-900 mb-3">מה נמחק?</h2>
          <ul className="space-y-1.5 text-gray-600 text-sm list-disc pr-5">
            <li>חשבון ההתחברות שלך (אימייל וסיסמה).</li>
            <li>החופשות השמורות והעדפותיך.</li>
            <li>הקישור בין ההזמנות לחשבון מנותק.</li>
          </ul>
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">שים/י לב: רשומות הזמנה ותשלום עשויות להישמר לתקופה מוגבלת לצורכי חשבונאות וחוק, בהתאם ל<a href="/privacy" className="text-blue-600 hover:underline">מדיניות הפרטיות</a>, אך לא יהיו מקושרות עוד לחשבונך.</p>
        </div>

        <button onClick={deleteAccount} disabled={busy}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-display font-black py-3.5 rounded-xl transition mb-3">
          {busy ? "מוחק…" : email ? `מחק את החשבון (${email})` : "התחבר/י ומחק/י את החשבון"}
        </button>

        <div className="flex items-center justify-center gap-4 text-sm">
          <a href="/privacy" className="text-blue-600 hover:underline">מדיניות פרטיות</a>
          <span className="text-gray-300">·</span>
          <a href="/terms" className="text-blue-600 hover:underline">תנאי שימוש</a>
          <span className="text-gray-300">·</span>
          <a href="https://wa.me/972547701899" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">צור קשר</a>
        </div>
      </main>
    </div>
  );
}
