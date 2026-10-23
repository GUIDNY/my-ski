import { pageMeta } from "@/lib/page-meta";
import { alternatesFor } from "@/lib/intl/metadata";

export const metadata = pageMeta({
  title: "דירות בואל טורנס לשבוע: מחירים וזמינות 2026/27 | SkiShare",
  description: "דירות בואל טורנס לחבר'ה, לקבוצות ולזוגות: מסטודיו ועד דירה ל-8, מחיר לכל שבוע וזמינות אמיתית. אפשר להוסיף סקי פס, הסעה וציוד באותה הזמנה.",
  path: "/apartments",
  languages: alternatesFor("/apartments"),
});

export default function ApartmentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
