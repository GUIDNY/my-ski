import { pageMeta } from "@/lib/page-meta";

export const metadata = pageMeta({
  title: "דירות לעונה שלמה בואל טורנס לסיזונרים | SkiShare",
  description: "מחפשים דיור לעונה שלמה בואל טורנס? דירות לטווח ארוך לסיזונרים, קהילה ישראלית ועזרה במציאת עבודה ודיור באזור.",
  path: "/seasonaires",
});

export default function SeasonairesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
