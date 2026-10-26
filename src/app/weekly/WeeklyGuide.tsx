import Link from "next/link";
import type { Apartment } from "@/types";
import { card, h2 } from "@/components/ui";
import { TRANSFER_PRICE } from "@/lib/deal-pricing";
import { faqLd, ldJson } from "@/lib/site";

/*
 * Under the weeks: how Saturday-to-Saturday works and the questions people
 * ask, with the cheapest weeks taken from the open weeks (so it stays true).
 */
const dm = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}`; };

export default function WeeklyGuide({ apartments }: { apartments: Apartment[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const mins = new Map<string, number>();
  for (const a of apartments) for (const w of a.available_weeks ?? []) {
    if (w.week < today || !(w.price > 0)) continue;
    mins.set(w.week, Math.min(mins.get(w.week) ?? Infinity, w.price));
  }
  const cheap = [...mins.entries()].sort(([, a], [, b]) => a - b).slice(0, 3).map(([w]) => w).sort().map(dm);
  const cheapText = cheap.length < 2 ? cheap.join("") : `${cheap.slice(0, -1).join(", ")} ו-${cheap[cheap.length - 1]}`;

  const faq = [
    {
      q: "אפשר להגיע ביום אחר, לא בשבת?",
      a: "בדירות לשבוע השבוע קבוע, משבת לשבת, והמחיר הוא לשבוע מלא גם אם מגיעים יום או יומיים אחר כך. בדירות שלנו אפשר לבחור תאריכים אחרים.",
    },
    {
      q: "מה כלול במחיר השבוע?",
      a: "הלינה לשבוע, לדירה כולה. ברוב הדירות מצעים, מגבות וניקיון בסוף השהות לא כלולים, ואפשר להזמין אותם מראש. זה כתוב בתיאור של כל דירה.",
    },
    {
      q: "איך מתחלק המחיר בחבורה?",
      a: "ליד כל דירה מופיע המחיר לאדם לפי כמה שאתם, וכל אחד יכול לשלם את החלק שלו בקישור נפרד.",
    },
    ...(cheap.length ? [{
      q: "באיזה שבוע הכי זול?",
      a: `לפי הדירות שעוד פנויות, השבועות הכי זולים עכשיו מתחילים ב-${cheapText}. הכי יקר בחג המולד ובחופשות החורף של צרפת בפברואר.`,
    }] : []),
  ];

  const p = "text-[16px] md:text-[17px] leading-relaxed text-body";
  return (
    <div className="mt-14 md:mt-16 flex flex-col gap-10 max-w-[800px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqLd(faq)) }} />
      <section className="flex flex-col gap-3" aria-labelledby="how-weekly">
        <h2 id="how-weekly" className={h2}>שבת עד שבת: איך זה עובד</h2>
        <p className={p}>
          רוב הדירות בואל טורנס מושכרות לשבוע שלם, מכניסה בשבת ועד היציאה בשבת שאחריה. בשבת הסוכנויות מחליפות אורחים, ולכן שם נמצאות רוב הדירות הפנויות.
        </p>
        <p className={p}>
          בכל שבוע רואים כאן את הדירות שעוד פנויות ואת המחיר. ב&quot;דיל שלם&quot; המחיר לאדם כולל גם סקי פס לפי התאריכים והסעה מהשדה (€{TRANSFER_PRICE} לאדם, הלוך וחזור). טיסה ישירה מוסיפים בעמוד הדירה, רק כשיש.{" "}
          <Link href="/apartments" className="font-bold text-accent hover:text-accent-hover">כל הדירות בואל טורנס</Link>
        </p>
      </section>
      <section className="flex flex-col gap-3" aria-labelledby="faq-weekly">
        <h2 id="faq-weekly" className={h2}>שאלות על שבת עד שבת</h2>
        <div className="flex flex-col gap-3">
          {faq.map(f => (
            <div key={f.q} className={`${card} p-4 md:p-5`}>
              <h3 className="font-bold text-[17px] text-ink">{f.q}</h3>
              <p className={`${p} mt-1.5`}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
