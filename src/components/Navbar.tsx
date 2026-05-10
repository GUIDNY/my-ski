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
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled ? "0 1px 0 rgba(0,0,0,0.08)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 24L12 8L20 18L25 12L28 24H4Z" fill={scrolled ? "#1d4ed8" : "white"} />
          </svg>
          <span className="text-xl font-black tracking-tight" style={{ color: scrolled ? "#111" : "white" }}>
            MY·SKI
          </span>
        </a>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-1">
          {["אתרי סקי", "אזורי סקי", "חופשות סקי", "מדריכי סקי"].map(item => (
            <a key={item} href="#"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: scrolled ? "#374151" : "rgba(255,255,255,0.9)" }}>
              {item}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <a href="/admin"
              className="hidden sm:block text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: scrolled ? "#7c3aed" : "rgba(255,255,255,0.9)" }}>
              ניהול
            </a>
          )}
          {user ? (
            <a href="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold transition-all"
              style={{
                borderColor: scrolled ? "#d1d5db" : "rgba(255,255,255,0.4)",
                color: scrolled ? "#374151" : "white",
                background: scrolled ? "transparent" : "rgba(255,255,255,0.1)",
              }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
              האזור שלי
            </a>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                background: scrolled ? "#1d4ed8" : "rgba(255,255,255,0.18)",
                color: "white",
                border: scrolled ? "none" : "1px solid rgba(255,255,255,0.35)",
              }}>
              כניסה / הרשמה
            </button>
          )}
        </div>
      </div>
    </nav>
    </>
  );
}
