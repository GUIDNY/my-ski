import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הסעות משדה התעופה לואל טורנס | SkiShare",
  description: "הזמנת הסעה פרטית משדה התעופה בז'נבה או ליון לואל טורנס, במחיר קבוע וללא הפתעות — הזמנה ישירה באתר.",
  alternates: { canonical: "https://skisharebook.com/transfers" },
};

export default function TransfersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
