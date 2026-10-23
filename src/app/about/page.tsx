import Link from "next/link";
import { wrap, card, btn, h2, Crumbs } from "@/components/ui";
import { pageMeta } from "@/lib/page-meta";
import { ORG_ID, SITE, SOCIAL, breadcrumbLd, faqLd, ldJson } from "@/lib/site";
import { buildWaHref } from "@/lib/whatsapp";

/*
 * Who SkiShare is, in plain facts: the page an assistant (ChatGPT, Gemini,
 * Perplexity) or a person reads to describe the company. Every line here is
 * also true on the rest of the site; no numbers that go stale.
 */

export const metadata = pageMeta({
  title: "אודות SkiShare: חברה ישראלית להשכרת דירות בואל טורנס | SkiShare",
  description: "SkiShare (סקי שר) היא חברה ישראלית להשכרת דירות בואל טורנס, צרפת: דירות משלנו ודירות לשבוע (שבת עד שבת), הזמנה ותשלום באתר, ובנוסף לבחירה סקי פס, הסעה, ציוד וטיסה ישירה. שירות בעברית.",
  path: "/about",
});

const FAQ = [
  {
    q: "מה זה SkiShare?",
    a: "SkiShare (סקי שר) היא חברה ישראלית להשכרת דירות בואל טורנס, צרפת. יש לנו דירות משלנו בואל טורנס וגם דירות לשבוע (שבת עד שבת). רואים באתר את הדירות עם תמונות ומחיר, ומזמינים ומשלמים באתר.",
  },
  {
    q: "האם SkiShare היא חברה ישראלית?",
    a: "כן. SkiShare היא חברה ישראלית מקיסריה, והשירות בעברית: באתר, בצ'אט ובוואטסאפ.",
  },
  {
    q: "אפשר להזמין רק דירה, בלי טיסה?",
    a: "כן. הדירה היא הבסיס, וכל השאר בחירה שלכם: סקי פס (ואל טורנס או כל 3 העמקים), הסעה משדה התעופה בז'נבה או בליון, ציוד סקי או סנובורד, וטיסה ישירה מתל אביב כשיש בתאריכים.",
  },
  {
    q: "איך משלמים?",
    a: "באתר, בכרטיס אשראי דרך PayPlus (עמלת סליקה 1.9%), או בהעברה בנקאית בלי עמלה. המחיר מוצג לאדם, וכל אחד בחבורה יכול לשלם את החלק שלו.",
  },
  {
    q: "מי עונה בצ'אט ובוואטסאפ?",
    a: "עוזר דיגיטלי (AI) שעונה בעברית, ואפשר לבקש בכל רגע לדבר עם נציג.",
  },
  {
    q: "מה קורה אם יש מצב חירום או סגירת שמיים?",
    a: "יש לנו מדיניות כתובה ומראש למצב חירום, מלחמה וכוח עליון: מה קורה עם הטיסה, הדירה והסקי פס.",
  },
];

const WHAT = [
  { t: "דירות משלנו בואל טורנס", d: "דירות שאנחנו מנהלים בעצמנו, עם תמונות, גודל, מספר אורחים ומחיר באתר.", href: "/apartments", cta: "לכל הדירות" },
  { t: "דירות לשבוע, שבת עד שבת", d: "דירות לשבוע שלם בכל שבת של העונה, עם המחיר לאדם.", href: "/weekly", cta: "לשבועות" },
  { t: "חבילות סקי", d: "שבוע בדירה עם סקי פס והסעה מהשדה, במחיר לאדם.", href: "/packages", cta: "לחבילות" },
  { t: "הסעות", d: "שאטל בין שדה התעופה (ז'נבה או ליון) לדירה בואל טורנס, הלוך וחזור.", href: "/transfers", cta: "להסעות" },
  { t: "סיזיונרים", d: "דירות לשהייה ארוכה, חודשיים ומעלה, למי שבא לכל העונה.", href: "/seasonaires", cta: "לסיזיונרים" },
  { t: "מדריכים לואל טורנס", d: "מתי לנסוע, כמה עולה סקי פס, איך מגיעים, איפה לגור ומזג האוויר.", href: "/guide", cta: "למדריכים" },
];

const ABOUT_LD = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${SITE}/about#page`,
  url: `${SITE}/about`,
  name: "אודות SkiShare",
  inLanguage: "he-IL",
  about: { "@id": ORG_ID },
  mainEntity: { "@id": ORG_ID },
};

export default function AboutPage() {
  const waHref = buildWaHref({ intro: "היי! 👋 יש לי שאלה על SkiShare:", lines: ["רציתי לשאול..."] });
  return (
    <div className="bg-white text-ink" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ABOUT_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([["דף הבית", "/"], ["אודות", "/about"]])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqLd(FAQ)) }} />

      <header className="bg-soft border-b border-line">
        <div className={`${wrap} pt-6 md:pt-8 pb-9 md:pb-12`}>
          <Crumbs items={[{ label: "דף הבית", href: "/" }, { label: "אודות" }]} />
          <div className="max-w-[820px] mt-5 md:mt-6 flex flex-col gap-4">
            <h1 className="font-display font-extrabold text-[32px] leading-[1.12] md:text-[46px] md:leading-[1.08] tracking-tight text-ink">
              SkiShare: חברה ישראלית להשכרת דירות בואל טורנס
            </h1>
            <p className="text-[17px] md:text-[19px] leading-relaxed text-body">
              SkiShare (סקי שר) היא חברה ישראלית שמשכירה דירות בואל טורנס, צרפת, בעברית.
              יש לנו דירות משלנו בואל טורנס, ודירות לשבוע שלם משבת עד שבת. רואים כל דירה באתר
              עם תמונות ומחיר, ומזמינים ומשלמים באתר. מעל הדירה מוסיפים מה שרוצים: סקי פס,
              הסעה מהשדה, ציוד, וטיסה ישירה מתל אביב כשיש.
            </p>
            <div className="flex flex-wrap gap-3 mt-1">
              <Link href="/apartments" className={btn.primary}>לדירות בואל טורנס</Link>
              <a href={waHref} target="_blank" rel="noopener noreferrer" className={btn.outline}>שאלה? וואטסאפ</a>
            </div>
          </div>
        </div>
      </header>

      <main className={`${wrap} py-10 md:py-14 flex flex-col gap-12`}>
        <section className="flex flex-col gap-5">
          <h2 className={h2}>מה יש אצלנו</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHAT.map(w => (
              <Link key={w.href} href={w.href} className={`${card} p-5 flex flex-col gap-2 hover:border-line-strong transition-colors`}>
                <h3 className="font-display font-bold text-[19px] text-ink">{w.t}</h3>
                <p className="text-[16px] leading-relaxed text-body flex-1">{w.d}</p>
                <span className="text-[15px] font-bold text-accent">{w.cta} ←</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4 max-w-[820px]">
          <h2 className={h2}>איך זה עובד</h2>
          <ol className="list-decimal pr-6 flex flex-col gap-2 text-[16px] md:text-[17px] leading-[1.75] text-body">
            <li>בוחרים תאריכים ומספר אנשים, ורואים את הדירות הפנויות בואל טורנס עם המחיר.</li>
            <li>בוחרים דירה, ומוסיפים אם רוצים סקי פס, הסעה, ציוד או טיסה ישירה.</li>
            <li>משלמים באתר. כל אחד מהחבורה יכול לשלם את החלק שלו בקישור משלו.</li>
            <li>לפני החופשה ובמהלכה עונים לכם בעברית, בצ&apos;אט ובוואטסאפ.</li>
          </ol>
        </section>

        <section className="flex flex-col gap-4 max-w-[820px]">
          <h2 className={h2}>שאלות על SkiShare</h2>
          <div className="flex flex-col gap-3">
            {FAQ.map(f => (
              <div key={f.q} className={`${card} p-5`}>
                <h3 className="font-bold text-[17px] text-ink mb-1.5">{f.q}</h3>
                <p className="text-[16px] leading-relaxed text-body">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="text-[15px] text-muted">
            עוד: <Link href="/terms" className="underline">תקנון וביטולים</Link> ·{" "}
            <Link href="/emergency-policy" className="underline">מצב חירום וכוח עליון</Link> ·{" "}
            <Link href="/en" className="underline">English</Link> ·{" "}
            <Link href="/fr" className="underline">Français</Link> ·{" "}
            <a href={SOCIAL.instagram} target="_blank" rel="noopener me" className="underline">אינסטגרם</a> ·{" "}
            <a href={SOCIAL.facebook} target="_blank" rel="noopener me" className="underline">פייסבוק</a>
          </p>
        </section>
      </main>
    </div>
  );
}
