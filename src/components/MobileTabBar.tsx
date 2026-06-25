"use client";
import { usePathname } from "next/navigation";
import { IconHome, IconBed, IconUser } from "@/components/Icons";
import IconCommunity from "@/components/IconCommunity";

const tabs = [
  { href: "/",            label: "ראשי",    icon: IconHome },
  { href: "/seasonaires", label: "סיזיונרים", icon: IconCommunity },
  { href: "/apartments",  label: "דירות",   icon: IconBed },
  { href: "/my",          label: "אזור אישי", icon: IconUser },
];

// routes with their own full-screen / bottom UI — hide the tab bar there
const HIDDEN = ["/game", "/quote", "/q", "/pay", "/admin", "/book", "/auth", "/combo", "/split"];

export default function MobileTabBar() {
  const pathname = usePathname() || "/";
  // detail pages with their own floating booking bar (apartment / seasonaire)
  const isDetail = pathname.startsWith("/apartments/") || pathname.startsWith("/seasonaires/");
  if (isDetail || HIDDEN.some(h => pathname === h || pathname.startsWith(h + "/"))) return null;

  return (
    <>
      {/* spacer so content isn't hidden behind the fixed bar */}
      <div className="h-[68px] md:hidden" aria-hidden />
      <nav dir="rtl"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <a key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${active ? "text-blue-600" : "text-gray-400"}`}>
              <Icon size={22} />
              <span className={`text-[11px] ${active ? "font-bold" : "font-medium"}`}>{label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
