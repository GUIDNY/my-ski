import Link from "next/link";
import { Suspense } from "react";
import SearchWidget from "@/components/SearchWidget";
import OpenChatButton from "@/components/OpenChatButton";
import AppPromo from "@/components/home/AppPromo";
import WeekPackages, { WeekPackagesSkeleton } from "@/components/home/WeekPackages";
import { helperWaHref } from "@/lib/helper-whatsapp";
import { pageMeta } from "@/lib/page-meta";
import { alternatesFor } from "@/lib/intl/metadata";

export const metadata = pageMeta({
  title: "חופשת סקי בואל טורנס: דירות לחבר'ה, סקי פס והסעה | SkiShare",
  description: "SkiShare, חברה ישראלית להשכרת דירות בואל טורנס: מזמינים ומשלמים באתר, ומוסיפים סקי פס, הסעה, ציוד וטיסה ישירה. כל אחד משלם את החלק שלו.",
  path: "/",
  languages: alternatesFor(""),
});

// The packages section prices live inventory (which apartments are free for
// the week, today's Airbnb prices), so the page is rebuilt in the background
// every 10 minutes: visitors and search engines get it from the CDN at once
// instead of waiting about 2 seconds for it to be priced on every view. The
// address is ASCII, so rebuilding it on the server is safe (see guide/[slug]).
export const revalidate = 600;

/* ── Icons (stroke, follow the text color) ─────────────────── */
const ico = (path: React.ReactNode, size = 22) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const IcoChat = ({ size = 22 }: { size?: number }) => ico(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />, size);
const IcoShield = () => ico(<><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></>, 20);

/* ── Content ───────────────────────────────────────────────── */
const trust = [
  { title: "הדירות שלנו", text: "בואל טורנס, מזוג ועד 7 בדירה" },
  { title: "מוסיפים רק מה שצריך", text: "סקי פס, הסעה, ציוד" },
  { title: "כל אחד משלם את החלק שלו", text: "קישור תשלום נפרד לכל אחד" },
  { title: "עונים בוואטסאפ", text: "גם באמצע החופשה" },
];

// "build your own trip": the apartment is the base, everything else is picked
const included = [
  { title: "הדירה", text: "דירות שלנו בואל טורנס, לחבורה או לזוג. ניקיון כלול במחיר.", badge: "הבסיס", link: { href: "/apartments", label: "לדירות" } },
  { title: "סקי פס", text: "ואל טורנס, או כל 600 הק\"מ של שלושת העמקים.", badge: "אם רוצים", link: { href: "/guide/מחיר-סקי-פס-ואל-טורנס", label: "מחירים" } },
  { title: "הסעה מהשדה", text: "שאטל ישיר עד הדירה, הלוך וחזור.", badge: "אם רוצים", link: { href: "/transfers", label: "הסעות" } },
  { title: "ציוד", text: "סקי או סנובורד לכל ימי הגלישה.", badge: "אם רוצים", link: null },
  { title: "טיסה ישירה", text: "רק כשיש ישירה מתל אביב בתאריכים שלכם, במחיר האמיתי.", badge: "כשיש", link: { href: "/guide/איך-מגיעים-לואל-טורנס-מישראל", label: "איך מגיעים" } },
];

// Real guest reviews of our apartments on Airbnb (5 stars, 2026), freely
// translated. Only real reviews go here, never made-up ones.
const AIRBNB_REVIEWS_URL = "https://www.airbnb.com/rooms/1258565407005573291/reviews";
const reviews = [
  { name: "Lauren", from: "מילאנו", when: "מרץ 2026", text: "הדירה הייתה מושלמת לסופ\"ש סקי. סקי-אין סקי-אאוט, לא יכול להיות יותר נוח. מיקום מעולה, קרוב לברים ולמסעדות, והנוף מהמרפסת מקסים. תודה על סופ\"ש מושלם בואל טורנס!" },
  { name: "Aleix", from: "", when: "מרץ 2026", text: "שהות טובה מאוד. הדירה נקייה, מטופחת ובדיוק כמו בתיאור. המארח היה נחמד וענה מהר, אז הצ'ק-אין והשהות עברו חלק. ממליץ." },
  { name: "Brice", from: "", when: "מרץ 2026", text: "הדירה כמו בתיאור, באזור שקט של ואל טורנס, מאובזרת ונוחה." },
];

const resortFacts = [
  { value: "2,300 מ'", label: "גובה הכפר" },
  { value: "600 ק\"מ", label: "מסלולים בשלושת העמקים" },
  { value: "נובמבר–מאי", label: "עונת הסקי" },
  { value: "ז'נבה · ליון · שאמברי", label: "שדות התעופה הקרובים" },
];

const steps = [
  { title: "בוחרים תאריכים וכמה אתם", text: "גם \"סוף ינואר לשבוע\" זה מספיק כדי להתחיל." },
  { title: "מקבלים הצעה מלאה", text: "PDF עם כל הפרטים, המחיר לאדם וקישורי תשלום." },
  { title: "כל אחד משלם את החלק שלו", text: "אין צורך שמישהו אחד ישים את כל הסכום." },
  { title: "נוסעים", text: "ואם צריך משהו באמצע, כותבים לנו בוואטסאפ." },
];

const faq = [
  { q: "מה כלול במחיר?", a: "הדירה, כולל ניקיון בדירות שלנו. אליה מוסיפים מה שצריך: סקי פס, הסעה הלוך וחזור מהשדה וציוד סקי. טיסה ישירה מוסיפים כשיש בתאריכים שלכם, במחיר האמיתי." },
  { q: "אפשר שכל אחד ישלם בנפרד?", a: "כן. כל אחד מהחבורה מקבל קישור ומשלם את החלק שלו." },
  { q: "ומה אם צריך לבטל?", a: "יש אפשרות לביטול גמיש, ומדיניות מסודרת למצבי חירום כמו סגירת שמיים או ביטולי טיסות. כל הפרטים בעמודי המדיניות." },
  { q: "איך מגיעים מהשדה לדירה?", a: "שאטל ישיר משדה התעופה עד הדירה, הלוך וחזור. רק צריך לשלוח לנו את פרטי הטיסה." },
];

/* ── Page ─────────────────────────────────────────────────── */
// the questions below, for search engines and AI answers
const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function Home() {
  const waHref = helperWaHref();
  return (
    <div className="bg-white text-ink" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative flex items-center min-h-[560px] md:min-h-[620px]">
        {/* WebP (a third of the JPEG), a portrait crop on phones, fetched first: the largest paint */}
        {/* a real photo: sunset over Val Thorens from the balcony of one of our apartments (Glaciers) */}
        <picture>
          <source media="(max-width: 767px)" srcSet="/hero-vt-m.webp" type="image/webp" />
          <source srcSet="/hero-vt.webp" type="image/webp" />
          <img src="/hero-vt.jpg" alt="שקיעה מעל ואל טורנס, מהמרפסת של אחת הדירות שלנו" fetchPriority="high" className="absolute inset-0 w-full h-full object-cover object-[center_40%]" />
        </picture>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,14,32,0.30) 0%, rgba(10,14,32,0.50) 55%, rgba(10,14,32,0.70) 100%)" }} />
        <span className="absolute bottom-3 left-4 z-10 text-[12px] md:text-[13px] text-white/75">צולם מהמרפסת של אחת הדירות שלנו</span>
        <div className="relative z-10 w-full max-w-[1100px] mx-auto px-4 pt-12 pb-14 md:pt-16 md:pb-20 flex flex-col items-center gap-5 md:gap-6 text-center">
          <h1 className="font-display font-extrabold text-white text-[42px] leading-[1.08] md:text-[68px] md:leading-[1.05] tracking-tight" style={{ textWrap: "balance" }}>
            חופשת סקי בואל טורנס
          </h1>
          <p className="text-[17px] md:text-[23px] leading-relaxed text-[#F1F5FB] max-w-[720px]">
            הדירות שלנו בואל טורנס, ואיתן סקי פס, הסעה וציוד. מחיר אחד, וכל אחד משלם את החלק שלו.
          </p>
          <SearchWidget />
          <OpenChatButton className="inline-flex items-center gap-2.5 rounded-full bg-white/95 hover:bg-white text-[#0B1B33] px-5 py-2.5 text-[15px] md:text-[16px] font-medium min-h-[44px] transition-colors">
            <span className="text-[#1652F0]"><IcoChat size={18} /></span>
            <span className="md:hidden">לא בטוחים? תכתבו לעוזר שלנו</span>
            <span className="hidden md:inline">לא בטוחים בתאריכים? תכתבו לעוזר שלנו מה בא לכם</span>
          </OpenChatButton>
        </div>
      </section>

      {/* ── Why us ───────────────────────────────────────── */}
      <section aria-label="למה SkiShare" className="bg-[#F4F7FB] border-b border-[#E3E9F2]">
        <div className="max-w-[1240px] mx-auto px-5 md:px-6 py-5 md:py-6 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          {trust.map(t => (
            <div key={t.title} className="border-r-2 border-[#1652F0] pr-3">
              <div className="font-bold text-[15px] md:text-[17px]">{t.title}</div>
              <div className="text-[13px] md:text-[15px] text-[#51607A]">{t.text}</div>
            </div>
          ))}
        </div>
      </section>

      <Link href="/emergency-policy" className="block border-b border-[#E3E9F2] bg-white hover:bg-[#FBFCFE] transition-colors">
        <div className="max-w-[1240px] mx-auto px-5 md:px-6 py-3.5 flex items-center gap-3 text-[14px] md:text-[15px] text-[#3D4B63]">
          <span className="text-[#1652F0] shrink-0"><IcoShield /></span>
          <span className="flex-1">מה קורה במקרה של סגירת שמיים או ביטולי טיסות? כתבנו בדיוק מה מגיע לכם.</span>
          <span className="font-bold text-[#1652F0] shrink-0">למדיניות ←</span>
        </div>
      </Link>

      {/* ── What's included: a real apartment, and a plain list ── */}
      <section className="max-w-[1240px] mx-auto px-5 md:px-6 pt-14 md:pt-20 pb-4 md:pb-8 flex flex-wrap gap-8 md:gap-14 items-center">
        <div className="flex-[1_1_440px] min-w-0">
          <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight">בונים את החופשה שלכם</h2>
          <p className="text-[16px] md:text-[18px] text-[#51607A] mt-2 mb-5 md:mb-6">מתחילים מהדירה ומוסיפים רק מה שצריך. המחיר לאדם מתעדכן מיד.</p>
          <ul className="border-t border-[#E3E9F2]">
            {included.map(i => (
              <li key={i.title} className="flex items-baseline gap-4 py-3.5 md:py-4 border-b border-[#E3E9F2]">
                <span className="w-[74px] shrink-0 text-[13px] md:text-[14px] font-bold text-[#1652F0]">{i.badge}</span>
                <span className="flex-1 min-w-0">
                  <span className="font-bold text-[17px] md:text-[19px]">{i.title}</span>
                  <span className="block text-[14px] md:text-[16px] leading-relaxed text-[#51607A]">{i.text}</span>
                </span>
                {i.link && <Link href={i.link.href} className="shrink-0 text-[14px] md:text-[15px] font-bold text-[#1652F0] hover:text-[#0F3FC2]">{i.link.label} ←</Link>}
              </li>
            ))}
          </ul>
        </div>
        <figure className="flex-[1_1_340px] min-w-0 max-w-[460px] mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/apt-living.webp" alt="הסלון באחת הדירות שלנו בואל טורנס, עם נוף להרים" loading="lazy" className="w-full h-[380px] md:h-[520px] object-cover rounded-[18px] block" />
          <figcaption className="text-[13px] text-[#51607A] mt-2">נבס 163, אחת הדירות שלנו. צילום שלנו, לא תמונת מאגר.</figcaption>
        </figure>
      </section>

      {/* ── Packages for a real upcoming week ────────────── */}
      <Suspense fallback={<WeekPackagesSkeleton />}>
        <WeekPackages />
      </Suspense>

      {/* ── Real reviews from our guests on Airbnb ───────── */}
      <section className="max-w-[1240px] mx-auto px-5 md:px-6 py-14 md:py-20">
        <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight">מה אורחים כתבו עלינו</h2>
        <p className="text-[16px] md:text-[18px] text-[#51607A] mt-2 mb-7 md:mb-9">ביקורות אמיתיות מ-Airbnb על הדירות שלנו. אנחנו מארחים בואל טורנס כבר שלוש עונות.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {reviews.map(rv => (
            <blockquote key={rv.name} className="flex flex-col gap-3">
              <span className="text-[#E8A317] text-[18px] tracking-[2px]" aria-label="5 כוכבים">★★★★★</span>
              <p className="text-[17px] md:text-[18px] leading-[1.6] text-ink">&ldquo;{rv.text}&rdquo;</p>
              <footer className="text-[14px] text-[#51607A]"><b className="text-ink">{rv.name}</b>{rv.from ? `, ${rv.from}` : ""} · {rv.when}</footer>
            </blockquote>
          ))}
        </div>
        <p className="mt-8 text-[13px] text-[#51607A]">תרגום חופשי מאנגלית ומצרפתית. <a href={AIRBNB_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#1652F0]">לכל הביקורות ב-Airbnb ←</a></p>
      </section>

      {/* ── The resort ───────────────────────────────────── */}
      <section className="bg-[#F4F7FB]">
        <div className="max-w-[1240px] mx-auto px-5 md:px-6 py-16 md:py-24 flex flex-wrap gap-10 md:gap-14 items-center">
          <div className="flex-[1_1_480px] min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/balcony-vt.webp" alt="ואל טורנס מהמרפסת של אחת הדירות שלנו" loading="lazy" className="w-full h-[280px] md:h-[440px] object-cover rounded-[18px] block" />
          </div>
          <div className="flex-[1_1_420px] min-w-0 flex flex-col gap-4 md:gap-[18px]">
            <h2 className="font-display text-[28px] md:text-[40px] font-bold leading-tight tracking-tight">ואל טורנס, כפר הסקי הגבוה באירופה</h2>
            <p className="text-[16px] md:text-[18px] leading-[1.65] text-[#3D4B63]">
              כפר ב-2,300 מטר עם שלג טוב לאורך כל העונה, ויציאה ישר למסלולים של שלושת העמקים. מתאים למתחילים, למשפחות ולמי שבא לרוץ כל היום.
            </p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mt-1 border-t border-[#D9E1EC] pt-4">
              {resortFacts.map(f => (
                <div key={f.label}>
                  <dt className="text-[13px] md:text-[14px] text-[#51607A]">{f.label}</dt>
                  <dd className="font-bold text-[16px] md:text-[18px]">{f.value}</dd>
                </div>
              ))}
            </dl>
            <Link href="/guide/המדריך-המלא-לואל-טורנס" className="font-bold text-[16px] md:text-[17px] text-[#1652F0] hover:text-[#0E3FC2]">המדריך המלא לואל טורנס ←</Link>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 md:px-6 py-16 md:py-24">
        <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight mb-8 md:mb-9">מזמינים בארבעה צעדים</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-[22px]">
          {steps.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-2.5 md:gap-3 border-t-[3px] border-[#0B1B33] pt-5">
              <span className="font-display font-extrabold text-[30px] md:text-[34px] text-[#1652F0]">{i + 1}</span>
              <span className="font-bold text-[18px] md:text-[20px]">{s.title}</span>
              <span className="text-[15px] md:text-[16px] leading-relaxed text-[#51607A]">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Just write to us ─────────────────────────────── */}
      <section className="bg-[#0B1B33] text-white">
        <div className="max-w-[1240px] mx-auto px-5 md:px-6 py-16 md:py-[88px] flex flex-wrap gap-10 md:gap-14 items-center">
          <div className="flex-[1_1_480px] min-w-0 flex flex-col gap-4 md:gap-[18px]">
            <h2 className="font-display text-[30px] md:text-[42px] font-bold leading-tight">בא לכם פשוט לכתוב?</h2>
            <p className="text-[16px] md:text-[19px] leading-[1.65] text-[#D6DEEA]">
              תכתבו לעוזר שלנו &quot;אנחנו 4, סוף ינואר לשבוע&quot; ותקבלו הצעה מלאה עם דירה, סקי פס, הסעה וציוד. אותו עוזר עונה גם בוואטסאפ.
            </p>
            <div className="flex flex-wrap gap-3 mt-1">
              <OpenChatButton className="inline-flex items-center gap-2.5 bg-white text-[#0B1B33] rounded-[14px] px-6 min-h-[52px] font-bold text-[16px] md:text-[17px] hover:bg-[#EEF3FF] transition-colors">
                <IcoChat size={20} /> לפתוח צ&apos;אט
              </OpenChatButton>
              <a href={waHref} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 border border-white/45 text-white rounded-[14px] px-6 min-h-[52px] font-bold text-[16px] md:text-[17px] hover:bg-white/10 transition-colors">
                לכתוב בוואטסאפ
              </a>
            </div>
            <p className="text-[13px] md:text-[14px] text-[#AFBBD0]">העוזר הוא עוזר דיגיטלי (AI). אפשר לבקש לדבר עם בן אדם בכל שלב.</p>
          </div>
          <div aria-hidden="true" className="flex-[1_1_380px] min-w-0 bg-white rounded-[26px] p-5 md:p-[22px] flex flex-col gap-2.5 text-[#0B1B33]">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E3E9F2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/helper.jpg" alt="נציגת SkiShare" className="w-9 h-9 rounded-full object-cover" />
              <div>
                <div className="font-bold">SkiShare</div>
                <div className="text-[13px] text-[#51607A]">עוזר דיגיטלי · עונה תוך שניות</div>
              </div>
            </div>
            <div className="self-start bg-[#F1F3F7] rounded-[18px] px-3.5 py-2.5 text-[15px] md:text-[16px] max-w-[80%]">אנחנו 4, סוף ינואר לשבוע</div>
            <div className="self-end bg-[#1652F0] text-white rounded-[18px] px-3.5 py-2.5 text-[15px] md:text-[16px] max-w-[80%]">אהלן! יש לנו כמה דירות פנויות לשבוע הזה</div>
            <div className="self-end bg-[#1652F0] text-white rounded-[18px] px-3.5 py-2.5 text-[15px] md:text-[16px] max-w-[80%]">הכנתי לכם הצעה עם סקי פס, הסעה וציוד</div>
            <div className="self-end flex items-center gap-3 border border-[#CFDAF7] rounded-2xl px-3.5 py-3 max-w-[85%]">
              <span className="w-10 h-10 rounded-xl bg-[#FDECEC] text-[#B42318] flex items-center justify-center text-[12px] font-extrabold">PDF</span>
              <div>
                <div className="font-bold text-[15px]">הצעת המחיר שלכם</div>
                <div className="text-[13px] text-[#51607A]">כל הפרטים וקישורי תשלום</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The app (website only: hidden inside the app) ── */}
      <AppPromo />

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="max-w-[920px] mx-auto px-5 md:px-6 py-16 md:py-24">
        <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight mb-6 md:mb-7">שאלות נפוצות</h2>
        <div className="flex flex-col border-t border-[#E3E9F2]">
          {faq.map((f, i) => (
            <details key={f.q} open={i === 0} className="border-b border-[#E3E9F2] py-5 group">
              <summary className="font-bold text-[17px] md:text-[19px] cursor-pointer list-none flex items-center justify-between gap-4">
                {f.q}
                <span aria-hidden="true" className="text-[#51607A] text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[16px] md:text-[17px] leading-[1.65] text-[#3D4B63]">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-[15px] text-[#51607A]">
          עוד שאלות? <Link href="/terms" className="font-bold text-[#1652F0]">תקנון והזמנות</Link> · <Link href="/emergency-policy" className="font-bold text-[#1652F0]">מדיניות חירום</Link> · <a href={waHref} target="_blank" rel="noopener noreferrer" className="font-bold text-[#1652F0]">וואטסאפ</a>
        </p>
      </section>

      {/* ── SEASONAIRES ──────────────────────────────────── */}
      <section className="relative py-20 md:py-24 px-5 md:px-6 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/view.jpg" alt="הכפר ואל טורנס בשלג" loading="lazy" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "rgba(8,18,40,0.82)" }} />
        <div className="relative z-10 max-w-[1240px] mx-auto">
          <div className="max-w-2xl text-right">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-[13px] font-bold mb-5">אזור הסיזיונרים</span>
            <h2 className="font-display text-[32px] md:text-[44px] font-bold text-white leading-tight mb-4">עושים עונה שלמה על ההרים?</h2>
            <p className="text-white/80 text-[16px] md:text-[18px] leading-relaxed mb-7">
              הצטרפו לקהילת הסיזיונרים של SkiShare: דירות לטווח ארוך (חודשיים ומעלה), קבוצת וואטסאפ של הקהילה, סקי פס עונתי, עבודה על ההר ואירועים.
            </p>
            <Link href="/seasonaires" className="inline-flex items-center gap-2 bg-[#1652F0] hover:bg-[#0E3FC2] text-white font-bold px-7 min-h-[52px] rounded-[14px] text-[16px] transition-colors">
              לקהילת הסיזיונרים ←
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
