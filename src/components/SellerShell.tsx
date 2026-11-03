"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { isAdminEmail } from "@/lib/admins";
import { sellerByEmail } from "@/lib/sellers";

/*
 * The seller area (/seller): a salesperson from lib/sellers.ts, or Idan (who sees
 * every seller and decides whose orders are whose). The API checks again on every call.
 */
const LINKS = [
  { href: "/seller", label: "דשבורד", icon: "▦" },
  { href: "/seller/chats", label: "לידים וצ׳אטים", icon: "💬" },
  { href: "/seller/quotes", label: "הצעות מחיר", icon: "📄" },
  { href: "/seller/orders", label: "הזמנות ורווח", icon: "💶" },
  { href: "/seller/customers", label: "לקוחות", icon: "⭐" },
];

export default function SellerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState<{ state: "loading" | "ok" | "no"; name: string; admin: boolean }>({ state: "loading", name: "", admin: false });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email;
      const admin = isAdminEmail(email) || session?.user?.app_metadata?.role === "admin";
      const seller = sellerByEmail(email);
      setWho({ state: admin || seller ? "ok" : "no", name: seller?.name || (admin ? "מנהל" : ""), admin });
    });
  }, []);

  if (who.state === "loading") return <div className="p-10 text-center text-gray-400" dir="rtl">בודק הרשאה…</div>;
  if (who.state === "no") return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-3">🔒</p>
        <p className="font-black text-gray-900 text-lg mb-1">אזור אנשי המכירות</p>
        <p className="text-gray-500 text-sm mb-4">התחבר עם המייל שקיבל גישה לאזור הזה.</p>
        <a href="/auth?next=/seller" className="inline-block bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl">התחברות</a>
      </div>
    </div>
  );

  const nav = (
    <nav className="flex-1 py-4 px-3 space-y-1">
      {LINKS.map(l => {
        const active = l.href === "/seller" ? pathname === "/seller" : pathname.startsWith(l.href);
        return (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
            <span className="w-5 text-center">{l.icon}</span>{l.label}
          </a>
        );
      })}
    </nav>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="lg:hidden sticky top-0 z-30 bg-gray-950 text-white flex items-center justify-between px-4 h-14">
        <button onClick={() => setOpen(true)} aria-label="תפריט" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-sm font-bold">אזור מכירות</span>
        <img src="/skishare-logo.png" alt="SkiShare" className="h-7 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
      </header>
      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}
      <aside className={`w-60 bg-gray-950 min-h-screen flex flex-col fixed right-0 top-0 z-50 border-l border-gray-800 transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"} lg:translate-x-0`}>
        <div className="px-6 py-6 border-b border-gray-800/70">
          <Link href="/"><img src="/skishare-logo.png" alt="SkiShare" className="h-10 w-auto" style={{ filter: "brightness(0) invert(1)" }} /></Link>
          <div className="text-gray-500 text-xs mt-2 tracking-wider">אזור מכירות · {who.name}</div>
        </div>
        {nav}
        <div className="p-3 border-t border-gray-800/70 space-y-1">
          {who.admin && <a href="/admin" className="block px-3.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold">← לאזור הניהול</a>}
          <Link href="/" className="block px-3.5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold">← חזרה לאתר</Link>
        </div>
      </aside>
      <main className="lg:mr-60 min-h-screen">
        {who.admin && <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm px-4 md:px-8 py-2">אתה צופה כמנהל: רואים את כל אנשי המכירות, ובהזמנות אפשר לקבוע של מי ההזמנה ומה הרווח.</div>}
        {children}
      </main>
    </div>
  );
}
