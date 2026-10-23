import Link from "next/link";
import type { SeasonRental } from "@/types";
import { createServerClient } from "@/lib/supabase-server";
import { wrap, card, btn, badgeLight, SectionHead, EmptyState } from "@/components/ui";
import { buildWaHref } from "@/lib/whatsapp";
import { breadcrumbLd, ldJson } from "@/lib/site";

// the board changes when rentals are added: read it on every visit
export const dynamic = "force-dynamic";

// Community WhatsApp group invite
const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/HBxs0bCitS4FYxSSKlSlsF?mode=ac_t";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string | null) => {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;
};

/* ── Icons (stroke, follow the text color) ─────────────────── */
const ico = (path: React.ReactNode, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const IcoBed = ({ size = 16 }: { size?: number }) => ico(<><path d="M3 18V6" /><path d="M3 14h18v4" /><path d="M21 14v-3a3 3 0 0 0-3-3h-7v6" /><circle cx="7" cy="11" r="2" /></>, size);
const IcoUsers = ({ size = 16 }: { size?: number }) => ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></>, size);
const IcoCal = ({ size = 16 }: { size?: number }) => ico(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>, size);
const IcoParty = ({ size = 26 }: { size?: number }) => ico(<><path d="M4 20l5-14 9 9z" /><path d="M14 4l1 2M19 6l-2 1M20 11l-2-.5M11 3.5V5" /></>, size);
const IcoBriefcase = ({ size = 26 }: { size?: number }) => ico(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></>, size);
const IcoCommunity = ({ size = 18 }: { size?: number }) => ico(<><circle cx="12" cy="7" r="3" /><circle cx="5" cy="10" r="2.2" /><circle cx="19" cy="10" r="2.2" /><path d="M7 20a5 5 0 0 1 10 0" /><path d="M2 19a3.5 3.5 0 0 1 5-3.2M22 19a3.5 3.5 0 0 0-5-3.2" /></>, size);
const IcoWhatsApp = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);

function RentalCard({ r }: { r: SeasonRental }) {
  const img = r.images?.[0] ?? "/apt1.jpg";
  return (
    <Link href={`/seasonaires/${r.id}`}
      className={`group ${card} overflow-hidden flex flex-col hover:border-line-strong transition-colors`}>
      {/* host photos come in every shape: the whole photo over a blurred copy of itself */}
      <div className="relative h-[210px] overflow-hidden bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={r.name} loading="lazy" className="absolute inset-0 w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-500" />
        <span className={`absolute top-3.5 right-3.5 ${badgeLight}`}>{r.min_months}+ חודשים</span>
      </div>
      <div className="p-5 flex flex-col gap-2.5 flex-1">
        <h3 className="font-display text-[21px] font-bold text-ink leading-snug">{r.name}</h3>
        <div className="text-[15px] text-muted"><bdi>{r.area}</bdi></div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-body">
          <span className="flex items-center gap-1.5"><IcoBed /> {r.beds} חד׳</span>
          <span className="flex items-center gap-1.5"><IcoUsers /> עד {r.sleeps}</span>
          {r.available_from && <span className="flex items-center gap-1.5"><IcoCal /> מ-{fmtDate(r.available_from)}</span>}
        </div>
        {r.amenities?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {r.amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="text-[13px] text-ink bg-soft border border-line px-2.5 py-0.5 rounded-full">{a}</span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-3.5 border-t border-line flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[28px] font-extrabold text-ink leading-none">€{r.price_per_month.toLocaleString()}</span>
            <span className="text-[15px] text-muted">לחודש</span>
          </div>
          <span className="text-[16px] font-bold text-accent group-hover:text-accent-hover">לפרטים ←</span>
        </div>
      </div>
    </Link>
  );
}

function ComingSoon({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="relative rounded-card border border-dashed border-line-strong bg-[#FBFCFE] p-6 md:p-8 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
      <span className="w-14 h-14 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <h3 className="font-display text-[20px] font-bold text-ink">{title}</h3>
          <span className="text-[13px] font-bold text-warn bg-warn-soft px-2.5 py-0.5 rounded-full">בקרוב</span>
        </div>
        <p className="text-[15px] md:text-[16px] text-body leading-relaxed max-w-[640px]">{desc}</p>
      </div>
    </div>
  );
}

/*
 * The seasonaires' area. The rentals board is read on the server, so the
 * page arrives with the list and a plain link to every rental (it used to
 * load in the browser, and search engines saw an empty board).
 */
export default async function SeasonairesPage() {
  const db = createServerClient();
  const { data } = await db.from("season_rentals").select("*")
    .eq("available", true).order("price_per_month", { ascending: true });
  const rentals = (data ?? []) as SeasonRental[];

  const waContact = buildWaHref({
    intro: "היי! 👋 אני מתעניין/ת בעונת סקי שלמה (סיזיונר) ב-Val Thorens.",
    lines: ["אשמח לקבל פרטים על דירות לטווח ארוך, סקי פס עונתי ואפשרויות עבודה."],
  });

  return (
    <div className="bg-white text-ink" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([["דף הבית", "/"], ["אזור הסיזיונרים", "/seasonaires"]])) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/view.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "rgba(8,18,38,0.55)" }} />
        <div className={`relative ${wrap} pt-14 pb-20 md:pt-20 md:pb-28 flex flex-col items-start gap-4 md:gap-5 text-white`}>
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[14px] md:text-[15px] font-medium"
            style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.32)" }}>
            <IcoCommunity /> קהילת הסיזיונרים
          </span>
          <h1 className="font-display font-extrabold text-[40px] leading-[1.08] md:text-[60px] md:leading-[1.05] tracking-tight">אזור הסיזיונרים</h1>
          <p className="text-[17px] md:text-[20px] leading-relaxed text-[#F1F5FB] max-w-[680px]">
            הבית של מי שעושה עונה שלמה ב-Val Thorens — קהילה, לוח דירות לטווח ארוך, אירועים, עבודות ומידע. הכל במקום אחד.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <a href="#board" className="inline-flex items-center justify-center min-h-[52px] px-6 rounded-[14px] bg-white text-ink font-bold text-[16px] hover:bg-accent-soft transition-colors">ללוח הדירות</a>
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[52px] px-6 rounded-[14px] border border-white/45 text-white font-bold text-[16px] hover:bg-white/10 transition-colors">
              <IcoWhatsApp size={20} /> לקבוצת הוואטסאפ
            </a>
          </div>
        </div>
      </section>

      {/* WhatsApp community banner */}
      <section className={`${wrap} -mt-10 md:-mt-12 relative z-10`}>
        <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer"
          className={`group ${card} shadow-card flex flex-col sm:flex-row sm:items-center gap-4 p-5 md:p-6 hover:border-line-strong transition-colors`}>
          <span className="w-14 h-14 rounded-2xl bg-ok-soft text-[#128C4B] flex items-center justify-center shrink-0"><IcoWhatsApp size={28} /></span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-[19px] md:text-[21px] text-ink leading-tight">הצטרפו לקבוצת הוואטסאפ של הסיזיונרים</p>
            <p className="text-[15px] text-muted mt-1">דירות, טיפים, אירועים ועבודות — כל הקהילה במקום אחד</p>
          </div>
          <span className={`${btn.primary} shrink-0 w-full sm:w-auto`}>הצטרפו ←</span>
        </a>
      </section>

      {/* Long-term apartments board */}
      <section id="board" className={`${wrap} pt-14 md:pt-20`}>
        <SectionHead title="דירות לטווח ארוך" sub="חודשיים ומעלה · מחיר חודשי · מתעדכן כל הזמן" />
        {rentals.length === 0 ? (
          <EmptyState
            title="אין כרגע דירות זמינות"
            text="דברו איתנו ונמצא לכם משהו."
            action={<a href={waContact} target="_blank" rel="noopener noreferrer" className={btn.primary}><IcoWhatsApp size={20} /> דברו איתנו</a>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {rentals.map(r => <RentalCard key={r.id} r={r} />)}
          </div>
        )}
      </section>

      {/* Events — coming soon */}
      <section id="events" className={`${wrap} pt-14 md:pt-20`}>
        <SectionHead title="אירועים קרובים" />
        <ComingSoon icon={<IcoParty />}
          title="אירועי קהילה בדרך"
          desc="מפגשי סיזיונרים, ערבי אפטר-סקי, טריפים וחוויות משותפות. הצטרפו לקבוצת הוואטסאפ כדי להיות הראשונים לדעת." />
      </section>

      {/* Jobs — coming soon */}
      <section id="jobs" className={`${wrap} pt-14 md:pt-20`}>
        <SectionHead title="חיפוש עבודות" />
        <ComingSoon icon={<IcoBriefcase />}
          title="לוח דרושים לסיזיונרים בדרך"
          desc="משרות באתר הסקי — מסעדות, בארים, חנויות ציוד, בתי מלון ועוד. עם דרכון אירופאי אפשר לעבוד ולממן את העונה. הלוח ייפתח בקרוב." />
      </section>

      {/* Final CTA */}
      <section className={`${wrap} py-14 md:py-20`}>
        <div className="bg-ink rounded-card px-6 py-10 md:px-12 md:py-14 text-white flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-[28px] md:text-[36px] font-bold leading-tight mb-3">רוצים להיות חלק מהקהילה?</h2>
            <p className="text-[16px] md:text-[18px] leading-relaxed text-[#D6DEEA] max-w-[560px]">הצטרפו לקבוצת הוואטסאפ של הסיזיונרים, או דברו איתנו ישירות על דירה, סקי פס ועבודה.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[52px] px-6 rounded-[14px] bg-white text-ink font-bold text-[16px] hover:bg-accent-soft transition-colors">
              <span className="text-[#128C4B]"><IcoWhatsApp size={20} /></span> הצטרפו לקבוצה
            </a>
            <a href={waContact} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-[52px] px-6 rounded-[14px] border border-white/45 text-white font-bold text-[16px] hover:bg-white/10 transition-colors">
              דברו איתנו
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
