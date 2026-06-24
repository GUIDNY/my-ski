"use client";
import Logo from "@/components/Logo";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";

/* ── Stars ─────────────────────────────────────────────────── */
const STARS = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  left:    `${Math.random() * 100}%`,
  top:     `${Math.random() * 72}%`,
  size:     Math.random() * 1.8 + 0.4,
  opacity:  Math.random() * 0.65 + 0.2,
  dur:      Math.random() * 4 + 2,
  delay:    Math.random() * 4,
}));

function Stars() {
  return (
    <>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: var(--star-op); }
          50%       { opacity: calc(var(--star-op) * 0.25); }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {STARS.map(s => (
          <div key={s.id} style={{
            position:     "absolute",
            left:          s.left,
            top:           s.top,
            width:         s.size,
            height:        s.size,
            borderRadius: "50%",
            background:   "white",
            "--star-op":   s.opacity,
            opacity:       s.opacity,
            animation:    `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          } as React.CSSProperties} />
        ))}
      </div>
    </>
  );
}

/* ── Mountain silhouette ───────────────────────────────────── */
function Mountains() {
  return (
    <svg viewBox="0 0 1200 280" preserveAspectRatio="xMidYMax slice"
      className="absolute bottom-0 left-0 right-0 w-full pointer-events-none" style={{ height: 280 }}>
      <polygon points="0,280 160,110 300,170 430,70 570,145 700,55 840,125 1000,65 1120,130 1200,85 1200,280" fill="#0e2a42" />
      <polygon points="0,280 110,155 230,195 340,105 470,165 600,82 730,155 870,95 1010,152 1140,105 1200,130 1200,280" fill="#091f33" />
      <polygon points="0,280 80,205 200,238 310,162 420,215 530,145 650,205 780,155 900,212 1050,168 1160,200 1200,178 1200,280" fill="#061525" />
    </svg>
  );
}

/* ── Modal ─────────────────────────────────────────────────── */
type Props = { onClose: () => void; onAuth: () => void };

export default function AuthModal({ onClose, onAuth }: Props) {
  const [tab,      setTab]      = useState<"login" | "signup">("login");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  const reset = () => { setError(""); setSuccess(""); };

  const login = async () => {
    setLoading(true); reset();
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) { setError(e.message); setLoading(false); return; }
    onAuth();
    onClose();
  };

  const signup = async () => {
    if (password !== confirm) { setError("הסיסמאות אינן תואמות"); return; }
    if (password.length < 6)  { setError("סיסמה חייבת להכיל לפחות 6 תווים"); return; }
    setLoading(true); reset();
    const { error: e } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: "user" } },
    });
    if (e) { setError(e.message); setLoading(false); return; }
    setSuccess("נרשמת! תוכל להתחבר עכשיו.");
    setLoading(false);
  };

  const inp = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  return (
    <div
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(160deg, #060f1e 0%, #0a1e35 35%, #0b2535 65%, #07141f 100%)",
      }}
    >
      {/* Stars */}
      <Stars />

      {/* Mountains */}
      <Mountains />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
        style={{
          background:     "rgba(10, 22, 45, 0.82)",
          border:         "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(24px)",
          boxShadow:      "0 32px 80px rgba(0,0,0,0.6)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-8 pt-8 pb-7">

          {/* Close */}
          <button onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Logo */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center mb-2">
              <Logo className="h-12" white />
            </div>
            <p className="text-white/35 text-[10px] tracking-[0.2em] uppercase">Val Thorens · Trois Vallées</p>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 rounded-xl overflow-hidden border border-white/10">
            {(["login", "signup"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); reset(); }}
                className={`flex-1 py-2.5 text-sm font-bold transition-all ${
                  tab === t
                    ? "bg-blue-600 text-white"
                    : "text-white/40 hover:text-white/70 bg-transparent"
                }`}>
                {t === "login" ? "כניסה" : "הרשמה"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="space-y-3" dir="rtl">
            {tab === "signup" && (
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="שם מלא" className={inp} />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="כתובת אימייל" className={inp} dir="ltr" />
            <div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="סיסמה" className={inp} dir="ltr" />
              {tab === "login" && (
                <button className="text-xs text-white/35 hover:text-white/60 mt-1.5 mr-1 transition-colors">
                  שכחת סיסמה?
                </button>
              )}
            </div>
            {tab === "signup" && (
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="אימות סיסמה" className={inp} dir="ltr" />
            )}

            {error   && <div className="text-red-300 text-xs bg-red-500/15 rounded-xl px-4 py-2.5 border border-red-400/20 text-right">{error}</div>}
            {success && <div className="text-green-300 text-xs bg-green-500/15 rounded-xl px-4 py-2.5 border border-green-400/20 text-right">{success}</div>}

            <button
              onClick={tab === "login" ? login : signup}
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-xl font-black text-sm transition-all mt-1 text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  רגע...
                </span>
              ) : tab === "login" ? "← כניסה" : "← הרשמה"}
            </button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 flex flex-col items-center gap-2">
        <a href="/delete-account" className="text-white/40 hover:text-white/80 text-xs underline transition-colors">ניתן למחוק את החשבון בכל עת</a>
        <p className="text-white/20 text-[10px] tracking-widest uppercase">SKISHARE. ALL RIGHTS RESERVED 2026 ©</p>
      </div>
    </div>
  );
}
