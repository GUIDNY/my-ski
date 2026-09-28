import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "דירות לעונה שלמה בואל טורנס | אזור הסיזיונרים — SkiShare",
  description: "מחפשים דיור לעונה שלמה בואל טורנס? לוח דירות לטווח ארוך לסיזיונרים, קהילה ישראלית פעילה ועזרה במציאת עבודה ודיור באזור.",
  alternates: { canonical: "https://skisharebook.com/seasonaires" },
};

export default function SeasonairesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
