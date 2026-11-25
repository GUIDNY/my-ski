import Link from "next/link";
import { Suspense } from "react";
import SearchWidget from "@/components/SearchWidget";
import OpenChatButton from "@/components/OpenChatButton";
import AppPromo from "@/components/home/AppPromo";
import Snow from "@/components/Snow";
import RevealOnScroll from "@/components/home/RevealOnScroll";
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
];

// "build your own trip": the apartment is the base, everything else is picked
const included = [
  { title: "הדירה", text: "דירות שלנו בואל טורנס, לחבורה או לזוג. ניקיון כלול במחיר.", badge: "הבסיס", link: { href: "/apartments", label: "לדירות" } },
  { title: "סקי פס", text: "ואל טורנס, או כל 600 הק\"מ של שלושת העמקים.", badge: "אם רוצים", link: { href: "/guide/מחיר-סקי-פס-ואל-טורנס", label: "מחירים" } },
  { title: "הסעה מהשדה", text: "שאטל ישיר עד הדירה, הלוך וחזור.", badge: "אם רוצים", link: { href: "/transfers", label: "הסעות" } },
  { title: "ציוד", text: "סקי או סנובורד לכל ימי הגלישה.", badge: "אם רוצים", link: null },
  { title: "טיסה ישירה", text: "רק כשיש ישירה מתל אביב בתאריכים שלכם, במחיר האמיתי.", badge: "כשיש", link: { href: "/guide/איך-מגיעים-לואל-טורנס-מישראל", label: "איך מגיעים" } },
];

// Real Google reviews of SkiShare ("סקי שר", 4.9 from 67), quoted from Google,
// shortened. Only real reviews go here, never made-up ones.
const GOOGLE_RATING = { stars: "4.9", count: 67 };
const GOOGLE_REVIEWS_URL = "https://www.google.com/search?q=%D7%A1%D7%A7%D7%99+%D7%A9%D7%A8+SkiShare+%D7%91%D7%99%D7%A7%D7%95%D7%A8%D7%95%D7%AA";
const reviews = [
  { name: "אורי פ.", text: "חברה מקצוענים. היינו שלושה שבועות בדירה בואל טורנס ופשוט נהנינו מכל רגע. מיקום במרכז העיירה, דקה הליכה מהמסלולים, הברים והמסעדות. ליווי מדהים, טיפלו בכל מה שהיינו צריכים. ממליץ בחום." },
  { name: "רון ג.", text: "סגרנו חופשה עם הצוות ופשוט חווינו חוויה מושלמת! השירות היה אישי ומדויק, הדירה נקייה ומדהימה. ממליץ בחום לכל מי שמחפש חופשת סקי מושלמת." },
  { name: "זכריה א.", text: "נסעתי לחופשת סקי דרך החברה הזאת ופשוט אין לי מילים. מהרגע שנחתנו הם דאגו להכול: חדרים הכי נוחים בעולם, הסעות, ציוד, שיעורים, אווירה. הכול באמת ברמה הכי גבוהה שיש." },
  { name: "איתי ג.", text: "אירוח יוצא דופן, מקום נהדר עם אווירה חמה ומחבקת, ממש כמו בבית. ממליץ ממליץ." },
];

const resortFacts = [
  { value: "2,300 מ'", label: "גובה הכפר" },
  { value: "600 ק\"מ", label: "מסלולים בשלושת העמקים" },
  { value: "נובמבר–מאי", label: "עונת הסקי" },
  { value: "ז'נבה · ליון · שאמברי", label: "שדות התעופה הקרובים" },
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
    <div className="bg-white text-ink overflow-x-clip" dir="rtl">
      <RevealOnScroll />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex items-center min-h-[560px] md:min-h-[620px]">
        {/* WebP (a third of the JPEG), a portrait crop on phones, fetched first: the largest paint */}
        {/* Val Thorens, photo by Joan Oger on Unsplash (Unsplash License, free to use) */}
        <picture>
          <source media="(max-width: 767px)" srcSet="/hero-vt-m.webp" type="image/webp" />
          <source srcSet="/hero-vt.webp" type="image/webp" />
          <img src="/hero-vt.jpg" alt="רכבל מעל המסלולים בואל טורנס ביום שמש" fetchPriority="high" className="hero-settle absolute inset-0 w-full h-full object-cover object-[center_45%]" />
        </picture>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,20,40,0.42) 0%, rgba(8,20,40,0.30) 45%, rgba(8,20,40,0.55) 100%)" }} />
        <Snow />
        <a href="https://unsplash.com/photos/CFntYTHRfRc" target="_blank" rel="noopener noreferrer" className="absolute bottom-2.5 left-4 z-10 text-[11px] text-white/60 hover:text-white/90">צילום: Joan Oger, Unsplash</a>
        <div className="relative z-10 w-full max-w-[1100px] mx-auto px-4 pt-12 pb-14 md:pt-16 md:pb-20 flex flex-col items-center gap-5 md:gap-6 text-center">
          <h1 className="font-display font-extrabold text-white text-[42px] leading-[1.08] md:text-[68px] md:leading-[1.05] tracking-tight" style={{ textWrap: "balance", textShadow: "0 2px 24px rgba(0,0,0,.35)" }}>
            חופשת סקי בואל טורנס
          </h1>
          <p className="animate-fade-up-delay-1 text-[17px] md:text-[23px] leading-relaxed text-[#F1F5FB] max-w-[720px]" style={{ textShadow: "0 1px 12px rgba(0,0,0,.35)" }}>
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
      <section aria-label="למה SkiShare" className="bg-[#F4F7FB]">
        <div className="max-w-[1240px] mx-auto px-5 md:px-6 py-5 md:py-6 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="border-r-2 border-[#E8A317] pr-3 hover:opacity-80">
            <div className="font-bold text-[15px] md:text-[17px]"><span className="text-[#E8A317]">★</span> {GOOGLE_RATING.stars} בגוגל</div>
            <div className="text-[13px] md:text-[15px] text-[#51607A]">{GOOGLE_RATING.count} ביקורות של לקוחות</div>
          </a>
          {trust.map(t => (
            <div key={t.title} className="border-r-2 border-[#1652F0] pr-3">
              <div className="font-bold text-[15px] md:text-[17px]">{t.title}</div>
              <div className="text-[13px] md:text-[15px] text-[#51607A]">{t.text}</div>
            </div>
          ))}
        </div>
      </section>

      <Link href="/emergency-policy" className="block border-b border-[#E3E9F2] bg-[#F4F7FB] hover:bg-[#EDF2F8] transition-colors">
        <div className="max-w-[1240px] mx-auto px-5 md:px-6 py-3 flex items-center gap-3 text-[14px] md:text-[15px] text-[#3D4B63]">
          <span className="text-[#1652F0] shrink-0"><IcoShield /></span>
          <span className="flex-1">מה קורה במקרה של סגירת שמיים או ביטולי טיסות? כתבנו בדיוק מה מגיע לכם.</span>
          <span className="font-bold text-[#1652F0] shrink-0">למדיניות ←</span>
        </div>
      </Link>

      {/* ── Packages for a real upcoming week ────────────── */}
      <Suspense fallback={<WeekPackagesSkeleton />}>
        <WeekPackages />
      </Suspense>

      {/* ── Who we are: the two owners, on the mountain ─── */}
      <section className="max-w-[1240px] mx-auto px-5 md:px-6 py-10 md:py-14 flex flex-wrap gap-8 md:gap-14 items-center">
        <figure className="flex-[1_1_520px] min-w-0 photo-zoom rounded-[18px]" data-reveal>
          <picture>
            <source srcSet="/team-vt.webp" type="image/webp" />
            <img src="/team-vt.jpg" alt="שני הבעלים של SkiShare ברכבל בואל טורנס, עם מעילי SkiShare" loading="lazy" className="w-full h-[300px] md:h-[440px] object-cover block" />
          </picture>
        </figure>
        <div className="flex-[1_1_380px] min-w-0 flex flex-col gap-4" data-reveal data-reveal-delay="1">
          <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight leading-tight">נעים להכיר, אנחנו SkiShare</h2>
          <p className="text-[16px] md:text-[18px] leading-[1.7] text-[#3D4B63]">
            את SkiShare הקמנו לפני ארבע שנים כדי לגרום לכם לחייך על ההר, ומאז זו המטרה שלנו. אנחנו משתדלים להביא לכם את הדירות הכי טובות, נוחות ומשתלמות, ולארגן לכם את כל החופשה מקצה לקצה.
          </p>
          <p className="text-[16px] md:text-[18px] leading-[1.7] text-[#3D4B63]">כל מה שתצטרכו לעשות זה להגיע, לחייך ולגלוש. מחכים לכם!</p>
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="self-start inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5A] text-[#06301A] rounded-[14px] px-6 min-h-[52px] font-bold text-[16px] md:text-[17px] transition-colors mt-1">
            לכתוב לנו ישירות בוואטסאפ
          </a>
        </div>
      </section>

      {/* ── What's included: a real apartment, and a plain list ── */}
      <section className="max-w-[1240px] mx-auto px-5 md:px-6 py-10 md:py-14 flex flex-wrap gap-8 md:gap-14 items-center">
        <div className="flex-[1_1_440px] min-w-0" data-reveal>
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
        <figure className="flex-[1_1_340px] min-w-0 max-w-[460px] mx-auto" data-reveal data-reveal-delay="1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="photo-zoom rounded-[18px]"><img src="/apt-living.webp" alt="הסלון באחת הדירות שלנו בואל טורנס, עם נוף להרים" loading="lazy" className="w-full h-[380px] md:h-[520px] object-cover block" /></div>
          <figcaption className="text-[13px] text-[#51607A] mt-2">נבס 163, אחת הדירות שלנו. צילום שלנו, לא תמונת מאגר.</figcaption>
        </figure>
      </section>

      {/* ── Real Google reviews ──────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 md:px-6 py-10 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 mb-7 md:mb-9" data-reveal>
          <div>
            <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight">מה כתבו עלינו בגוגל</h2>
            <p className="text-[16px] md:text-[18px] text-[#51607A] mt-2">ביקורות אמיתיות של לקוחות שנסעו איתנו.</p>
          </div>
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80">
            <span className="font-display font-extrabold text-[40px] md:text-[48px] leading-none">{GOOGLE_RATING.stars}</span>
            <span className="flex flex-col">
              <span className="text-[#E8A317] text-[18px] tracking-[2px]" aria-label="5 כוכבים">★★★★★</span>
              <span className="text-[14px] text-[#51607A]">{GOOGLE_RATING.count} ביקורות בגוגל</span>
            </span>
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {reviews.map((rv, i) => (
            <blockquote key={rv.name} data-reveal data-reveal-delay={String(i)} className="flex flex-col gap-3 border-t-2 border-[#0B1B33] pt-4 transition-transform duration-300 hover:-translate-y-1">
              <span className="text-[#E8A317] text-[16px] tracking-[2px]" aria-label="5 כוכבים">★★★★★</span>
              <p className="text-[16px] md:text-[17px] leading-[1.6] text-ink">&quot;{rv.text}&quot;</p>
              <footer className="text-[14px] text-[#51607A] mt-auto"><b className="text-ink">{rv.name}</b> · ביקורת בגוגל</footer>
            </blockquote>
          ))}
        </div>
        <p className="mt-8 text-[14px]"><a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#1652F0]">לכל הביקורות בגוגל ←</a></p>
      </section>

      {/* ── The resort ───────────────────────────────────── */}
      <section className="bg-[#F4F7FB]">
        <div className="max-w-[1240px] mx-auto px-5 md:px-6 py-12 md:py-16 flex flex-wrap gap-10 md:gap-14 items-center">
          <div className="flex-[1_1_480px] min-w-0 photo-zoom rounded-[18px]" data-reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/balcony-vt.webp" alt="המסלולים של ואל טורנס מהמרפסת של אחת הדירות שלנו" loading="lazy" className="w-full h-[280px] md:h-[440px] object-cover block" />
          </div>
          <div className="flex-[1_1_420px] min-w-0 flex flex-col gap-4 md:gap-[18px]" data-reveal data-reveal-delay="1">
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

      {/* ── Talk to us ───────────────────────────────────── */}
      <section className="bg-[#0B1B33] text-white">
        <div className="max-w-[1240px] mx-auto px-5 md:px-6 py-10 md:py-14 flex flex-wrap gap-6 md:gap-10 items-center justify-between" data-reveal>
          <div className="flex-[1_1_520px] min-w-0 flex flex-col gap-3">
            <h2 className="font-display text-[28px] md:text-[38px] font-bold leading-tight">לא בטוחים מה מתאים לכם? תכתבו לנו</h2>
            <p className="text-[16px] md:text-[18px] leading-[1.6] text-[#D6DEEA]">
              מספיק &quot;אנחנו 4, סוף ינואר לשבוע&quot;, ותקבלו בוואטסאפ הצעה מלאה עם דירה, סקי פס, הסעה וציוד. אנחנו בואל טורנס כל העונה, וזמינים גם באמצע החופשה.
            </p>
            <p className="text-[13px] text-[#AFBBD0]">את התשובה הראשונה נותן עוזר דיגיטלי (AI). אפשר לבקש לדבר עם בן אדם בכל שלב.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={waHref} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1EBE5A] text-[#06301A] rounded-[14px] px-7 min-h-[56px] font-bold text-[17px] md:text-[18px] transition-colors">
              לכתוב לנו בוואטסאפ
            </a>
            <OpenChatButton className="inline-flex items-center gap-2.5 border border-white/40 text-white rounded-[14px] px-6 min-h-[56px] font-bold text-[16px] hover:bg-white/10 transition-colors">
              <IcoChat size={20} /> צ&apos;אט באתר
            </OpenChatButton>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="max-w-[920px] mx-auto px-5 md:px-6 py-12 md:py-16">
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
      <section className="relative py-14 md:py-16 px-5 md:px-6 overflow-hidden">
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
      {/* ── The app (website only: hidden inside the app) ── */}
      <AppPromo />

      
    </div>
  );
}
