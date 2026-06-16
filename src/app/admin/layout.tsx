import type { Metadata } from "next";
import "../globals.css";
import AdminNav from "@/components/AdminNav";

export const metadata: Metadata = { title: "SkiShare — ניהול" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-60 bg-gray-950 min-h-screen flex flex-col fixed right-0 top-0 z-40 border-l border-gray-800">
          <div className="px-6 py-6 border-b border-gray-800/70">
            <a href="/" className="flex items-center">
              <img src="/skishare-logo.png" alt="SkiShare" className="h-10 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            </a>
            <div className="text-gray-500 text-xs mt-2 tracking-wider uppercase">אזור ניהול</div>
          </div>

          <AdminNav />

          <div className="p-3 border-t border-gray-800/70 space-y-1">
            <a href="/" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              חזרה לאתר
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 mr-60 p-6 md:p-10 min-h-screen">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </body>
    </html>
  );
}
