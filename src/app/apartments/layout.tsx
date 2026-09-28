import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "דירות בואל טורנס להשכרה | SkiShare",
  description: "כל הדירות שלנו בואל טורנס במקום אחד — דירות שבדקנו בעצמנו, מחיר שקוף מראש, ואפשרות להוסיף סקי פס, הסעות וציוד סקי לאותה הזמנה.",
  alternates: { canonical: "https://skisharebook.com/apartments" },
};

export default function ApartmentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
