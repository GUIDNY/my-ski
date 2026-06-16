import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = { title: "SkiShare — ניהול" };

const navLinks = [
  { href: "/admin", label: "📊 דשבורד" },
  { href: "/admin/apartments", label: "🏠 דירות" },
  { href: "/admin/season-rentals", label: "❄️ דירות סזונרים" },
  { href: "/admin/bookings", label: "📋 הזמנות" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-56 bg-gray-900 min-h-screen flex flex-col fixed right-0 top-0 z-40">
          <div className="px-5 py-6 border-b border-gray-800">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm">⛷</div>
              <span className="text-white font-black text-lg">SkiShare</span>
            </a>
            <div className="text-gray-500 text-xs mt-1 mr-10">אזור ניהול</div>
          </div>
          <nav className="flex-1 py-4 px-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800">
            <a href="/" className="text-gray-500 hover:text-white text-xs transition-colors">
              ← חזור לאתר
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 mr-56 p-8 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
