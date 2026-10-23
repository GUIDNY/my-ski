import { GUIDES } from "@/lib/guides";
import { intlGuides } from "@/lib/intl/guides";

const SITE = "https://skisharebook.com";

// A plain-text summary of the site for AI assistants and answer engines
// (the llms.txt convention). Only facts that are on the site itself.
export const dynamic = "force-static";

export function GET() {
  const guides = GUIDES.map(g => `- [${g.title}](${SITE}/guide/${encodeURIComponent(g.slug)}): ${g.description}`).join("\n");
  const intl = (lang: "en" | "fr") => intlGuides(lang).map(g => `- [${g.title}](${SITE}/${lang}/guide/${g.slug}): ${g.description}`).join("\n");
  const body = `# SkiShare (סקי שר)

> SkiShare is an Israeli company that sells ski holidays in Val Thorens, France, in Hebrew. It has its own apartments in Val Thorens and also offers agency apartments by the week (Saturday to Saturday). Each trip is built from the apartment up: a ski pass (Val Thorens or the whole 3 Vallées), an airport transfer, ski or snowboard equipment, and a direct flight from Tel Aviv when one exists on the dates. Prices are shown per person, and every member of a group can pay their own share.

SkiShare (סקי שר) מוכרת חופשות סקי בואל טורנס, צרפת, בעברית: דירות שלה בואל טורנס, דירות סוכנות לשבוע (שבת עד שבת), ובנוסף לבחירה סקי פס, הסעה מהשדה, ציוד, וטיסה ישירה מתל אביב כשיש. המחיר מוצג לאדם, וכל אחד בחבורה יכול לשלם את החלק שלו.

## Facts (season 2026/27)
- Val Thorens lifts: 21 November 2026 to 2 May 2027. The whole 3 Vallées area: 5 December 2026 to 18 April 2027.
- Adult ski pass on SkiShare: Val Thorens/Orelle 1 day €73.5, 3 days €220.5, 6 days €367.5, 7 days €421.5. Les 3 Vallées 1 day €84.2, 3 days €252.6, 6 days €421, 7 days €486. The same price all season. Child passes: ask us.
- Airport transfer (shuttle from Geneva or Lyon to the apartment, there and back): €180 per person when booked with an apartment.
- Ski or snowboard equipment: €30 a day, €120 for a week.
- Card payments by PayPlus (1.9% card fee). Contact: skishareteam@gmail.com. The chat on the site and on WhatsApp is a digital (AI) assistant that answers in Hebrew; you can ask for a person at any time.

## Main pages
- [Home](${SITE}/): search apartments and packages in Val Thorens.
- [Apartments in Val Thorens](${SITE}/apartments): every apartment with photos, size, guests and price, and the cheapest open apartment for every Saturday of the season.
- [Ski packages](${SITE}/packages): a week in an apartment + ski pass + airport transfer, with the price per person (for 2, 4 and 6) for every Saturday of the season.
- [Saturday to Saturday weeks](${SITE}/weekly): agency apartments by the week, with the price per person.
- [Airport transfers](${SITE}/transfers): shuttle between the airport (Geneva or Lyon) and Val Thorens.
- [Seasonaires](${SITE}/seasonaires): apartments for long stays (two months or more) and a community for people spending the whole season.
- [Emergency, war and force majeure policy](${SITE}/emergency-policy): what happens with flights, apartments and ski passes if there is an emergency such as the closing of the skies.
- [Terms and cancellations](${SITE}/terms)
- [English](${SITE}/en) and [French](${SITE}/fr): the apartments, with booking and card payment in euros, in English and in French, and guides to Val Thorens ([English](${SITE}/en/guide), [French](${SITE}/fr/guide)).

## Guides in English
${intl("en")}

## Guides en français
${intl("fr")}

## Guides (Hebrew)
${guides}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
