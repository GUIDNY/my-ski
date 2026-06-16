"use client";
import { usePathname } from "next/navigation";
import { IconBed, IconSkis, IconCalendar } from "@/components/Icons";

const IconGrid = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const links = [
  { href: "/admin", label: "דשבורד", icon: <IconGrid size={18} /> },
  { href: "/admin/apartments", label: "דירות", icon: <IconBed size={18} /> },
  { href: "/admin/season-rentals", label: "דירות סזונרים", icon: <IconSkis size={18} /> },
  { href: "/admin/bookings", label: "הזמנות", icon: <IconCalendar size={18} /> },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 py-4 px-3 space-y-1">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <a key={link.href} href={link.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${active
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
            <span className={active ? "text-white" : "text-gray-500"}>{link.icon}</span>
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
