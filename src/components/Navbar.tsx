"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [user,       setUser]       = useState<User | null>(null);
  const [showAuth,   setShowAuth]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);

    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null));
    return () => { window.removeEventListener("scroll", onScroll); subscription.unsubscribe(); };
  }, []);

  const isAdmin = user?.user_metadata?.role === "admin" || user?.email === "bd12123@gmail.com";

  return (
    <>
    {showAuth && (
      <AuthModal
        onClose={() => setShowAuth(false)}
        onAuth={() => supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))}
      />
    )}
    <nav
      dir="rtl"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(11,15,20,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--ink-line)" : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <img src="/skishare-logo.png" alt="SkiShare"
            className="h-10 w-auto transition-all"
            style={{ filter: "brightness(0) invert(1)" }} />
        </a>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-1">
          <a href="/apartments"
            className="px-4 py-2 text-sm font-medium transition-colors hover:text-white"
            style={{ color: "rgba(250,247,241,0.78)" }}>
            דירות
          </a>
          <a href="/transfers"
            className="px-4 py-2 text-sm font-medium transition-colors hover:text-white"
            style={{ color: "rgba(250,247,241,0.78)" }}>
            הסעות
          </a>
          <a href="/seasonaires"
            className="px-4 py-2 text-sm font-bold transition-colors flex items-center gap-1.5"
            style={{ color: "var(--gold-light)" }}>
            ❄ אזור הסיזיונרים
          </a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <a href="/admin"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors border"
              style={{ borderColor: "var(--ink-line-strong)", color: "var(--gold-light)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              ניהול
            </a>
          )}
          {user ? (
            <a href="/my"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-semibold transition-all hover:border-[var(--gold)]"
              style={{ borderColor: "var(--ink-line-strong)", color: "var(--ivory)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
              האזור שלי
            </a>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="btn-gold px-5 py-2 text-sm"
            >
              כניסה / הרשמה
            </button>
          )}
        </div>
      </div>
    </nav>
    </>
  );
}
