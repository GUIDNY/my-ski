import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import SearchWidget from "@/components/SearchWidget";
import OpenChatButton from "@/components/OpenChatButton";
import WeekPackages, { WeekPackagesSkeleton } from "@/components/home/WeekPackages";
import { helperWaHref } from "@/lib/helper-whatsapp";

export const metadata: Metadata = {
  title: "SkiShare — דירות בואל טורנס, סקי פס והסעות",
  description: "מחפשים דירה בואל טורנס? SkiShare מציעים דירות איכותיות בואל טורנס, סקי פס לשלושת העמקים, הסעות משדה התעופה וציוד סקי — הכל במקום אחד, בעברית ובתשלום מאובטח.",
  alternates: { canonical: "https://skisharebook.com/" },
};

// The packages section prices live inventory (which apartments are free for
// the week, today's Airbnb prices) — never pre-render it at build time.
export const dynamic = "force-dynamic";

/* ── Icons (stroke, follow the text color) ─────────────────── */
const ico = (path: React.ReactNode, size = 22) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const IcoHome = () => ico(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>);
const IcoTag = () => ico(<><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>);
const IcoChat = ({ size = 22 }: { size?: number }) => ico(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />, size);
const IcoSplit = () => ico(<><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M2 20a6 6 0 0 1 12 0" /><path d="M10 20a6 6 0 0 1 12 0" /></>);
const IcoBed = () => ico(<><path d="M3 18V6" /><path d="M3 14h18v4" /><path d="M21 14v-3a3 3 0 0 0-3-3h-7v6" /><circle cx="7" cy="11" r="2" /></>, 26);
const IcoTicket = () => ico(<><path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2z" /><path d="M12 7v2M12 11v2M12 15v2" /></>, 26);
const IcoVan = () => ico(<><rect x="3" y="6" width="18" height="10" rx="2" /><path d="M3 11h18" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="16.5" cy="18" r="1.5" /></>, 26);
const IcoSkis = () => ico(<><path d="M7 3l5 18" /><path d="M17 3l-5 18" /><path d="M4 19h5" /><path d="M15 19h5" /></>, 26);
const IcoPlane = () => ico(<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />, 26);
const IcoShield = () => ico(<><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></>, 20);

/* ── Content ───────────────────────────────────────────────── */
const trust = [
  { icon: <IcoHome />, title: "הדירות שלנו", text: "בואל טורנס, בלי מתווך באמצע" },
  { icon: <IcoTag />, title: "מחיר אחד לכל החבילה", text: "לינה, סקי פס, הסעה וציוד" },
  { icon: <IcoChat />, title: "עונים בעברית", text: "בוואטסאפ ובצ'אט באתר" },
  { icon: <IcoSplit />, title: "כל אחד משלם את החלק שלו", text: "קישור תשלום נפרד לכל אחד מהחבורה" },
];

const included = [
  { icon: <IcoBed />, title: "דירה לכל השבוע", text: "דירות שלנו בואל טורנס, ניקיון כבר בפנים", optional: false },
  { icon: <IcoTicket />, title: "סקי פס", text: "ואל טורנס, או כל 600 הק\"מ של שלושת העמקים", optional: false },
  { icon: <IcoVan />, title: "הסעה מהשדה", text: "שאטל ישיר עד הדירה, הלוך וחזור", optional: false },
  { icon: <IcoSkis />, title: "ציוד סקי", text: "סקי או סנובורד לכל ימי הגלישה", optional: false },
  { icon: <IcoPlane />, title: "טיסה ישירה", text: "מתל אביב, ואנחנו מחפשים לכם את הכי מתאימה", optional: true },
];

const resortFacts = [
  { value: "2,300 מ'", label: "גובה הכפר" },
  { value: "600 ק\"מ", label: "מסלולים בשלושת העמקים" },
  { value: "נובמבר–מאי", label: "עונת הסקי" },
  { value: "ז'נבה · ליון · שאמברי", label: "שדות התעופה הקרובים", small: true },
];

const steps = [
  { title: "בוחרים תאריכים וכמה אתם", text: "גם \"סוף ינואר לשבוע\" זה מספיק כדי להתחיל." },
  { title: "מקבלים הצעה מלאה", text: "PDF עם כל הפרטים, המחיר לאדם וקישורי תשלום." },
  { title: "כל אחד משלם את החלק שלו", text: "אין צורך שמישהו אחד ישים את כל הסכום." },
  { title: "נוסעים", text: "ואם צריך משהו באמצע, כותבים לנו בוואטסאפ." },
];

const faq = [
  { q: "מה כלול במחיר?", a: "הדירה לכל השבוע כולל ניקיון, סקי פס, הסעה הלוך וחזור מהשדה וציוד סקי. טיסה אפשר להוסיף." },
  { q: "אפשר שכל אחד ישלם בנפרד?", a: "כן. כל אחד מהחבורה מקבל קישור ומשלם את החלק שלו." },
  { q: "ומה אם צריך לבטל?", a: "יש אפשרות לביטול גמיש, ומדיניות מסודרת למצבי חירום כמו סגירת שמיים או ביטולי טיסות. כל הפרטים בעמודי המדיניות." },
  { q: "איך מגיעים מהשדה לדירה?", a: "שאטל ישיר משדה התעופה עד הדירה, הלוך וחזור. רק צריך לשלוח לנו את פרטי הטיסה." },
];

/* ── Page ─────────────────────────────────────────────────── */
export default function Home() {
  const waHref = helperWaHref();
  return (
    <div className="bg-white text-ink" dir="rtl">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative flex items-center min-h-[560px] md:min-h-[620px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-ski.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "rgba(8,18,38,0.46)" }} />
        <div className="relative z-10 w-full max-w-[1100px] mx-auto px-4 pt-12 pb-14 md:pt-16 md:pb-20 flex flex-col items-center gap-5 md:gap-6 text-center">
          <span className="rounded-full px-4 py-1.5 text-[14px] md:text-[15px] font-medium text-white"
            style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.32)" }}>
            עונת 2026/27 פתוחה להזמנות
          </span>
          <h1 className="font-display font-extrabold text-white text-[42px] leading-[1.08] md:text-[68px] md:leading-[1.05] tracking-tight" style={{ textWrap: "balance" }}>
            חופשת סקי בואל טורנס
          </h1>
          <p className="text-[17px] md:text-[23px] leading-relaxed text-[#F1F5FB] max-w-[720px]">
            דירה, סקי פס, הסעה וציוד. הכל בחבילה אחת, במחיר אחד.
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
        <div className="max-w-[1240px] mx-auto px-5 md:px-6 py-6 md:py-8 grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {trust.map(t => (
            <div key={t.title} className="flex gap-3.5 items-start">
              <span className="shrink-0 w-11 h-11 rounded-xl bg-white border border-[#E3E9F2] flex items-center justify-center text-[#1652F0]">{t.icon}</span>
              <div>
                <div className="font-bold text-[15px] md:text-[17px]">{t.title}</div>
                <div className="text-[13px] md:text-[15px] text-[#51607A] mt-0.5">{t.text}</div>
              </div>
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

      {/* ── What's included ──────────────────────────────── */}
      <section className="max-w-[1240px] mx-auto px-5 md:px-6 pt-16 md:pt-24 pb-4 md:pb-8">
        <div className="flex flex-col gap-2 mb-7 md:mb-9">
          <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight">מה כלול בחבילה</h2>
          <p className="text-[16px] md:text-[18px] text-[#51607A]">בוחרים פעם אחת ומקבלים הכל מסודר, כולל קישורי תשלום.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 md:gap-[18px]">
          {included.map(i => (
            <div key={i.title} className={`rounded-[20px] p-5 md:p-6 flex flex-col gap-3 ${i.optional ? "border border-dashed border-[#CBD5E3] bg-[#FBFCFE]" : "border border-[#E3E9F2]"}`}>
              <span className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center ${i.optional ? "bg-[#FFF1E8] text-[#C2410C]" : "bg-[#EEF3FF] text-[#1652F0]"}`}>{i.icon}</span>
              <div className="font-bold text-[17px] md:text-[19px]">{i.title}</div>
              <div className="text-[14px] md:text-[15px] leading-relaxed text-[#51607A]">{i.text}</div>
              <span className={`self-start rounded-full px-3 py-1 text-[13px] font-bold ${i.optional ? "bg-[#FFF1E8] text-[#B33A06]" : "bg-[#E7F6EE] text-[#0F6B45]"}`}>
                {i.optional ? "לבחירה" : "כלול"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Packages for a real upcoming week ────────────── */}
      <Suspense fallback={<WeekPackagesSkeleton />}>
        <WeekPackages />
      </Suspense>

      {/* ── The resort ───────────────────────────────────── */}
      <section className="bg-[#F4F7FB]">
        <div className="max-w-[1240px] mx-auto px-5 md:px-6 py-16 md:py-24 flex flex-wrap gap-10 md:gap-14 items-center">
          <div className="flex-[1_1_480px] min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/view.jpg" alt="הכפר ואל טורנס בשלג מול ההרים" loading="lazy" className="w-full h-[280px] md:h-[440px] object-cover rounded-[26px] block" />
          </div>
          <div className="flex-[1_1_420px] min-w-0 flex flex-col gap-4 md:gap-[18px]">
            <span className="text-[15px] font-bold text-[#1652F0]">היעד</span>
            <h2 className="font-display text-[28px] md:text-[40px] font-bold leading-tight tracking-tight">ואל טורנס, כפר הסקי הגבוה באירופה</h2>
            <p className="text-[16px] md:text-[18px] leading-[1.65] text-[#3D4B63]">
              כפר ב-2,300 מטר עם שלג טוב לאורך כל העונה, ויציאה ישר למסלולים של שלושת העמקים. מתאים למתחילים, למשפחות ולמי שבא לרוץ כל היום.
            </p>
            <div className="grid grid-cols-2 gap-3 md:gap-3.5 mt-1">
              {resortFacts.map(f => (
                <div key={f.label} className="bg-white border border-[#E3E9F2] rounded-[18px] p-4 md:p-[18px]">
                  <div className={`font-display font-extrabold ${f.small ? "text-[18px] md:text-[22px] leading-snug" : "text-[24px] md:text-[28px]"}`}>{f.value}</div>
                  <div className="text-[14px] md:text-[15px] text-[#51607A]">{f.label}</div>
                </div>
              ))}
            </div>
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
              <img src="/helper.jpg" alt="" className="w-9 h-9 rounded-full object-cover" />
              <div>
                <div className="font-bold">SkiShare</div>
                <div className="text-[13px] text-[#51607A]">עוזר דיגיטלי · עונה בעברית</div>
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
        <img src="/view.jpg" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover object-center" />
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
