"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { IconMountain } from "@/components/Icons";
import Logo from "@/components/Logo";

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
    if (e) { setError(e.message); setLoading(false); return; }
    router.push("/profile");
  };

  const signup = async () => {
    if (password !== confirm) { setError("הסיסמאות אינן תואמות"); return; }
    if (password.length < 6)  { setError("סיסמה חייבת להכיל לפחות 6 תווים"); return; }
    setLoading(true); setError("");
    const { error: e } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: "user" } },
    });
    if (e) { setError(e.message); setLoading(false); return; }
    setSuccess("נרשמת בהצלחה! אמת את האימייל שלך ואז התחבר.");
    setLoading(false);
  };

  const input = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="flex items-center"><Logo className="h-9" /></a>
          <p className="text-gray-500 text-sm mt-2">Val Thorens · חבילות סקי מנוהלות</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(["login", "signup"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                className={`flex-1 py-4 text-sm font-bold transition-colors
                  ${tab === t ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                {t === "login" ? "כניסה" : "הרשמה"}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {tab === "signup" && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">שם מלא</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="ישראל ישראלי" className={input} />
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">אימייל</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="israel@example.com" className={input} dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">סיסמה</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="לפחות 6 תווים" className={input} dir="ltr" />
            </div>
            {tab === "signup" && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">אימות סיסמה</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="חזור על הסיסמה" className={input} dir="ltr" />
              </div>
            )}

            {error   && <div className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</div>}
            {success && <div className="text-green-600 text-sm bg-green-50 rounded-xl px-4 py-3">{success}</div>}

            <button
              onClick={tab === "login" ? login : signup}
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm transition-colors">
              {loading ? "אנא המתן..." : tab === "login" ? "← כניסה" : "← הרשמה"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          בכניסה לאתר אתה מסכים ל
          <a href="/cancellation-policy" className="text-blue-600 hover:underline mx-1">תנאי השירות</a>
          של SkiShare
        </p>
      </div>
    </div>
  );
}
