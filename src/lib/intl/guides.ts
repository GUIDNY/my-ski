import type { GuideFaq, GuideSection, GuideSource } from "@/lib/guides";
import { GUIDE_PAIRS, guidePair, type GuidePair, type Lang } from "./config";
import whenToGoEn from "./guides/when-to-go.en.json";
import whenToGoFr from "./guides/when-to-go.fr.json";
import apartmentPricesEn from "./guides/apartment-prices.en.json";
import apartmentPricesFr from "./guides/apartment-prices.fr.json";
import skiPassEn from "./guides/ski-pass.en.json";
import skiPassFr from "./guides/ski-pass.fr.json";
import whereToStayEn from "./guides/where-to-stay.en.json";
import whereToStayFr from "./guides/where-to-stay.fr.json";
import gettingThereEn from "./guides/getting-there.en.json";
import gettingThereFr from "./guides/getting-there.fr.json";
import weatherEn from "./guides/weather.en.json";
import weatherFr from "./guides/weather.fr.json";
import pistesEn from "./guides/pistes.en.json";
import pistesFr from "./guides/pistes.fr.json";
import apresSkiEn from "./guides/apres-ski.en.json";
import apresSkiFr from "./guides/apres-ski.fr.json";

/*
 * The guides of /en/guide and /fr/guide: one JSON file per guide and
 * language (lib/intl/guides/<key>.<lang>.json), with the same fields and the
 * same small markup as the Hebrew guides (lib/guides.ts): [text](/path) a
 * link, **text** bold. Each guide's address in each language, and its Hebrew
 * twin, are in GUIDE_PAIRS (lib/intl/config.ts). Server only.
 */

export type IntlGuide = {
  key: string;
  lang: Lang;
  title: string;
  metaTitle: string;
  description: string;
  keywords: string[];
  emoji: string;
  published: string;
  updated: string;
  intro: string;
  sections: GuideSection[];
  faqs: GuideFaq[];
  sources: GuideSource[];
};

export type IntlGuidePage = IntlGuide & { slug: string; pair: GuidePair };

const ALL: IntlGuide[] = [
  whenToGoEn, whenToGoFr, apartmentPricesEn, apartmentPricesFr, skiPassEn, skiPassFr,
  whereToStayEn, whereToStayFr, gettingThereEn, gettingThereFr, weatherEn, weatherFr,
  pistesEn, pistesFr, apresSkiEn, apresSkiFr,
] as IntlGuide[];

/** The guides in this language, in the order of GUIDE_PAIRS. */
export function intlGuides(lang: Lang): IntlGuidePage[] {
  return GUIDE_PAIRS.flatMap(pair => {
    const g = ALL.find(x => x.key === pair.key && x.lang === lang);
    return g ? [{ ...g, slug: pair[lang], pair }] : [];
  });
}

export function intlGuideBySlug(lang: Lang, slug: string): IntlGuidePage | undefined {
  const pair = guidePair(lang, slug);
  return pair ? intlGuides(lang).find(g => g.key === pair.key) : undefined;
}

/** The three guides under each guide: the closest topics. */
const RELATED: Record<string, string[]> = {
  "when-to-go": ["apartment-prices", "weather", "ski-pass"],
  "apartment-prices": ["when-to-go", "where-to-stay", "ski-pass"],
  "ski-pass": ["apartment-prices", "pistes", "when-to-go"],
  "where-to-stay": ["apartment-prices", "getting-there", "apres-ski"],
  "getting-there": ["where-to-stay", "when-to-go", "apartment-prices"],
  weather: ["when-to-go", "apartment-prices", "getting-there"],
  pistes: ["ski-pass", "where-to-stay", "weather"],
  "apres-ski": ["where-to-stay", "apartment-prices", "pistes"],
};

export function relatedIntlGuides(lang: Lang, key: string, n = 3): IntlGuidePage[] {
  const all = intlGuides(lang);
  const picked = (RELATED[key] ?? []).map(k => all.find(g => g.key === k)).filter((g): g is IntlGuidePage => !!g);
  for (const g of all) if (picked.length < n && g.key !== key && !picked.includes(g)) picked.push(g);
  return picked.slice(0, n);
}
