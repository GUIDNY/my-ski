import { pageMeta } from "@/lib/page-meta";

export const metadata = pageMeta({
  title: "הסעה מז'נבה או מליון לואל טורנס: מחיר ופרטים | SkiShare",
  description: "הסעה משדה התעופה בז'נבה או בליון עד הדירה בואל טורנס, הלוך וחזור. €180 לאדם בהזמנה עם דירה, או מחיר לפי הרכב להסעה בלבד. מזמינים באתר, בעברית.",
  path: "/transfers",
});

export default function TransfersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
