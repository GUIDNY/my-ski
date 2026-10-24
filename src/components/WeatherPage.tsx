import Link from "next/link";
import { wrap, card, btn } from "@/components/ui";
import { getForecast, weatherOf, VT, type Day } from "@/lib/forecast";
import { LIFT_DATES } from "@/lib/deal-pricing";
import { SITE, breadcrumbLd, faqLd, ldJson } from "@/lib/site";

/*
 * "תחזית ואל טורנס" / "Val Thorens weather forecast" / "Météo Val Thorens":
 * the live 10-day forecast for the village and the top of the lifts, with
 * snow, wind and the freezing level, plus short answers people search for.
 * Data: Open-Meteo (credited), refreshed every 30 minutes.
 */

type L = "he" | "en" | "fr";
const LOC: Record<L, string> = { he: "he-IL", en: "en-GB", fr: "fr-FR" };
const BASE_PATH: Record<L, string> = { he: "/val-thorens-weather", en: "/en/val-thorens-weather", fr: "/fr/val-thorens-weather" };

const T = {
  he: {
    crumbs: ["דף הבית", "תחזית ואל טורנס"], home: "/",
    h1: "תחזית ואל טורנס: מזג אוויר ושלג ל-10 ימים",
    lead: "התחזית לואל טורנס, מתעדכנת כל חצי שעה: בכפר (2,300 מ') ובראש המעליות (3,200 מ'), עם שלג צפוי, רוח וגובה קו הקיפאון.",
    now: "עכשיו בואל טורנס", village: "בכפר, 2,300 מ'", top: "בראש ההר, 3,200 מ'", feels: "מרגיש כמו", wind: "רוח", kmh: 'קמ"ש',
    snow7: "שלג צפוי ב-7 הימים הקרובים", cm: 'ס"מ', table: "התחזית ל-10 ימים",
    cols: ["יום", "מזג אוויר", "בכפר", "בראש ההר", "שלג", "רוח", "קו קיפאון"],
    today: "היום", m: "מ'", updated: "עודכן", source: "נתוני התחזית: Open-Meteo (CC BY 4.0). תחזית היא הערכה, ולפני יום סקי כדאי לבדוק גם את האתר הרשמי של ואל טורנס.",
    ctaH: "בא לכם לתפוס את השלג הזה?", ctaP: "דירות בואל טורנס עם סקי פס, הסעה וציוד, במחיר לאדם.", ctaA: "לדירות בואל טורנס", ctaB: "מזג האוויר בכל חודש",
    monthlyHref: "/guide/מזג-אוויר-ושלג-בואל-טורנס", aptsHref: "/apartments",
    faqH: "שאלות על מזג האוויר בואל טורנס",
  },
  en: {
    crumbs: ["Home", "Val Thorens weather"], home: "/en",
    h1: "Val Thorens weather forecast: 10-day snow forecast",
    lead: "The Val Thorens forecast, updated every 30 minutes: in the village (2,300 m) and at the top of the lifts (3,200 m), with snowfall, wind and the freezing level.",
    now: "Right now in Val Thorens", village: "Village, 2,300 m", top: "Top of the lifts, 3,200 m", feels: "Feels like", wind: "Wind", kmh: "km/h",
    snow7: "Snow expected in the next 7 days", cm: "cm", table: "10-day forecast",
    cols: ["Day", "Weather", "Village", "Top", "Snow", "Wind", "Freezing level"],
    today: "Today", m: "m", updated: "Updated", source: "Forecast data: Open-Meteo (CC BY 4.0). A forecast is an estimate; before a ski day, also check the official Val Thorens website.",
    ctaH: "Want to catch this snow?", ctaP: "Apartments in Val Thorens with ski pass, transfer and equipment, priced per person.", ctaA: "Val Thorens apartments", ctaB: "All guides",
    monthlyHref: "/en/guide", aptsHref: "/en/apartments",
    faqH: "Val Thorens weather: questions",
  },
  fr: {
    crumbs: ["Accueil", "Météo Val Thorens"], home: "/fr",
    h1: "Météo Val Thorens : prévisions neige à 10 jours",
    lead: "Les prévisions météo de Val Thorens, mises à jour toutes les 30 minutes : au village (2 300 m) et en haut des pistes (3 200 m), avec chutes de neige, vent et limite pluie-neige.",
    now: "En ce moment à Val Thorens", village: "Village, 2 300 m", top: "Sommet, 3 200 m", feels: "Ressenti", wind: "Vent", kmh: "km/h",
    snow7: "Neige attendue sur 7 jours", cm: "cm", table: "Prévisions à 10 jours",
    cols: ["Jour", "Temps", "Village", "Sommet", "Neige", "Vent", "Isotherme 0 °C"],
    today: "Aujourd’hui", m: "m", updated: "Mis à jour", source: "Données : Open-Meteo (CC BY 4.0). Une prévision reste une estimation ; avant une journée de ski, consultez aussi le site officiel de Val Thorens.",
    ctaH: "Envie de profiter de cette neige ?", ctaP: "Appartements à Val Thorens avec forfait, transfert et matériel, prix par personne.", ctaA: "Appartements à Val Thorens", ctaB: "Tous les guides",
    monthlyHref: "/fr/guide", aptsHref: "/fr/apartments",
    faqH: "Météo de Val Thorens : questions",
  },
} as const;

const NB = " ";
// LRM first: a minus sign stays on the left of the number in the Hebrew (RTL) page
const deg = (n: number) => (Number.isFinite(n) ? `\u200E${Math.round(n) === 0 ? 0 : Math.round(n)}°` : "–");
const ilDate = (iso: string) => { const [y, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}.${y}`; };

function faqs(lang: L, snow7: number | null, d0?: Day) {
  const [vo, vc] = LIFT_DATES.val_thorens, [to, tc] = LIFT_DATES.trois_vallees;
  if (lang === "he") return [
    { q: "מה התחזית לואל טורנס השבוע?", a: snow7 === null ? "התחזית מתעדכנת כאן כל חצי שעה." : `בשבעת הימים הקרובים צפויים בכפר כ-${snow7} ס"מ שלג${d0 ? `, והיום הטמפרטורה בכפר בין \u2066${Math.round(d0.min)}\u2069 ל-\u2066${Math.round(d0.max)}\u2069 מעלות` : ""}. הטבלה למעלה מתעדכנת כל חצי שעה.` },
    { q: "כמה קר בואל טורנס בחורף?", a: "לפי Météo-France, בתחנה בכפר בינואר, החודש הקר ביותר, המינימום הממוצע הוא מינוס 10.3 מעלות והמקסימום הממוצע מינוס 2.1. בראש המעליות, בגובה 3,200 מ', קר יותר." },
    { q: "מתי נפתחת עונת הסקי בואל טורנס?", a: `המעליות של ואל טורנס ואורל פתוחות מ-${ilDate(vo)} עד ${ilDate(vc)}, ושלושת העמקים כולם מ-${ilDate(to)} עד ${ilDate(tc)}.` },
    { q: "מתי יש הכי הרבה שלג בואל טורנס?", a: "בתחנה בכפר השלג הכי עמוק מפברואר עד אפריל, בממוצע 140 עד 152 ס\"מ. ואל טורנס הוא כפר הסקי הגבוה באירופה, ולכן השלג בו מחזיק טוב גם בתחילת העונה ובסופה." },
    { q: "מה זה קו הקיפאון בתחזית?", a: "הגובה שבו הטמפרטורה יורדת ל-0 מעלות. כשהוא מתחת לכפר (2,300 מ'), המשקעים יורדים כשלג. כשהוא הרבה מעל, יכול לרדת גשם גם בכפר." },
  ];
  if (lang === "en") return [
    { q: "What is the Val Thorens forecast this week?", a: snow7 === null ? "The forecast here is updated every 30 minutes." : `About ${snow7} cm of snow is expected in the village over the next 7 days${d0 ? `, and today the village sits between ${Math.round(d0.min)} and ${Math.round(d0.max)} °C` : ""}. The table above updates every 30 minutes.` },
    { q: "How cold is Val Thorens in winter?", a: "According to Météo-France, at the village station in January, the coldest month, the average low is −10.3 °C and the average high −2.1 °C. At the top of the lifts, 3,200 m, it is colder." },
    { q: "When does the Val Thorens ski season open?", a: `The Val Thorens and Orelle lifts run from ${ilDate(vo)} to ${ilDate(vc)}, and the whole 3 Vallées from ${ilDate(to)} to ${ilDate(tc)}.` },
    { q: "When is there the most snow in Val Thorens?", a: "At the village station the snow is deepest from February to April, 140 to 152 cm on average. Val Thorens is the highest ski resort in Europe, so the snow holds well at both ends of the season too." },
    { q: "What is the freezing level?", a: "The altitude where the temperature drops to 0 °C. When it is below the village (2,300 m), precipitation falls as snow; when it is well above, it can rain in the village." },
  ];
  return [
    { q: `Quelle est la météo à Val Thorens cette semaine${NB}?`, a: snow7 === null ? "Les prévisions sont mises à jour ici toutes les 30 minutes." : `Environ ${snow7}${NB}cm de neige sont attendus au village sur les 7 prochains jours${d0 ? `, et aujourd’hui il fait entre ${Math.round(d0.min)} et ${Math.round(d0.max)}${NB}°C au village` : ""}. Le tableau est mis à jour toutes les 30 minutes.` },
    { q: `Fait-il froid à Val Thorens en hiver${NB}?`, a: `Selon Météo-France, à la station du village en janvier, le mois le plus froid, la minimale moyenne est de −10,3${NB}°C et la maximale moyenne de −2,1${NB}°C. En haut des pistes, à 3${NB}200${NB}m, il fait plus froid.` },
    { q: `Quand ouvre la saison de ski à Val Thorens${NB}?`, a: `Les remontées de Val Thorens et Orelle sont ouvertes du ${ilDate(vo)} au ${ilDate(vc)}, et tout le domaine des 3${NB}Vallées du ${ilDate(to)} au ${ilDate(tc)}.` },
    { q: `Quand y a-t-il le plus de neige à Val Thorens${NB}?`, a: `À la station du village, la neige est la plus épaisse de février à avril, 140 à 152${NB}cm en moyenne. Val Thorens est la station la plus haute d’Europe, la neige y tient bien en début et en fin de saison.` },
    { q: `Qu’est-ce que l’isotherme 0${NB}°C${NB}?`, a: `L’altitude où la température passe à 0${NB}°C. Quand elle est sous le village (2${NB}300${NB}m), les précipitations tombent en neige${NB}; bien au-dessus, il peut pleuvoir au village.` },
  ];
}

export default async function WeatherPage({ lang }: { lang: L }) {
  const t = T[lang];
  const f = await getForecast();
  const dir = lang === "he" ? "rtl" : "ltr";
  const dayName = (iso: string, i: number) => i === 0 ? t.today
    : new Date(iso + "T12:00:00").toLocaleDateString(LOC[lang], { weekday: "short", day: "numeric", month: "numeric" });
  const q = faqs(lang, f ? f.snow7 : null, f?.days[0]);
  const url = `${SITE}${BASE_PATH[lang]}`;
  const pageLd = {
    "@context": "https://schema.org", "@type": "WebPage", "@id": `${url}#page`, url, name: t.h1, inLanguage: LOC[lang],
    about: { "@type": "Place", name: "Val Thorens", geo: { "@type": "GeoCoordinates", latitude: VT.lat, longitude: VT.lon, elevation: VT.village } },
    ...(f ? { dateModified: `${f.updated}:00` } : {}),
  };

  return (
    <div dir={dir} className="bg-white text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(pageLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([[t.crumbs[0], t.home], [t.crumbs[1], BASE_PATH[lang]]])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqLd(q)) }} />

      <header className="bg-soft border-b border-line">
        <div className={`${wrap} pt-6 md:pt-8 pb-8 md:pb-10 flex flex-col gap-3 max-w-[900px]`}>
          <nav aria-label="breadcrumb" className="text-[14px] text-muted"><Link href={t.home} className="hover:underline">{t.crumbs[0]}</Link> › {t.crumbs[1]}</nav>
          <h1 className="font-display font-extrabold text-[30px] leading-[1.12] md:text-[44px] tracking-tight text-ink">{t.h1}</h1>
          <p className="text-[16px] md:text-[18px] leading-relaxed text-body">{t.lead}</p>
        </div>
      </header>

      <main className={`${wrap} py-8 md:py-12 flex flex-col gap-10`}>
        {f ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className={`${card} p-5 md:col-span-2 flex flex-wrap items-center gap-6`}>
                <span className="text-[56px] leading-none" aria-hidden="true">{weatherOf(f.now.code).icon}</span>
                <div className="flex flex-col gap-1">
                  <span className="text-[14px] text-muted">{t.now} · {t.village}</span>
                  <span className="font-display font-extrabold text-[44px] leading-none tabular-nums">{deg(f.now.temp)}</span>
                  <span className="text-[15px] text-body">{weatherOf(f.now.code)[lang]} · {t.feels} {deg(f.now.feels)} · {t.wind} {Math.round(f.now.wind)} {t.kmh}</span>
                </div>
                <div className="flex flex-col gap-1 ms-auto">
                  <span className="text-[14px] text-muted">{t.top}</span>
                  <span className="font-display font-extrabold text-[30px] leading-none tabular-nums">{deg(f.now.topTemp)}</span>
                </div>
              </div>
              <div className={`${card} p-5 flex flex-col justify-center gap-1 bg-accent-soft border-accent/20`}>
                <span className="text-[14px] text-muted">{t.snow7}</span>
                <span className="font-display font-extrabold text-[40px] leading-none text-accent tabular-nums">{f.snow7} {t.cm}</span>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-display font-bold text-[22px] md:text-[28px] tracking-tight">{t.table}</h2>
              <div className={`${card} overflow-x-auto`}>
                <table className="w-full min-w-[640px] text-[15px]">
                  <thead>
                    <tr className="bg-soft text-muted text-[13px]">
                      {t.cols.map(c => <th key={c} scope="col" className="px-3 py-2.5 font-bold text-start">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {f.days.map((d, i) => {
                      const w = weatherOf(d.code);
                      return (
                        <tr key={d.date}>
                          <th scope="row" className="px-3 py-3 font-bold text-start whitespace-nowrap">{dayName(d.date, i)}</th>
                          <td className="px-3 py-3 whitespace-nowrap"><span aria-hidden="true">{w.icon}</span> {w[lang]}</td>
                          <td className="px-3 py-3 tabular-nums whitespace-nowrap"><b>{deg(d.max)}</b> / {deg(d.min)}</td>
                          <td className="px-3 py-3 tabular-nums whitespace-nowrap"><b>{deg(d.topMax)}</b> / {deg(d.topMin)}</td>
                          <td className={`px-3 py-3 tabular-nums whitespace-nowrap ${d.snow >= 1 ? "font-bold text-accent" : "text-muted"}`}>{d.snow >= 0.5 ? `${Math.round(d.snow)} ${t.cm}` : "–"}</td>
                          <td className="px-3 py-3 tabular-nums whitespace-nowrap">{Math.round(d.wind)}{d.gusts > d.wind + 15 ? ` (${Math.round(d.gusts)})` : ""} {t.kmh}</td>
                          <td className="px-3 py-3 tabular-nums whitespace-nowrap">{d.freezing !== null ? `${d.freezing.toLocaleString("en-US")} ${t.m}` : "–"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[13px] text-muted">{t.updated}: {f.updated.replace("T", " ")} · {t.source}</p>
            </section>
          </>
        ) : (
          <p className="text-[16px] text-body">{t.source}</p>
        )}

        <section className={`${card} p-6 md:p-8 flex flex-wrap items-center justify-between gap-5`}>
          <div className="flex flex-col gap-1.5 max-w-[560px]">
            <h2 className="font-display font-bold text-[22px] md:text-[26px]">{t.ctaH}</h2>
            <p className="text-[16px] text-body">{t.ctaP}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={t.aptsHref} className={btn.primary}>{t.ctaA}</Link>
            <Link href={t.monthlyHref} className={btn.outline}>{t.ctaB}</Link>
          </div>
        </section>

        <section className="flex flex-col gap-4 max-w-[860px]">
          <h2 className="font-display font-bold text-[22px] md:text-[28px] tracking-tight">{t.faqH}</h2>
          <div className="flex flex-col gap-3">
            {q.map(x => (
              <div key={x.q} className={`${card} p-5`}>
                <h3 className="font-bold text-[17px] text-ink mb-1.5">{x.q}</h3>
                <p className="text-[16px] leading-relaxed text-body">{x.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
