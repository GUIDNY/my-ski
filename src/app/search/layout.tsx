import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "חיפוש דירות בואל טורנס | SkiShare",
  description: "בחרו תאריכים ומספר אורחים ומצאו מיד אילו דירות בואל טורנס פנויות ובאיזה מחיר — כולל אפשרות לדיל שלם עם סקי פס, הסעה וטיסה.",
  alternates: { canonical: "https://skisharebook.com/search" },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
