import Link from "next/link";
import { wrap, card, h2 } from "@/components/ui";
import { TRANSFER_PRICE } from "@/lib/deal-pricing";
import { ORG_ID, SITE, VAL_THORENS, breadcrumbLd, faqLd, ldJson } from "@/lib/site";
import TransfersClient from "./TransfersClient";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** "9:00" → "09:00"; anything else → "" */
const hhmm = (v: string) => { const m = v.match(/^(\d{1,2}):(\d{2})$/); return m && +m[1] < 24 && +m[2] < 60 ? `${m[1].padStart(2, "0")}:${m[2]}` : ""; };
const flightNo = (v: string) => (/^[A-Za-z0-9]{2}\s?\d{1,4}$/.test(v.trim()) ? v.trim().toUpperCase().replace(/\s/, "") : "");

/*
 * Airport transfers. The page renders on the server (it used to reach search
 * engines as a loading screen): the form, then how it works, the airports
 * and the questions people ask. The form's live prices run in the browser.
 */
export default async function TransfersPage({ searchParams }: Props) {
  const params = await searchParams;
  const checkin = ISO.test(one(params.checkin)) ? one(params.checkin) : "";
  const checkout = ISO.test(one(params.checkout)) ? one(params.checkout) : "";
  const guests = Math.min(20, Math.max(1, parseInt(one(params.guests)) || 2));

  const faq = [
    {
      q: "כמה עולה הסעה משדה התעופה לואל טורנס?",
      a: `בהזמנה עם דירה: €${TRANSFER_PRICE} לאדם, הלוך וחזור. בהזמנה של הסעה בלבד, המחיר נקבע לפי השדה, התאריך, מספר הנוסעים וסוג הרכב, ומופיע בטופס. בטיסות אל על ישירות המחיר קבוע: €${TRANSFER_PRICE / 2} לאדם לכל כיוון.`,
    },
    {
      q: "כמה זמן לוקחת הנסיעה?",
      a: "מז'נבה כשעתיים וחצי, ומליון כשלוש שעות. זה תלוי בתנועה ובמזג האוויר בדרך למעלה.",
    },
    {
      q: "ההסעה מגיעה עד הדירה?",
      a: "כן. מהשדה עד הדירה בואל טורנס, ובסוף החופשה חזרה לשדה.",
    },
    {
      q: "מה צריך כדי להזמין?",
      a: "מספר טיסה, תאריך ושעה לכל כיוון, וכמה נוסעים. אחרי השליחה נחזור אליכם לאישור ולתשלום.",
    },
    {
      q: "אפשר להזמין הסעה בלי דירה?",
      a: "כן, הטופס כאן הוא להסעה בלבד. מי שמזמין דירה יכול להוסיף את ההסעה כבר בעמוד הדירה.",
    },
    {
      q: "מה עם מזוודות וציוד סקי?",
      a: "בטופס כותבים כמה מזוודות וכמה סטים של ציוד סקי, כדי שיגיע רכב מתאים.",
    },
  ];

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${SITE}/transfers#service`,
      name: "הסעה משדה התעופה לואל טורנס",
      serviceType: "Airport transfer",
      provider: { "@id": ORG_ID },
      areaServed: [
        { "@type": "Airport", name: "Geneva Airport", iataCode: "GVA" },
        { "@type": "Airport", name: "Lyon–Saint-Exupéry Airport", iataCode: "LYS" },
        VAL_THORENS,
      ],
      offers: {
        "@type": "Offer",
        price: TRANSFER_PRICE,
        priceCurrency: "EUR",
        url: `${SITE}/transfers`,
        description: "לאדם, הלוך וחזור, משדה התעופה עד הדירה, בהזמנה עם דירה",
      },
    },
    faqLd(faq),
    breadcrumbLd([["דף הבית", "/"], ["הסעות", "/transfers"]]),
  ];

  const p = "text-[16px] md:text-[17px] leading-relaxed text-body";
  const steps = [
    { t: "בוחרים שדה וכיוון", d: "ז'נבה או ליון, הלוך, חזור או שניהם." },
    { t: "ממלאים את פרטי הטיסה", d: "מספר טיסה, תאריך ושעה, וכמה אתם. המחיר מופיע בטופס." },
    { t: "שולחים", d: "אנחנו חוזרים אליכם לאישור ולתשלום." },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
      <TransfersClient initial={{ checkin, checkout, guests, aptName: one(params.apartment), aptId: one(params.apartment_id),
        airport: one(params.airport).toUpperCase() === "LYS" ? "LYS" : "GVA",
        outTime: hhmm(one(params.outTime)), retTime: hhmm(one(params.retTime)),
        outFlight: flightNo(one(params.outFlight)), retFlight: flightNo(one(params.retFlight)),
        direction: one(params.direction) === "outbound" || one(params.direction) === "return" ? (one(params.direction) as "outbound" | "return") : "both" }} />

      <div className="bg-white border-t border-line" dir="rtl">
        <div className={`${wrap} py-12 md:py-16 flex flex-col gap-12 md:gap-14 max-w-[880px]`}>
          <section className="flex flex-col gap-4" aria-labelledby="how">
            <h2 id="how" className={h2}>איך זה עובד</h2>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {steps.map((s, i) => (
                <li key={s.t} className={`${card} p-5 flex flex-col gap-1.5`}>
                  <span className="w-8 h-8 rounded-full bg-accent-soft text-accent text-[15px] font-extrabold flex items-center justify-center">{i + 1}</span>
                  <span className="font-bold text-[17px] text-ink">{s.t}</span>
                  <span className="text-[15px] leading-relaxed text-body">{s.d}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="flex flex-col gap-4" aria-labelledby="airport">
            <h2 id="airport" className={h2}>מאיזה שדה: ז&apos;נבה או ליון?</h2>
            <p className={p}>
              שני השדות במרחק נסיעה דומה מואל טורנס: מז&apos;נבה (GVA) כשעתיים וחצי, ומליון (LYS) כשלוש שעות.
              בוחרים לפי הטיסה. כשמזמינים דירה, אנחנו בודקים אם יש בתאריכים שלכם טיסה ישירה מתל אביב לז&apos;נבה או לליון, ומציגים אותה במחיר האמיתי.{" "}
              <Link href="/guide/איך-מגיעים-לואל-טורנס-מישראל" className="font-bold text-accent hover:text-accent-hover">איך מגיעים לואל טורנס מישראל</Link>
            </p>
          </section>

          <section className="flex flex-col gap-4" aria-labelledby="faq">
            <h2 id="faq" className={h2}>שאלות נפוצות על ההסעה</h2>
            <div className="flex flex-col gap-3">
              {faq.map(f => (
                <div key={f.q} className={`${card} p-4 md:p-5`}>
                  <h3 className="font-bold text-[17px] text-ink">{f.q}</h3>
                  <p className={`${p} mt-1.5`}>{f.a}</p>
                </div>
              ))}
            </div>
            <p className={p}>
              מחפשים גם דירה? <Link href="/apartments" className="font-bold text-accent hover:text-accent-hover">דירות בואל טורנס</Link>, עם הסעה, סקי פס וציוד באותה הזמנה.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
