"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import SkierAvatar from "@/components/SkierAvatar";

const C = { primary: "#0e3566", accent: "#0060ac" };

export default function AuthPage() {
  const router = useRouter();
  const [tab,      setTab]      = useState<"login" | "signup">("login");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const login = async () => {
    setLoading(true); setError("");
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) { setError("אימייל או סיסמה שגויים"); setLoading(false); return; }
    router.push("/my");
  };

  const signup = async () => {
    if (password !== confirm) { setError("הסיסמאות אינן תואמות"); return; }
    if (password.length < 6)  { setError("סיסמה חייבת להכיל לפחות 6 תווים"); return; }
    setLoading(true); setError("");
    const { data, error: e } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: "user" } },
    });
    if (e) { setError(e.message); setLoading(false); return; }
    if (data.session) { router.push("/my"); return; }       // auto-confirm on → straight in
    setSuccess("נרשמת בהצלחה! אמת את האימייל שלך ואז התחבר.");
    setLoading(false);
  };

  const submit = () => (tab === "login" ? login() : signup());
  const input = "w-full rounded-xl px-4 py-3.5 text-[15px] bg-[#eff4ff] border border-transparent focus:bg-white focus:border-[#0060ac] focus:ring-2 focus:ring-[#0060ac]/30 focus:outline-none transition";

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Visual side (desktop) */}
      <div className="hidden lg:block relative w-1/2">
        <img src="/view.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(14,53,102,0.85), rgba(11,31,58,0.65))" }} />
        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <img src="/skishare-logo.png" alt="SkiShare" className="h-9 w-auto brightness-0 invert" />
          <div>
            <h2 className="font-display text-4xl font-black leading-tight mb-3">החופשה הבאה שלך<br/>מתחילה כאן ⛷️</h2>
            <p className="text-white/80 text-lg">שמור דירות שאהבת, נהל את ההזמנות שלך, וקבל את כל הפרטים במקום אחד.</p>
          </div>
          <p className="text-white/50 text-sm">SkiShare · Val Thorens, Trois Vallées</p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 bg-[#f8f9ff]">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-7">
            <SkierAvatar size={72} />
            <h1 className="font-display text-2xl font-black mt-4" style={{ color: C.primary }}>
              {tab === "login" ? "ברוך הבא בחזרה" : "יצירת חשבון"}
            </h1>
            <p className="text-[#43474f] text-sm mt-1">האזור האישי של SkiShare</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#c3c6d0]/40 shadow-[0_8px_30px_rgba(14,53,102,0.08)] overflow-hidden">
            <div className="flex p-1.5 m-3 bg-[#eff4ff] rounded-xl">
              {(["login", "signup"] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${tab === t ? "bg-white shadow-sm" : "text-[#43474f]"}`}
                  style={tab === t ? { color: C.primary } : {}}>
                  {t === "login" ? "כניסה" : "הרשמה"}
                </button>
              ))}
            </div>

            <div className="px-6 pb-6 pt-2 space-y-4">
              {tab === "signup" && (
                <div>
                  <label className="text-xs font-bold text-[#43474f] block mb-1.5">שם מלא</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי" className={input} />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-[#43474f] block mb-1.5">אימייל</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="israel@example.com" className={input} dir="ltr" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#43474f] block mb-1.5">סיסמה</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="לפחות 6 תווים" className={input} dir="ltr" />
              </div>
              {tab === "signup" && (
                <div>
                  <label className="text-xs font-bold text-[#43474f] block mb-1.5">אימות סיסמה</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="חזור על הסיסמה" className={input} dir="ltr" />
                </div>
              )}

              {error   && <div className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</div>}
              {success && <div className="text-green-700 text-sm bg-green-50 rounded-xl px-4 py-3">{success}</div>}

              <button onClick={submit} disabled={loading || !email || !password}
                className="w-full py-3.5 rounded-xl text-white font-black text-[15px] transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.99]"
                style={{ background: C.primary }}>
                {loading ? "אנא המתן..." : tab === "login" ? "כניסה ←" : "הרשמה ←"}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-[#43474f] mt-5">
            בכניסה לאתר אתה מסכים ל
            <a href="/terms" className="mx-1 hover:underline" style={{ color: C.accent }}>תנאי השירות</a>
            של SkiShare
          </p>
          <p className="text-center mt-3">
            <a href="/" className="text-sm text-[#43474f] hover:text-[#0e3566]">→ חזרה לאתר</a>
          </p>
        </div>
      </div>
    </div>
  );
}
