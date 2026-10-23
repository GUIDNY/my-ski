"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Shows its children (the site footer) everywhere except the screens with their own frame. */
export default function ChromeGate({ children, hide }: { children: ReactNode; hide: string[] }) {
  const p = usePathname() || "/";
  if (hide.some(h => p === h || p.startsWith(h + "/"))) return null;
  return <>{children}</>;
}
