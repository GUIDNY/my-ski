"use client";
import { useState } from "react";
import AdminNav from "@/components/AdminNav";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-gray-950 text-white flex items-center justify-between px-4 h-14">
        <button onClick={() => setOpen(true)} aria-label="תפריט"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <img src="/skishare-logo.png" alt="SkiShare" className="h-7 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
      </header>

      {/* Backdrop (mobile) */}
      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`w-60 bg-gray-950 min-h-screen flex flex-col fixed right-0 top-0 z-50 border-l border-gray-800
        transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"} lg:translate-x-0`}>
        <div className="px-6 py-6 border-b border-gray-800/70 flex items-start justify-between">
          <div>
            <a href="/" className="flex items-center">
              <img src="/skishare-logo.png" alt="SkiShare" className="h-10 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            </a>
            <div className="text-gray-500 text-xs mt-2 tracking-wider uppercase">אזור ניהול</div>
          </div>
          <button onClick={() => setOpen(false)} aria-label="סגור"
            className="lg:hidden text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <AdminNav onNavigate={() => setOpen(false)} />

        <div className="p-3 border-t border-gray-800/70">
          <a href="/" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            חזרה לאתר
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:mr-60 p-4 md:p-8 lg:p-10 min-h-screen">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
