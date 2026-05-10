"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";

/* ── Snow ──────────────────────────────────────────────────── */
const FLAKES = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  left:     `${Math.random() * 100}%`,
  size:      Math.random() * 5 + 3,
  dur:       Math.random() * 6 + 5,
  delay:    -Math.random() * 12,
  opacity:   Math.random() * 0.55 + 0.25,
  sway:      Math.random() * 40 - 20,
}));

function Snow() {
  return (
    <>
      <style>{`
        @keyframes snowfall {
          0%   { transform: translateY(-20px) translateX(0px) rotate(0deg); }
          50%  { transform: translateY(50vh) translateX(var(--sway)) rotate(180deg); }
          100% { transform: translateY(110vh) translateX(0px) rotate(360deg); }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {FLAKES.map(f => (
          <div key={f.id} style={{
            position: "absolute",
            left: f.left,
            top: 0,
            width: f.size,
            height: f.size,
            borderRadius: "50%",
            background: "white",
            opacity: f.opacity,
            // @ts-expect-error css var
            "--sway": `${f.sway}px`,
            animation: `snowfall ${f.dur}s ${f.delay}s linear infinite`,
          }} />
        ))}
      </div>
    </>
  );
}

/* ── Mountain silhouette ───────────────────────────────────── */
function Mountains() {
  return (
    <svg viewBox="0 0 800 160" preserveAspectRatio="xMidYMax slice"
      className="absolute bottom-0 left-0 right-0 w-full" style={{ height: 160 }}>
      {/* Back range */}
      <polygon points="0,160 120,60 200,110 300,30 400,90 520,20 620,80 720,40 800,70 800,160" fill="rgba(255,255,255,0.06)" />
      {/* Mid range */}
      <polygon points="0,160 80,90 180,130 280,55 380,100 480,40 580,100 680,60 780,85 800,70 800,160" fill="rgba(255,255,255,0.09)" />
      {/* Front range */}
      <polygon points="0,160 60,110 160,140 240,80 340,125 440,70 540,120 640,85 740,115 800,90 800,160" fill="rgba(255,255,255,0.13)" />
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

  // Close on Escape
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
    setSuccess("נרשמת! אמת את האימייל שלך ואז התחבר.");
    setLoading(false);
  };

  const inp = "w-full border border-white/20 rounded-xl px-4 py-3 text-sm bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-sm";

  return (
    <div
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(6, 15, 45, 0.88)", backdropFilter: "blur(8px)" }}
    >
      {/* Snow */}
      <Snow />
      {/* Mountains */}
      <Mountains />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg, rgba(14,30,74,0.95) 0%, rgba(20,44,100,0.92) 100%)",
          border: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(20px)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top decoration */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd, #60a5fa, #3b82f6)" }} />

        <div className="px-8 pt-8 pb-8">
          {/* Logo */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2.5 mb-2">
              <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                  <path d="M4 24L12 8L20 18L25 12L28 24H4Z" fill="white" />
                </svg>
              </div>
              <span className="text-2xl font-black text-white tracking-tight">MY·SKI</span>
            </div>
            <p className="text-white/50 text-xs tracking-widest uppercase">Val Thorens · Trois Vallées</p>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 bg-white/5 rounded-2xl p-1 border border-white/10">
            {(["login", "signup"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); reset(); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${tab === t
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-white/50 hover:text-white/80"}`}>
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
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="סיסמה" className={inp} dir="ltr" />
            {tab === "signup" && (
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="אימות סיסמה" className={inp} dir="ltr" />
            )}

            {error   && <div className="text-red-300 text-xs bg-red-500/15 rounded-xl px-4 py-2.5 border border-red-400/20">{error}</div>}
            {success && <div className="text-green-300 text-xs bg-green-500/15 rounded-xl px-4 py-2.5 border border-green-400/20">{success}</div>}

            <button
              onClick={tab === "login" ? login : signup}
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-xl font-black text-sm transition-all mt-1
                bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  רגע...
                </span>
              ) : tab === "login" ? "← כניסה" : "← הרשמה"}
            </button>
          </div>

          {/* Close */}
          <button onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
