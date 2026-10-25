import Link from "next/link";
import type { Apartment, SkiPass } from "@/types";
import { wrap, card, h2, btn } from "@/components/ui";
import { aptDisplayName, aptKind } from "@/lib/apartment-display";
import { TRANSFER_PRICE, LIFT_DATES } from "@/lib/deal-pricing";
import { SITE, ORG_ID, WEBSITE_ID, VAL_THORENS, breadcrumbLd, faqLd, ldJson } from "@/lib/site";

/*
 * The text of the "דירות בואל טורנס" page, around the list: how much a week
 * costs (live, from the open weeks), which apartment fits, what can be added,
 * what to check, and the questions people ask. Every number comes from the
 * apartments and ski passes in the database, so it stays true as weeks sell.
 */

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
const dmy = (iso: string) => { const [y, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}.${y}`; };
const dm = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}`; };
const median = (xs: number[]) => {
  const v = xs.filter(x => x > 0).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};
const range = (xs: number[]) => {
  const v = xs.filter(x => x > 0);
  if (!v.length) return "";
  const lo = Math.min(...v), hi = Math.max(...v);
  // in words: a "2–7" range flips around in right-to-left text
  return lo === hi ? `${lo}` : `${lo} עד ${hi}`;
};

export const GUIDE_PATHS = {
  pass: "/guide/מחיר-סקי-פס-ואל-טורנס",
  arrive: "/guide/איך-מגיעים-לואל-טורנס-מישראל",
};

export function apartmentsIntro() {
  return (
    <>
      <p>
        SkiShare היא <Link href="/about" className="font-bold text-ink underline underline-offset-2">חברה ישראלית להשכרת דירות בואל טורנס</Link>, עם שירות בעברית.
      </p>
      <p>
        יש כאן שני סוגים של דירות: <b className="text-ink">הדירות שלנו</b>, שאנחנו מנהלים בעצמנו ובוחרים להן תאריכים,
        ו<b className="text-ink">דירות של סוכנות מקומית בואל טורנס</b>, לשבוע שלם משבת לשבת. בכל דירה רואים לכמה אנשים היא מתאימה, את הגודל ואת המחיר לדירה כולה.
      </p>
      <p>
        אפשר להזמין רק דירה, או להוסיף לאותה הזמנה סקי פס, הסעה משדה התעופה וציוד, וטיסה ישירה מתל אביב כשיש. בחבורה, כל אחד משלם את החלק שלו בקישור נפרד.
      </p>
    </>
  );
}

export default function ApartmentsGuide({ apartments, passes }: { apartments: Apartment[]; passes: SkiPass[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const agency = apartments.filter(a => a.source === "la_cime");
  const own = apartments.filter(a => a.source !== "la_cime");
  const openWeeks = (a: Apartment) => (a.available_weeks ?? []).filter(w => w.week >= today && w.price > 0).sort((x, y) => x.week.localeCompare(y.week));

  // the cheapest open apartment of every Saturday, and how many are open
  const byWeek = new Map<string, { min: number; count: number }>();
  for (const a of agency) for (const w of openWeeks(a)) {
    const cur = byWeek.get(w.week);
    byWeek.set(w.week, cur ? { min: Math.min(cur.min, w.price), count: cur.count + 1 } : { min: w.price, count: 1 });
  }
  const weeks = [...byWeek.entries()].sort(([x], [y]) => x.localeCompare(y));
  const mins = weeks.map(([, v]) => v.min);
  const cheapestWeek = mins.length ? Math.min(...mins) : null;
  const dearestWeek = mins.length ? Math.max(...mins) : null;
  // the cheapest Saturdays right now, by date
  const cheapDates = [...weeks].sort(([, a], [, b]) => a.min - b.min).slice(0, 3).map(([w]) => w).sort();
  const listHe = (xs: string[]) => xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ו-${xs[xs.length - 1]}`;
  const cheapText = listHe(cheapDates.map(dm));

  // one apartment through the season: the one with the most open weeks
  const sample = [...agency].sort((x, y) => openWeeks(y).length - openWeeks(x).length)[0];
  const sampleWeeks = sample ? openWeeks(sample) : [];
  const sLo = sampleWeeks.length ? Math.min(...sampleWeeks.map(w => w.price)) : 0;
  const sHi = sampleWeeks.length ? Math.max(...sampleWeeks.map(w => w.price)) : 0;

  // the cheapest week per person in a big apartment (6 people or more)
  let group: { apt: Apartment; week: string; price: number; pp: number } | null = null;
  for (const a of agency) {
    if (!a.max_guests || a.max_guests < 6) continue;
    for (const w of openWeeks(a)) {
      const pp = w.price / a.max_guests;
      if (!group || pp < group.pp) group = { apt: a, week: w.week, price: w.price, pp };
    }
  }

  // the kinds of apartments, from the list
  const kinds = [
    { key: "סטודיו", title: "סטודיו", fit: "לזוג, או לשלושה–ארבעה חברים שלא אכפת להם מצפיפות. \"עד 4 אנשים\" בסטודיו פירושו בדרך כלל מיטות קומותיים בכניסה וספה נפתחת בסלון." },
    { key: "דירת 2 חדרים", title: "2 חדרים", fit: "סלון וחדר שינה. מתאים למשפחה קטנה או לחבורה של ארבעה." },
    { key: "big", title: "3–4 חדרים", fit: "לחבורה גדולה, עם חדרי שינה נפרדים." },
  ].map(k => {
    const list = agency.filter(a => k.key === "big" ? /^דירת [34] חדרים$/.test(aptKind(a)) : aptKind(a) === k.key);
    return { ...k, count: list.length, people: range(list.map(a => a.max_guests ?? 0)), sqm: median(list.map(a => a.sqm ?? 0)) };
  }).filter(k => k.count > 0);

  const pass6 = (area: "val_thorens" | "trois_vallees") =>
    passes.find(p => p.area === area && p.type === "adult" && p.duration_days === 6)?.price ?? null;
  const vt6 = pass6("val_thorens"), tv6 = pass6("trois_vallees");
  const ownPeople = range(own.map(a => a.max_guests ?? 0));
  const agencyPeople = range(agency.map(a => a.max_guests ?? 0));

  const faq: { q: string; a: string }[] = [
    ...(cheapestWeek && dearestWeek ? [{
      q: "כמה עולה דירה בואל טורנס לשבוע?",
      a: `בעונת 2026/27 הדירה הכי זולה שעוד פנויה עולה בין ${eur(cheapestWeek)} ל-${eur(dearestWeek)} לשבוע, לפי השבוע. המחיר לדירה כולה, ומתחלק בין כולם. השבועות הכי זולים עכשיו מתחילים ב-${cheapText}. הכי יקר בחג המולד ובחופשות החורף של צרפת בפברואר. המחיר המדויק של כל דירה בכל שבוע מופיע בעמוד שבת עד שבת.`,
    }] : []),
    {
      q: "מי משכיר את הדירות?",
      a: "SkiShare, חברה ישראלית להשכרת דירות בואל טורנס. חלק מהדירות שלנו, ואנחנו מנהלים אותן בעצמנו. השאר של סוכנות מקומית בואל טורנס, לשבוע שלם משבת לשבת. מזמינים ומשלמים באתר, והשירות בעברית: באתר, בצ'אט ובוואטסאפ.",
    },
    {
      q: "למה רוב הדירות הן משבת עד שבת?",
      a: "כך עובדות רוב הסוכנויות בואל טורנס: שבת היא יום ההחלפה, ושם נמצאות רוב הדירות. בדירות שלנו אפשר לבחור תאריכים אחרים.",
    },
    {
      q: "כמה אנשים נכנסים בדירה?",
      a: "בכל דירה כתוב \"עד X אנשים\", וזה המקסימום. כדאי לקרוא בתיאור איך המיטות מסודרות, ובחבורה גדולה לבדוק כמה חדרי רחצה יש.",
    },
    {
      q: "מה כלול במחיר הדירה?",
      a: "הלינה לכל התקופה. בדירות שלנו גם הניקיון. ברוב דירות הסוכנות מצעים, מגבות וניקיון בסוף השהות לא כלולים, ואפשר להזמין אותם מראש. זה כתוב בתיאור של כל דירה.",
    },
    {
      q: "אפשר להזמין רק דירה, בלי סקי פס והסעה?",
      a: "כן. מזמינים רק דירה, או מוסיפים רק חלק, למשל דירה והסעה.",
    },
    {
      q: "אפשר שכל אחד ישלם את החלק שלו?",
      a: "כן. כל אחד מהחבורה מקבל קישור תשלום משלו, ואף אחד לא צריך לשים את כל הסכום לבד.",
    },
  ];

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${SITE}/apartments#page`,
      url: `${SITE}/apartments`,
      name: "דירות בואל טורנס",
      inLanguage: "he-IL",
      isPartOf: { "@id": WEBSITE_ID },
      about: VAL_THORENS,
      provider: { "@id": ORG_ID },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: apartments.length,
        itemListElement: apartments.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/apartments/${a.id}`, name: aptDisplayName(a) })),
      },
    },
    faqLd(faq),
    breadcrumbLd([["דף הבית", "/"], ["דירות בואל טורנס", "/apartments"]]),
  ];

  const sec = "flex flex-col gap-4";
  const p = "text-[16px] md:text-[17px] leading-relaxed text-body";
  const th = "text-start font-bold text-ink px-2.5 md:px-4 py-2.5 bg-soft";
  const td = "px-2.5 md:px-4 py-2.5 border-t border-line align-top";

  return (
    <div className="bg-white border-t border-line" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <div className={`${wrap} py-12 md:py-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10 lg:gap-14 items-start`}>
        <div className="flex flex-col gap-12 md:gap-14 min-w-0 max-w-[800px]">

          {weeks.length > 0 && (
            <section className={sec} aria-labelledby="price-week">
              <h2 id="price-week" className={h2}>כמה עולה דירה בואל טורנס לשבוע?</h2>
              <p className={p}>
                המחיר תלוי בעיקר בשבוע. הכי יקר בחג המולד ובסוף השנה, ובשבועות החופש של בתי הספר בצרפת בפברואר. השבועות הכי זולים עכשיו מתחילים ב-{cheapText}.
                בטבלה: הדירה הכי זולה שעוד פנויה בכל שבת, לדירה כולה. המחיר משתנה כשדירות נתפסות.
              </p>
              <div className={`${card} overflow-hidden`}>
                <table className="w-full text-[15px] md:text-[16px]">
                  <caption className="sr-only">המחיר הנמוך לשבוע בכל שבת, לדירה כולה</caption>
                  <thead>
                    <tr><th scope="col" className={th}>שבת כניסה</th><th scope="col" className={th}>דירות פנויות</th><th scope="col" className={th}>החל מ-</th></tr>
                  </thead>
                  <tbody>
                    {weeks.map(([week, v]) => (
                      <tr key={week}>
                        <td className={td}><Link href={`/weekly?week=${week}`} className="font-bold text-accent hover:text-accent-hover">{dmy(week)}</Link></td>
                        <td className={`${td} text-body tabular-nums`}>{v.count}</td>
                        <td className={`${td} font-bold text-ink tabular-nums`}>{eur(v.min)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[14px] text-muted">נכון ל-{dmy(today)}, מתוך הדירות הפנויות באתר. לוחצים על תאריך ורואים את כל הדירות של אותו שבוע.</p>

              {sample && sampleWeeks.length > 2 && (
                <div className="flex flex-col gap-2.5">
                  <h3 className="font-display font-bold text-[19px] md:text-[21px] text-ink">אותה דירה לאורך העונה</h3>
                  <p className={p}>
                    <Link href={`/apartments/${sample.id}`} className="font-bold text-accent hover:text-accent-hover">{aptDisplayName(sample)}</Link>, המחיר לשבוע לפי שבת הכניסה:
                  </p>
                  <ul className="flex flex-wrap gap-2" aria-label="מחיר לשבוע לפי שבת הכניסה">
                    {sampleWeeks.map(w => (
                      <li key={w.week} className="rounded-xl border border-line bg-soft px-3 py-1.5 text-[14px] md:text-[15px] flex items-baseline gap-1.5">
                        <span className="text-muted">{dm(w.week)}</span>
                        <bdi className="font-bold text-ink tabular-nums">{eur(w.price)}</bdi>
                      </li>
                    ))}
                  </ul>
                  {sLo > 0 && sHi / sLo >= 1.2 && <p className={p}>השבוע הכי יקר עולה פי {(sHi / sLo).toFixed(1)} מהזול, באותה דירה בדיוק.</p>}
                </div>
              )}

              {group && (
                <p className={p}>
                  <b className="text-ink">כמה זה יוצא לאדם:</b> מחלקים את מחיר הדירה בכמה שאתם. למשל,{" "}
                  <Link href={`/apartments/${group.apt.id}`} className="font-bold text-accent hover:text-accent-hover">{aptDisplayName(group.apt)}</Link>{" "}
                  עולה {eur(group.price)} בשבוע של {dmy(group.week)}. ל-{group.apt.max_guests} אנשים זה כ-{eur(group.pp)} לאדם לשבוע, לפני סקי פס והסעה.
                </p>
              )}
              <Link href="/weekly" className={`${btn.link} self-start text-[16px]`}>כל המחירים לפי שבוע</Link>
            </section>
          )}

          {kinds.length > 0 && (
            <section className={sec} aria-labelledby="which">
              <h2 id="which" className={h2}>איזו דירה מתאימה לכם?</h2>
              <ul className="flex flex-col gap-3">
                {kinds.map(k => (
                  <li key={k.key} className={`${card} p-4 md:p-5 flex flex-col gap-1`}>
                    <span className="font-bold text-[17px] text-ink">
                      {k.title}{k.sqm ? `, בדרך כלל כ-${k.sqm} מ"ר` : ""}{k.people ? ` · ${k.people} אנשים` : ""}
                    </span>
                    <span className={p}>{k.fit}</span>
                  </li>
                ))}
              </ul>
              <p className={p}>בחבורה גדולה כדאי לבדוק גם כמה חדרי רחצה יש בדירה. זה כתוב בכל דירה.</p>
            </section>
          )}

          <section className={sec} aria-labelledby="ours">
            <h2 id="ours" className={h2}>דירות שלנו ודירות של הסוכנות: מה ההבדל?</h2>
            <div className={`${card} overflow-x-auto`}>
              <table className="w-full text-[14px] md:text-[16px]">
                <thead>
                  <tr><th scope="col" className={th}></th><th scope="col" className={th}>דירות שלנו</th><th scope="col" className={th}>דירות של הסוכנות</th></tr>
                </thead>
                <tbody>
                  <tr><th scope="row" className={`${td} text-start font-bold text-ink`}>כמה</th><td className={td}>{own.length}</td><td className={td}>{agency.length}</td></tr>
                  <tr><th scope="row" className={`${td} text-start font-bold text-ink`}>תאריכים</th><td className={td}>בוחרים תאריכים</td><td className={td}>שבוע שלם, משבת לשבת</td></tr>
                  <tr><th scope="row" className={`${td} text-start font-bold text-ink`}>מחיר</th><td className={td}>לפי לילה, לדירה כולה</td><td className={td}>לפי שבוע, לדירה כולה</td></tr>
                  <tr><th scope="row" className={`${td} text-start font-bold text-ink`}>ניקיון</th><td className={td}>כלול</td><td className={td}>ברוב הדירות לא כלול, ואפשר להזמין מראש</td></tr>
                  {(ownPeople || agencyPeople) && (
                    <tr><th scope="row" className={`${td} text-start font-bold text-ink`}>כמה אנשים</th><td className={td}>{ownPeople}</td><td className={td}>{agencyPeople}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={sec} aria-labelledby="addons">
            <h2 id="addons" className={h2}>מה אפשר להוסיף להזמנה</h2>
            <ul className="flex flex-col gap-3 text-[16px] md:text-[17px] leading-relaxed text-body list-disc ps-5">
              {(vt6 || tv6) && (
                <li>
                  <b className="text-ink">סקי פס:</b>{" "}
                  {vt6 && <>ואל טורנס–אורל ב-{eur(vt6)} לאדם ל-6 ימים</>}{vt6 && tv6 && ", או "}
                  {tv6 && <>כל שלושת העמקים ב-{eur(tv6)} לאדם ל-6 ימים</>}.{" "}
                  <Link href={GUIDE_PATHS.pass} className="font-bold text-accent hover:text-accent-hover">על הסקי פס ואל טורנס</Link>
                </li>
              )}
              <li>
                <b className="text-ink">הסעה:</b> משדה התעופה בז&apos;נבה או בליון עד הדירה, הלוך וחזור, {eur(TRANSFER_PRICE)} לאדם.{" "}
                <Link href="/transfers" className="font-bold text-accent hover:text-accent-hover">הסעות לואל טורנס</Link>
              </li>
              <li><b className="text-ink">ציוד:</b> סקי או סנובורד, €30 ליום או €120 לשבוע לאדם.</li>
              <li>
                <b className="text-ink">טיסה:</b> רק טיסה ישירה מתל אביב, במחיר האמיתי לתאריכים שלכם, כשיש כזו.{" "}
                <Link href={GUIDE_PATHS.arrive} className="font-bold text-accent hover:text-accent-hover">איך מגיעים לואל טורנס</Link>
              </li>
            </ul>
            <p className={p}>רוצים לראות הכל ביחד, במחיר לאדם? <Link href="/packages" className="font-bold text-accent hover:text-accent-hover">מחיר חבילת סקי לכל שבוע</Link></p>
          </section>

          <section className={sec} aria-labelledby="check">
            <h2 id="check" className={h2}>חמישה דברים לבדוק לפני שמזמינים</h2>
            <ol className="flex flex-col gap-2.5 text-[16px] md:text-[17px] leading-relaxed text-body list-decimal ps-5">
              <li><b className="text-ink">כמה מיטות יש באמת</b>, ולא רק &quot;עד כמה אנשים&quot;.</li>
              <li><b className="text-ink">מה כלול:</b> מצעים, מגבות, ניקיון בסוף השהות.</li>
              <li><b className="text-ink">איפה הדירה:</b> ליד המסלולים, או ליד הברים. בחלק מהדירות כתוב במפורש שהן מעל ברים ומועדונים ולא מומלצות למשפחות.</li>
              <li><b className="text-ink">מעלית וחדר רחצה:</b> שווה הרבה כשסוחבים ציוד כל יום וכשהחבורה גדולה.</li>
              <li><b className="text-ink">ביטול:</b> בכל הזמנה בוחרים איך לבטל. הפרטים ב<Link href="/cancellation-policy" className="font-bold text-accent hover:text-accent-hover">מדיניות הביטול</Link>, ומה קורה במלחמה או בסגירת שמיים ב<Link href="/emergency-policy" className="font-bold text-accent hover:text-accent-hover">מדיניות מצב חירום</Link>.</li>
            </ol>
          </section>

          <section className={sec} aria-labelledby="why">
            <h2 id="why" className={h2}>למה ואל טורנס</h2>
            <p className={p}>
              ואל טורנס נמצאת בגובה 2,300 מ&apos;, הכפר הגבוה ביותר באירופה, והיא חלק משלושת העמקים, שטח הסקי המחובר הגדול בעולם, עם כ-600 ק&quot;מ מסלולים.
              בעונת 2026/27 המעליות בואל טורנס–אורל פתוחות מ-{dmy(LIFT_DATES.val_thorens[0])} עד {dmy(LIFT_DATES.val_thorens[1])}, וכל שלושת העמקים מ-{dmy(LIFT_DATES.trois_vallees[0])} עד {dmy(LIFT_DATES.trois_vallees[1])}.{" "}
              <Link href="/guide" className="font-bold text-accent hover:text-accent-hover">המדריך לואל טורנס</Link>
            </p>
          </section>

          <section className={sec} aria-labelledby="faq">
            <h2 id="faq" className={h2}>שאלות נפוצות</h2>
            <div className="flex flex-col gap-3">
              {faq.map(f => (
                <details key={f.q} className={`${card} p-4 md:p-5 group`} open>
                  <summary className="font-bold text-[17px] text-ink cursor-pointer list-none">{f.q}</summary>
                  <p className={`${p} mt-2`}>{f.a}</p>
                </details>
              ))}
            </div>
            <p className="text-[13px] text-muted">
              מקורות: המחירים והדירות מתוך האתר, נכון ל-{dmy(today)}. תאריכי העונה וגודל שטח הסקי: <a href="https://www.les3vallees.com/" className="underline" rel="noopener">les3vallees.com</a>, <a href="https://www.valthorens.com/" className="underline" rel="noopener">valthorens.com</a>.
            </p>
          </section>
        </div>

        {/* side: where to go next */}
        <aside className="lg:sticky lg:top-[96px] flex flex-col gap-3" aria-label="עוד בנושא">
          <div className={`${card} p-5 flex flex-col gap-3`}>
            <span className="font-display font-bold text-[18px] text-ink">לפני שמזמינים</span>
            <Link href="/weekly" className="font-bold text-accent hover:text-accent-hover">דירות שבת עד שבת: מחיר לכל שבוע</Link>
            <Link href="/transfers" className="font-bold text-accent hover:text-accent-hover">הסעה מז&apos;נבה או מליון</Link>
            <Link href={GUIDE_PATHS.pass} className="font-bold text-accent hover:text-accent-hover">סקי פס ואל טורנס: מחירים</Link>
            <Link href={GUIDE_PATHS.arrive} className="font-bold text-accent hover:text-accent-hover">איך מגיעים לואל טורנס מישראל</Link>
            <Link href="/emergency-policy" className="font-bold text-accent hover:text-accent-hover">מה קורה במצב חירום או מלחמה</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

