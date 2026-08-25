"use client";
import { usePathname } from "next/navigation";
import { IconBed, IconSkis, IconCalendar, IconBus } from "@/components/Icons";

const IconGrid = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconKey = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="4.5" /><path d="m14 12 6-6" /><path d="m18 8 2 2" /><path d="m11 9 3 3" />
  </svg>
);
const IconDoc = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" />
  </svg>
);
const IconBriefcase = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const links = [
  { href: "/admin", label: "דשבורד", icon: <IconGrid size={18} /> },
  { href: "/admin/apartments", label: "דירות", icon: <IconBed size={18} /> },
  { href: "/admin/season-rentals", label: "דירות סיזיונרים", icon: <IconSkis size={18} /> },
  { href: "/admin/seasonal-properties", label: "ניהול דירות עונתיות", icon: <IconKey size={18} /> },
  { href: "/admin/agency-properties", label: "ניהול דירות סוכנות", icon: <IconBriefcase size={18} /> },
  { href: "/admin/proposals", label: "הצעות מחיר (PDF)", icon: <IconDoc size={18} /> },
  { href: "/admin/orders", label: "הזמנות ותשלומים", icon: <IconCalendar size={18} /> },
  { href: "/admin/transfers", label: "הסעות", icon: <IconBus size={18} /> },
];

export default function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 py-4 px-3 space-y-1">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <a key={link.href} href={link.href} onClick={onNavigate}
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
