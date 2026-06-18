import type { Metadata } from "next";
import "../globals.css";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = { title: "SkiShare — ניהול" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-50">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
