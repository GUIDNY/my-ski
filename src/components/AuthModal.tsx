"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { buildWaHref } from "@/lib/whatsapp";
import { btn, field, fieldLabel } from "@/components/ui";

/*
 * Sign in / sign up. AuthForm is the form itself (also used by the /auth page);
 * AuthModal opens it over the page: a centered card on desktop, a full-screen
 * sheet on the phone.
 */

// Supabase answers in English: show the common cases in simple Hebrew.
function heError(message: string): string {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "אימייל או סיסמה שגויים";
  if (m.includes("email not confirmed")) return "עוד לא אישרתם את המייל. חפשו אצלכם מייל מ-SkiShare (גם בספאם) ולחצו על הקישור.";
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("already exists")) return "יש כבר חשבון עם המייל הזה. אפשר להיכנס בלשונית \"כניסה\".";
  if (m.includes("password") && (m.includes("at least") || m.includes("6 characters") || m.includes("weak"))) return "הסיסמה צריכה להיות לפחות 6 תווים";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) return "היו יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.";
  if (m.includes("invalid email") || m.includes("unable to validate email") || m.includes("invalid format")) return "כתובת המייל לא נראית תקינה";
  return "משהו לא עבד. נסו שוב, ואם זה חוזר כתבו לנו בוואטסאפ.";
}

const FORGOT_HREF = buildWaHref({ intro: "היי, שכחתי את הסיסמה לאזור האישי באתר", lines: [] });

/** The sign in / sign up form. onDone runs once the visitor is signed in. */
export function AuthForm({ onDone, autoFocus = false, titleAs = "h2" }: { onDone: () => void; autoFocus?: boolean; titleAs?: "h1" | "h2" }) {
  const uid = useId();
  const [tab,      setTab]      = useState<"login" | "signup">("login");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const reset = () => { setError(""); setSuccess(""); };

  const login = async () => {
    setLoading(true); reset();
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) { setError(heError(e.message)); setLoading(false); return; }
    setLoading(false);
    onDone();
  };

  const signup = async () => {
    if (password !== confirm) { setError("הסיסמאות לא זהות"); return; }
    if (password.length < 6)  { setError("הסיסמה צריכה להיות לפחות 6 תווים"); return; }
    setLoading(true); reset();
    const { data, error: e } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: "user" } },
    });
    if (e) { setError(heError(e.message)); setLoading(false); return; }
    setLoading(false);
    if (data.session) { onDone(); return; }   // no email confirmation needed: already signed in
    setSuccess("נרשמתם! שלחנו לכם מייל לאישור. אחרי שתלחצו על הקישור במייל אפשר להיכנס.");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (loading || !email || !password) return;
    if (tab === "login") login(); else signup();
  };

  const isLogin = tab === "login";
  const id = (k: string) => `${uid}-${k}`;
  const Title = titleAs;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/skishare-mark.png" alt="" aria-hidden="true" className="h-8 w-auto" />
        <Title id={id("title")} className="font-display font-bold text-[26px] leading-tight text-ink">
          {isLogin ? "כניסה לאזור האישי" : "יצירת חשבון"}
        </Title>
        <p className="text-[15px] leading-relaxed text-muted max-w-[320px]">
          ההזמנות שלכם והחופשות ששמרתם, במקום אחד.
        </p>
      </div>

      <div role="tablist" aria-label="כניסה או הרשמה" className="grid grid-cols-2 gap-1 p-1 bg-soft rounded-[14px]">
        {(["login", "signup"] as const).map(t => (
          <button key={t} type="button" role="tab" aria-selected={tab === t}
            onClick={() => { setTab(t); reset(); }}
            className={`min-h-[44px] rounded-[11px] text-[15px] font-bold transition-colors ${tab === t ? "bg-white text-ink shadow-[0_1px_3px_rgba(11,27,51,0.12)]" : "text-muted hover:text-ink"}`}>
            {t === "login" ? "כניסה" : "הרשמה"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {!isLogin && (
          <div>
            <label htmlFor={id("name")} className={fieldLabel}>שם מלא</label>
            <input id={id("name")} value={name} onChange={e => setName(e.target.value)} autoComplete="name" className={field} />
          </div>
        )}
        <div>
          <label htmlFor={id("email")} className={fieldLabel}>אימייל</label>
          <input id={id("email")} type="email" inputMode="email" autoComplete="email" dir="ltr" autoFocus={autoFocus}
            value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com"
            className={`${field} text-left`} />
        </div>
        <div>
          <label htmlFor={id("password")} className={fieldLabel}>סיסמה</label>
          <input id={id("password")} type="password" dir="ltr" autoComplete={isLogin ? "current-password" : "new-password"}
            value={password} onChange={e => setPassword(e.target.value)} placeholder={isLogin ? "" : "לפחות 6 תווים"}
            className={`${field} text-left`} />
          {isLogin && (
            <a href={FORGOT_HREF} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center min-h-[36px] mt-1 text-[14px] text-muted hover:text-ink transition-colors">
              שכחתם את הסיסמה? כתבו לנו
            </a>
          )}
        </div>
        {!isLogin && (
          <div>
            <label htmlFor={id("confirm")} className={fieldLabel}>הסיסמה שוב</label>
            <input id={id("confirm")} type="password" dir="ltr" autoComplete="new-password"
              value={confirm} onChange={e => setConfirm(e.target.value)} className={`${field} text-left`} />
          </div>
        )}

        {error && <div role="alert" className="text-[14px] leading-relaxed text-danger bg-danger-soft rounded-xl px-4 py-3">{error}</div>}
        {success && <div role="status" className="text-[14px] leading-relaxed text-ok-text bg-ok-soft rounded-xl px-4 py-3">{success}</div>}

        <button type="submit" disabled={loading || !email || !password} className={`${btn.primary} w-full mt-1`}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              רגע…
            </span>
          ) : isLogin ? "כניסה" : "יצירת חשבון"}
        </button>
      </form>

      <p className="text-[13px] leading-relaxed text-muted text-center">
        בכניסה אתם מסכימים ל<Link href="/terms" className="font-bold text-accent hover:text-accent-hover">תנאי השירות</Link>.
        {" "}<Link href="/delete-account" className="underline hover:text-ink">אפשר למחוק את החשבון בכל עת</Link>.
      </p>
    </div>
  );
}

/* ── Modal ─────────────────────────────────────────────────── */
type Props = { onClose: () => void; onAuth: () => void };

export default function AuthModal({ onClose, onAuth }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center bg-ink/45 md:p-6"
      dir="rtl"
    >
      <div role="dialog" aria-modal="true" aria-label="כניסה לאזור האישי"
        className="relative w-full h-[100dvh] md:h-auto md:max-h-[calc(100dvh-48px)] md:max-w-[440px] bg-white md:rounded-card md:border md:border-line overflow-y-auto overscroll-contain shadow-pop"
        onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="סגירה"
          className="absolute top-3 left-3 w-11 h-11 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-soft transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div className="px-5 md:px-8 pt-14 md:pt-10 pb-8" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
          <AuthForm autoFocus onDone={() => { onAuth(); onClose(); }} />
        </div>
      </div>
    </div>
  );
}
