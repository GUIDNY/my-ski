"use client";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      dir="rtl"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black transition-all ${
            scrolled ? "bg-blue-600 text-white" : "bg-white/20 text-white backdrop-blur-sm"
          }`}>
            ⛷
          </div>
          <span className={`text-xl font-black tracking-tight transition-colors ${
            scrolled ? "text-gray-900" : "text-white"
          }`}>
            MySki
          </span>
        </a>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Val Thorens", href: "#apartments" },
            { label: "איך זה עובד", href: "#how-it-works" },
            { label: "חבילות", href: "#packages" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:opacity-80 ${
                scrolled ? "text-gray-700" : "text-white/90"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <a
            href="/admin"
            className={`text-sm font-medium transition-colors ${
              scrolled ? "text-gray-600 hover:text-gray-900" : "text-white/80 hover:text-white"
            }`}
          >
            ניהול
          </a>
          <a
            href="#search"
            className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${
              scrolled
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
                : "bg-white text-blue-700 hover:bg-blue-50"
            }`}
          >
            הזמן עכשיו
          </a>
        </div>
      </div>
    </nav>
  );
}
