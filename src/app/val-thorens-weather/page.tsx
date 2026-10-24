import WeatherPage from "@/components/WeatherPage";
import { pageMeta } from "@/lib/page-meta";
import { alternatesFor } from "@/lib/intl/metadata";

// the forecast changes all day: rebuild at most every 30 minutes (an ASCII path, so revalidate is fine here)
export const revalidate = 1800;

export const metadata = pageMeta({
  title: "תחזית ואל טורנס: מזג אוויר ושלג ל-10 ימים | SkiShare",
  description: "תחזית מזג האוויר לואל טורנס ל-10 ימים, מתעדכנת כל חצי שעה: טמפרטורה בכפר ובראש ההר, כמה שלג צפוי, רוח וקו קיפאון.",
  path: "/val-thorens-weather",
  languages: alternatesFor("/val-thorens-weather"),
});

export default function Page() {
  return <WeatherPage lang="he" />;
}
