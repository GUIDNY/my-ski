import type { Metadata } from "next";
import "../globals.css";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = { title: "SkiShare — ניהול" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // the root layout already renders <html>/<body>; a second pair here made
    // React's hydration fail on every admin page
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
