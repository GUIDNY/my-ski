"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import { isAdminEmail } from "@/lib/admins";
import { helperWaHref, OPEN_CHAT_EVENT } from "@/lib/helper-whatsapp";
import AuthModal from "./AuthModal";

/*
 * The site header on every customer page (rendered once in the root layout):
 * white, sticky. Desktop: logo, the main links and "האזור שלי".
 * Phone: logo, a chat button and a menu with everything else.
 */

const NAV = [
  { href: "/packages", label: "חבילות", active: (p: string) => p.startsWith("/packages") || p.startsWith("/search") },
  { href: "/apartments", label: "דירות", active: (p: string) => p.startsWith("/apartments") },
  { href: "/weekly", label: "שבת עד שבת", active: (p: string) => p.startsWith("/weekly") },
  { href: "/transfers", label: "הסעות", active: (p: string) => p.startsWith("/transfers") },
  { href: "/guide", label: "ואל טורנס", active: (p: string) => p.startsWith("/guide") },
  { href: "/seasonaires", label: "סיזיונרים", active: (p: string) => p.startsWith("/seasonaires") },
];

// screens with their own frame (/en and /fr: the English and French site) or a printable page
const HIDDEN = ["/admin", "/quote/print", "/en", "/fr"];

export function Brand({ white = false, small = false }: { white?: boolean; small?: boolean }) {
  return (
    <span className={`flex items-center gap-2 ${white ? "text-white" : "text-ink"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={white ? "/skishare-mark-white.png" : "/skishare-mark.png"} alt="" aria-hidden="true"
        className={small ? "h-[22px] w-auto" : "h-[24px] md:h-[28px] w-auto"} />
      <span className={`font-display font-extrabold tracking-tight leading-none ${small ? "text-[20px]" : "text-[21px] md:text-[24px]"}`}>SkiShare</span>
    </span>
  );
}

const IcoUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
const IcoChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>
);
const IcoMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
const IcoClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
const IcoWhatsApp = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);

export default function SiteHeader() {
  const pathname = usePathname() || "/";
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [menu, setMenu] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // the menu closes when the page changes
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenu(false);
  }

  // phone menu: Escape closes it, and the page behind doesn't scroll
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [menu]);

  if (HIDDEN.some(h => pathname === h || pathname.startsWith(h + "/"))) return null;

  const isAdmin = isAdminEmail(user?.email) || user?.app_metadata?.role === "admin";
  const openChat = () => { setMenu(false); window.dispatchEvent(new Event(OPEN_CHAT_EVENT)); };
  const login = () => { setMenu(false); setShowAuth(true); };

  return (
    <>
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuth={() => supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))}
        />
      )}
      <header dir="rtl" className="sticky top-0 z-50 bg-white border-b border-line">
        <div className="max-w-[1240px] mx-auto px-4 md:px-6 h-[60px] md:h-[76px] flex items-center justify-between gap-4">
          <Link href="/" aria-label="SkiShare, לדף הבית" className="shrink-0"><Brand /></Link>

          <nav aria-label="ראשי" className="hidden lg:flex items-center gap-1 xl:gap-2">
            {NAV.map(n => {
              const on = n.active(pathname);
              return (
                <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined}
                  className={`px-3 py-2 rounded-lg text-[16px] transition-colors ${on ? "text-accent font-bold" : "text-ink font-medium hover:text-accent"}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {isAdmin && (
              <Link href="/admin" className="inline-flex items-center min-h-[40px] px-3.5 rounded-full bg-soft text-ink text-[14px] font-bold hover:bg-soft-2 transition-colors">ניהול</Link>
            )}
            {user ? (
              <Link href="/my" className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-line-strong text-ink text-[15px] font-bold hover:border-ink transition-colors">
                <IcoUser />האזור שלי
              </Link>
            ) : (
              <button type="button" onClick={login} className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-line-strong text-ink text-[15px] font-bold hover:border-ink transition-colors">
                <IcoUser />האזור שלי
              </button>
            )}
            <button type="button" onClick={() => setMenu(v => !v)} aria-label="תפריט" aria-expanded={menu}
              className="lg:hidden w-11 h-11 rounded-xl border border-line flex items-center justify-center text-ink hover:border-line-strong transition-colors">
              {menu ? <IcoClose /> : <IcoMenu />}
            </button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button type="button" onClick={openChat} aria-label="צ'אט עם העוזר"
              className="w-11 h-11 rounded-xl border border-line flex items-center justify-center text-accent">
              <IcoChat />
            </button>
            <button type="button" onClick={() => setMenu(v => !v)} aria-label="תפריט" aria-expanded={menu}
              className="w-11 h-11 rounded-xl border border-line flex items-center justify-center text-ink">
              {menu ? <IcoClose /> : <IcoMenu />}
            </button>
          </div>
        </div>

        {menu && (
          <>
            <div className="fixed inset-0 top-[60px] md:top-[76px] bg-ink/30 z-40" onClick={() => setMenu(false)} aria-hidden="true" />
            <div className="absolute inset-x-0 top-full z-50 bg-white border-b border-line shadow-pop max-h-[calc(100dvh-60px)] overflow-y-auto">
              <nav aria-label="תפריט" className="max-w-[1240px] mx-auto px-4 md:px-6 py-3 flex flex-col">
                {NAV.map(n => {
                  const on = n.active(pathname);
                  return (
                    <Link key={n.href} href={n.href} onClick={() => setMenu(false)} aria-current={on ? "page" : undefined}
                      className={`flex items-center justify-between min-h-[52px] border-b border-line text-[17px] ${on ? "text-accent font-bold" : "text-ink font-medium"}`}>
                      {n.label}<span aria-hidden="true" className="text-muted">‹</span>
                    </Link>
                  );
                })}
                <Link href="/emergency-policy" onClick={() => setMenu(false)}
                  className="flex items-center justify-between min-h-[52px] border-b border-line text-[17px] text-ink font-medium">
                  מצב חירום וביטולים<span aria-hidden="true" className="text-muted">‹</span>
                </Link>
                <div className="grid grid-cols-2 gap-2 pt-4 pb-2">
                  {user ? (
                    <Link href="/my" onClick={() => setMenu(false)} className="col-span-2 flex items-center justify-center gap-2 min-h-[48px] rounded-[14px] border border-line-strong text-ink font-bold">
                      <IcoUser />האזור שלי
                    </Link>
                  ) : (
                    <button type="button" onClick={login} className="col-span-2 flex items-center justify-center gap-2 min-h-[48px] rounded-[14px] border border-line-strong text-ink font-bold">
                      <IcoUser />כניסה / הרשמה
                    </button>
                  )}
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMenu(false)} className="col-span-2 flex items-center justify-center min-h-[48px] rounded-[14px] bg-soft text-ink font-bold">ניהול</Link>
                  )}
                  <button type="button" onClick={openChat} className="flex items-center justify-center gap-2 min-h-[48px] rounded-[14px] bg-accent text-white font-bold">
                    <IcoChat />צ&apos;אט
                  </button>
                  <a href={helperWaHref()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 min-h-[48px] rounded-[14px] border border-line-strong text-ink font-bold">
                    <span className="text-[#128C4B]"><IcoWhatsApp /></span>וואטסאפ
                  </a>
                </div>
              </nav>
            </div>
          </>
        )}
      </header>
    </>
  );
}
