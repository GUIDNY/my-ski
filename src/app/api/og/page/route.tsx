import { ogCard, type OgCard } from "@/lib/og-card";
import { getGuideBySlug } from "@/lib/guides";

export const runtime = "nodejs";
export const maxDuration = 30;

/*
 * The link preview of the site's pages (/api/og/page?path=/transfers), drawn from a fixed
 * card per page (no free text from the address, so nobody can print their own words in our
 * look). An unknown path gets the home page's card. See lib/og-card.
 */
const ALL = ["דירה", "סקי פס", "הסעה", "ציוד", "טיסה"];
const CARDS: Record<string, OgCard> = {
  "/": { photos: ["/hero-ski.jpg"], kicker: "חופשת סקי בואל טורנס", title: "דירות לחבר'ה, סקי פס והסעה", facts: "מזמינים באתר, בעברית · כל אחד משלם את החלק שלו", included: ALL },
  "/transfers": { photos: ["/view.jpg"], kicker: "הסעות לואל טורנס", title: "מז'נבה או מליון עד דלת הדירה", facts: "רכב פרטי או שאטל · מזמינים באתר, בעברית", included: ["עד הדלת", "הלוך וחזור", "נהג מקצועי"] },
  "/packages": { photos: ["/chalet-interior.jpg"], kicker: "חבילות סקי · עונת 2026/27", title: "שבוע בואל טורנס: דירה, סקי פס והסעה", facts: "לזוג, ל-4 ול-6 · שבת עד שבת", included: ["דירה", "סקי פס", "הסעה"] },
  "/weekly": { photos: ["/hero-ski.jpg"], kicker: "שבת עד שבת · עונת 2026/27", title: "דירות בואל טורנס לכל שבוע בעונה", facts: "רואים מה פנוי בכל שבוע, ומזמינים באתר", included: ALL },
  "/apartments": { photos: ["/view.jpg"], kicker: "דירות בואל טורנס", title: "דירות לחבר'ה, לזוגות ולמשפחות", facts: "מזוג ועד קבוצות · ליד המסלולים", included: ALL },
  "/search": { photos: ["/chalet-interior.jpg"], kicker: "חבילת סקי לפי תאריכים", title: "בוחרים תאריכים ורואים מה פנוי", facts: "עם סקי פס, הסעה וציוד, הכל באתר", included: ALL },
  "/seasonaires": { photos: ["/view.jpg"], kicker: "סיזונרים · ואל טורנס", title: "דירות לעונה שלמה", facts: "דיור לטווח ארוך, קהילה ישראלית ועזרה בעבודה" },
  "/guide": { photos: ["/hero-ski.jpg"], kicker: "המדריך לואל טורנס", title: "כל מה שצריך לדעת לפני חופשת סקי", facts: "עונה, מחירים, הגעה ולינה · 2026/27" },
  "/val-thorens-weather": { photos: ["/hero-ski.jpg"], kicker: "תחזית ואל טורנס", title: "מזג אוויר ושלג ל-10 ימים", facts: "בכפר ובראש ההר · מתעדכן כל חצי שעה" },
};

export async function GET(req: Request) {
  const path = (new URL(req.url).searchParams.get("path") || "/").split("?")[0].replace(/\/+$/, "") || "/";
  const guide = path.match(/^\/guide\/([^/]+)$/);
  if (guide) {
    const g = getGuideBySlug(decodeURIComponent(guide[1]));
    if (g) {
      const pic = ["/hero-ski.jpg", "/view.jpg", "/chalet-interior.jpg"][[...g.slug].reduce((s, c) => s + c.charCodeAt(0), 0) % 3];
      return ogCard({ photos: [pic], kicker: "המדריך לואל טורנס", title: g.title, facts: g.description }, 86400);
    }
  }
  return ogCard(CARDS[path] ?? CARDS["/"], 86400);
}
