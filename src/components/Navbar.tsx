"use client";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
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
          <span
            className="text-xl font-black tracking-tight"
            style={{ color: scrolled ? "#111" : "white" }}
          >
            MY·SKI
          </span>
        </a>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-1">
          {["אתרי סקי", "אזורי סקי", "חופשות סקי", "מדריכי סקי"].map((item) => (
            <a
              key={item}
              href="#"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: scrolled ? "#374151" : "rgba(255,255,255,0.9)" }}
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            className="text-sm font-medium px-3 py-1.5 transition-colors"
            style={{ color: scrolled ? "#374151" : "rgba(255,255,255,0.85)" }}
          >
            עזרה
          </button>
          <a
            href="/admin"
            className="text-sm font-medium px-3 py-1.5 transition-colors"
            style={{ color: scrolled ? "#374151" : "rgba(255,255,255,0.85)" }}
          >
            הזמנות שלי
          </a>
          <button
            className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all"
            style={{
              borderColor: scrolled ? "#d1d5db" : "rgba(255,255,255,0.5)",
              color: scrolled ? "#374151" : "white",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
