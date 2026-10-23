import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { pageMeta } from "@/lib/page-meta";
import { breadcrumbLd, faqLd, ldJson } from "@/lib/site";
import { wrap, card, h2, PageTop, CheckList } from "@/components/ui";
import SearchWidget from "@/components/SearchWidget";
import { packageWeeks, PACKAGE_GROUPS, type PackageGroup, type PackageWeek } from "@/lib/package-prices";
import { LIFT_DATES, PASS_AREA_LABEL, TRANSFER_PRICE } from "@/lib/deal-pricing";
import { equipCost } from "@/lib/pricing";
import { HOLIDAY_WEEKS } from "@/lib/holiday-weeks";
import type { Apartment, SkiPass } from "@/types";

/*
 * "חבילת סקי לואל טורנס": what a package is, its price per person for every
 * Saturday of the season (from the open agency weeks, the same numbers as
 * "דיל שלם" on /weekly), how to book and the questions people ask. Rendered
 * on the server, so search engines and AI answers read the prices too.
 * The address is plain ASCII, so rebuilding it every hour is safe (a Hebrew
 * one isn't on Vercel, see the guides).
 */
export const revalidate = 3600;

export const metadata = pageMeta({
  title: "חבילת סקי לואל טורנס 2026/27: מחיר לאדם לכל שבוע | SkiShare",
  description: "חבילת סקי לואל טורנס לשבוע שלם: דירה משבת לשבת, סקי פס לפי התאריכים והסעה מהשדה, במחיר לאדם לזוג, ל-4 ול-6. טיסה ישירה וציוד מוסיפים כשרוצים, וכל אחד משלם את החלק שלו.",
  path: "/packages",
});

const dm = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}`; };
const dmy = (iso: string) => { const [y, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}.${y}`; };
const eur = (n: number) => `€${n.toLocaleString("en-US")}`;
const GROUP_LABEL: Record<PackageGroup, string> = { 2: "לזוג", 4: "ל-4", 6: "ל-6" };
const weeklyHref = (week: string, n: number) => `/weekly?week=${week}&deal=full&guests=${n}`;

async function load(): Promise<{ weeks: PackageWeek[]; asOf: string } | null> {
  const db = createServerClient();
  const [{ data: apts, error }, { data: passes }] = await Promise.all([
    db.from("apartments").select("max_guests,available_weeks").eq("source", "la_cime").eq("available", true),
    db.from("ski_passes").select("*").eq("available", true).eq("type", "adult").order("duration_days", { ascending: true }),
  ]);
  if (error || !apts) return null;
  const today = new Date().toISOString().slice(0, 10);
  return { weeks: packageWeeks(apts as Pick<Apartment, "max_guests" | "available_weeks">[], (passes ?? []) as SkiPass[], today), asOf: today };
}

/** the cheapest and the dearest week for a group of 4, for the answer about the price */
function range4(weeks: PackageWeek[]) {
  const priced = weeks.filter(w => w.perPerson[4] !== null) as (PackageWeek & { perPerson: Record<4, number> })[];
  if (priced.length < 2) return null;
  const sorted = [...priced].sort((a, b) => a.perPerson[4] - b.perPerson[4]);
  return { low: sorted[0], high: sorted[sorted.length - 1] };
}

const p = "text-[16px] md:text-[17px] leading-relaxed text-body";
const th = "text-start align-bottom font-bold text-ink px-2 md:px-4 py-2.5 bg-soft";
const td = "text-start align-top px-2 md:px-4 py-2.5 border-t border-line";

export default async function PackagesPage() {
  const data = await load().catch(() => null);
  const weeks = data?.weeks ?? [];
  const r = range4(weeks);
  const equipWeek = equipCost(6);
  const [tvOpen, tvClose] = LIFT_DATES.trois_vallees;
  const passDays = weeks[0]?.passDays ?? 6;

  const faq = [
    ...(r ? [{
      q: "כמה עולה חבילת סקי לואל טורנס?",
      a: `לקבוצה של 4, החבילה (דירה לשבוע, סקי פס והסעה) מתחילה עכשיו ב-${eur(r.low.perPerson[4])} לאדם בשבוע של ${dm(r.low.week)}, ומגיעה ל-${eur(r.high.perPerson[4])} לאדם בשבוע של ${dm(r.high.week)}. המחיר לכל שבוע בטבלה למעלה, מהדירות שעוד פנויות.`,
    }] : []),
    {
      q: "הטיסה כלולה בחבילה?",
      a: "לא. טיסה מוסיפים בעמוד הדירה, ורק כשיש טיסה ישירה הלוך וחזור לז'נבה או לליון, במחיר האמיתי באותו רגע. אפשר גם להזמין טיסה לבד ולקחת מאיתנו רק את החבילה.",
    },
    {
      q: "איזה סקי פס יש בחבילה?",
      a: `סקי פס לשלושת העמקים כשכל האזור פתוח, מ-${dmy(tvOpen)} עד ${dmy(tvClose)}. בשבועות שלפני ואחרי, סקי פס לואל טורנס ואורל. הפס הוא ל-${passDays} ימי סקי בשבוע של 7 לילות.`,
    },
    {
      q: "אפשר להזמין רק דירה?",
      a: "כן. בכל דירה אפשר לבחור רק דירה, או דירה עם סקי פס, הסעה וציוד. מה שבוחרים, זה מה שמשלמים.",
    },
    {
      q: "איך משלמים כשאנחנו קבוצה?",
      a: "כל אחד יכול לשלם את החלק שלו בקישור נפרד, ואין צורך שאחד ישלם על כולם.",
    },
    {
      q: "מה קורה אם יש מלחמה או שהשמיים נסגרים?",
      a: "יש לנו מדיניות כתובה למצב חירום, מלחמה וסגירת שמיים. היא חלק מהתקנון.",
    },
  ];

  return (
    <div className="flex-1 bg-white" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([["דף הבית", "/"], ["חבילות סקי לואל טורנס", "/packages"]])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqLd(faq)) }} />
      <PageTop
        soft
        crumbs={[{ label: "דף הבית", href: "/" }, { label: "חבילות סקי" }]}
        title="חבילת סקי לואל טורנס"
        sub="דירה לשבוע, סקי פס והסעה מהשדה, במחיר לאדם. כל אחד מהחבורה משלם את החלק שלו."
      >
        <div className="mt-6 md:mt-8">
          <SearchWidget initialDeal="full" flat />
        </div>
      </PageTop>

      <div className={`${wrap} py-10 md:py-14 flex flex-col gap-12 md:gap-14 max-w-[900px]`}>
        <section aria-labelledby="whats-in" className="flex flex-col gap-4">
          <h2 id="whats-in" className={h2}>מה יש בחבילה</h2>
          <CheckList className={p} items={[
            <span key="apt"><strong className="text-ink">דירה לשבוע בואל טורנס,</strong> משבת לשבת, לכל החבורה.</span>,
            <span key="pass"><strong className="text-ink">סקי פס ל-{passDays} ימים</strong> שמתאים לתאריכים: שלושת העמקים כשהכל פתוח, ואל טורנס ואורל בתחילת העונה ובסופה.</span>,
            <span key="transfer"><strong className="text-ink">הסעה מהשדה, הלוך וחזור,</strong> מז&apos;נבה או מליון: {eur(TRANSFER_PRICE)} לאדם.</span>,
          ]} />
          <p className={p}>
            ואם רוצים, מוסיפים בעמוד הדירה: ציוד סקי ({eur(30)} ליום, {eur(equipWeek)} לשבוע), וטיסה ישירה כשיש.
          </p>
        </section>

        <section aria-labelledby="by-week" className="flex flex-col gap-4">
          <h2 id="by-week" className={h2}>מחיר חבילה לכל שבוע בעונה</h2>
          <p className={p}>
            המחיר לאדם לפי כמה שאתם: הדירה הכי זולה שעוד פנויה ומתאימה לכם, מחולקת ביניכם, ועוד סקי פס והסעה. לוחצים על שבוע ורואים את כל הדירות של אותו שבוע.
          </p>
          {weeks.length > 0 ? (
            <div className={`${card} overflow-x-auto`}>
              <table className="w-full text-[14px] md:text-[16px] leading-snug tabular-nums">
                <caption className="text-start font-bold text-ink text-[14px] md:text-[15px] px-2 md:px-4 pt-3 pb-2.5">
                  נכון ל-{dmy(data!.asOf)}, לאדם, דירה + סקי פס + הסעה
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className={th}>שבת כניסה</th>
                    {PACKAGE_GROUPS.map(n => <th key={n} scope="col" className={th}>{GROUP_LABEL[n]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map(w => (
                    <tr key={w.week}>
                      <th scope="row" className={`${td} font-bold text-ink`}>
                        <Link href={weeklyHref(w.week, 4)} className="text-accent hover:text-accent-hover">{dm(w.week)}</Link>
                        {HOLIDAY_WEEKS[w.week] && (
                          <Link href={encodeURI(HOLIDAY_WEEKS[w.week].href)} className="block text-[12px] md:text-[13px] font-bold text-accent hover:text-accent-hover mt-0.5">
                            {HOLIDAY_WEEKS[w.week].label}
                          </Link>
                        )}
                        {w.area !== "trois_vallees" && (
                          <span className="block text-[12px] md:text-[13px] font-normal text-muted mt-0.5">פס {PASS_AREA_LABEL[w.area]} ואורל</span>
                        )}
                      </th>
                      {PACKAGE_GROUPS.map(n => (
                        <td key={n} className={`${td} text-body`}>
                          {w.perPerson[n] !== null ? eur(w.perPerson[n]!) : <span className="text-muted">אין</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={p}>
              כרגע אין כאן מחירים. את כל השבועות אפשר לראות ב<Link href="/weekly?deal=full" className="font-bold text-accent hover:text-accent-hover">שבת עד שבת</Link>.
            </p>
          )}
          <p className={p}>
            בדירות שלנו אפשר גם תאריכים אחרים, לא רק משבת לשבת: <Link href="/apartments" className="font-bold text-accent hover:text-accent-hover">דירות בואל טורנס</Link>.
          </p>
        </section>

        <section aria-labelledby="how" className="flex flex-col gap-4">
          <h2 id="how" className={h2}>איך מזמינים</h2>
          <ol className="flex flex-col gap-2.5">
            {[
              "בוחרים שבוע וכמה אתם, בחיפוש למעלה או בטבלה.",
              "בוחרים דירה. בעמוד הדירה רואים מה כלול ומוסיפים סקי פס, הסעה, ציוד וטיסה ישירה כשיש.",
              "מזמינים, וכל אחד משלם את החלק שלו בקישור משלו. אפשר גם לקבל הצעת מחיר ב-PDF.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3 text-[16px] md:text-[17px] leading-relaxed text-body">
                <span className="mt-[2px] w-[26px] h-[26px] rounded-full bg-accent-soft text-accent text-[14px] font-bold flex items-center justify-center shrink-0 tabular-nums">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <p className={p}>
            מה לא כלול: טיסה (רק אם מוסיפים), אוכל, בית ספר לסקי וביטוח נסיעות. ברוב הדירות מצעים, מגבות וניקיון בסוף השהות לא כלולים, ואפשר להזמין אותם מראש. זה כתוב בתיאור של כל דירה.
          </p>
        </section>

        <section aria-labelledby="faq" className="flex flex-col gap-4">
          <h2 id="faq" className={h2}>שאלות על חבילות סקי</h2>
          <div className="flex flex-col gap-3">
            {faq.map(f => (
              <div key={f.q} className={`${card} p-4 md:p-5`}>
                <h3 className="font-bold text-[17px] text-ink">{f.q}</h3>
                <p className={`${p} mt-1.5`}>
                  {f.a}
                  {f.q.startsWith("מה קורה אם") && <> <Link href="/emergency-policy" className="font-bold text-accent hover:text-accent-hover">מדיניות החירום</Link></>}
                </p>
              </div>
            ))}
          </div>
        </section>

        <nav aria-label="עוד בתכנון" className="flex flex-wrap gap-x-5 gap-y-2 text-[16px]">
          <Link href="/weekly?deal=full" className="font-bold text-accent hover:text-accent-hover">כל השבועות, שבת עד שבת</Link>
          <Link href="/transfers" className="font-bold text-accent hover:text-accent-hover">הסעות לואל טורנס</Link>
          <Link href={encodeURI("/guide/מחיר-סקי-פס-ואל-טורנס")} className="font-bold text-accent hover:text-accent-hover">מחיר סקי פס</Link>
          <Link href={encodeURI("/guide/מתי-לנסוע-לואל-טורנס")} className="font-bold text-accent hover:text-accent-hover">מתי לנסוע</Link>
          <Link href={encodeURI("/guide/חופשת-סקי-לקבוצות-בואל-טורנס")} className="font-bold text-accent hover:text-accent-hover">חופשת סקי לקבוצות</Link>
        </nav>
      </div>
    </div>
  );
}

