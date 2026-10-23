"use client";
import { useState } from "react";
import Link from "next/link";
import type { SeasonRental } from "@/types";
import { wrap, card, btn, h1, h2, Crumbs, Check, EmptyState } from "@/components/ui";
import { buildWaHref } from "@/lib/whatsapp";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s + "T12:00:00");
  return `${d.getDate()} ${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/* ── Icons (stroke, follow the text color) ─────────────────── */
const ico = (path: React.ReactNode, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const IcoChevron = ({ dir }: { dir: "prev" | "next" }) => ico(dir === "next" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />, 20);
const IcoWhatsApp = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);

/* the rental page; the rental itself is read on the server (page.tsx) */
export default function RentalClient({ rental }: { rental: SeasonRental | null }) {
  const r = rental;
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [showDesc, setShowDesc] = useState(false);

  if (!r) return (
    <div className={`${wrap} py-14 md:py-20`} dir="rtl">
      <EmptyState
        title="הדירה לא נמצאה"
        text="ייתכן שהיא כבר הושכרה או שהקישור השתנה."
        action={<Link href="/seasonaires" className={btn.primary}>חזרה לאזור הסיזיונרים</Link>}
      />
    </div>
  );

  const imgs = r.images?.length ? r.images : ["/apt1.jpg", "/apt2.jpg", "/apt3.jpg"];

  const MONTHS: [string, string][] = [["nov","נובמבר"],["dec","דצמבר"],["jan","ינואר"],["feb","פברואר"],["mar","מרץ"],["apr","אפריל"],["may","מאי"]];
  const mp = r.monthly_prices || {};
  const availMonths = MONTHS.filter(([k]) => Number(mp[k]) > 0);
  const monthLabel = (k: string) => MONTHS.find(m => m[0] === k)?.[1] || k;
  const total = selected.reduce((s, k) => s + (Number(mp[k]) || 0), 0);
  const toggleMonth = (k: string) => setSelected(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const displayPrice = total > 0 ? total : r.price_per_month;

  const waHref = buildWaHref({
    intro: "היי! 👋 אני מעוניין/ת בדירה לעונה הבאה:",
    lines: [
      `🏔️ ${r.name} · ${r.area}`,
      `🛏️ ${r.beds} חדרים · עד ${r.sleeps} אנשים`,
      selected.length
        ? `📅 חודשים: ${selected.map(monthLabel).join(", ")} (${selected.length} חודשים)`
        : `📅 זמינה: ${fmtDate(r.available_from)} — ${fmtDate(r.available_to)}`,
      `⏳ מינימום ${r.min_months} חודשים`,
      total > 0 ? `💶 סה״כ: €${total.toLocaleString()}` : `💶 €${r.price_per_month.toLocaleString()} / חודש`,
    ],
  });
  const ctaLabel = selected.length ? "לשלוח את הפרטים בוואטסאפ" : "ליצירת קשר להזמנה";

  const facts = [
    { value: `${r.beds}`, label: "חדרים" },
    { value: `עד ${r.sleeps}`, label: "אנשים" },
    { value: `${r.min_months}`, label: "חודשים לפחות" },
    { value: fmtDate(r.available_from).replace(/ \d{4}$/, ""), label: "זמינה מ-" },
  ];

  return (
    <div className="bg-white text-ink" dir="rtl">
      <div className={`${wrap} pt-6 md:pt-8`}>
        <Crumbs items={[{ label: "דף הבית", href: "/" }, { label: "סיזיונרים", href: "/seasonaires" }, { label: r.name }]} />
        <div className="flex flex-wrap items-end justify-between gap-4 mt-3 md:mt-4">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className={h1}>{r.name}</h1>
            <span className="text-[16px] md:text-[17px] text-muted"><bdi>{r.area}</bdi> · {r.beds} חדרים · עד {r.sleeps} אנשים · מינימום {r.min_months} חודשים</span>
          </div>
        </div>

        {/* Gallery: host photos come in every aspect ratio, so each slide shows the
            whole photo over a blurred copy of itself instead of cropping it. */}
        <section aria-label="תמונות" className="relative mt-5 md:mt-6 w-full h-[280px] md:h-[460px] rounded-card bg-ink overflow-hidden">
          {imgs.map((src, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0"}`} aria-hidden={i !== idx}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${r.name}, תמונה ${i + 1}`} className="absolute inset-0 w-full h-full object-contain" />
            </div>
          ))}
          {imgs.length > 1 && (
            <>
              <button type="button" onClick={() => setIdx(i => (i - 1 + imgs.length) % imgs.length)} aria-label="התמונה הקודמת"
                className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-ink flex items-center justify-center shadow-pop transition-colors">
                <IcoChevron dir="prev" />
              </button>
              <button type="button" onClick={() => setIdx(i => (i + 1) % imgs.length)} aria-label="התמונה הבאה"
                className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-ink flex items-center justify-center shadow-pop transition-colors">
                <IcoChevron dir="next" />
              </button>
              <div className="absolute bottom-3.5 inset-x-0 flex items-center justify-center gap-1.5">
                {imgs.map((_, i) => (
                  <button key={i} type="button" onClick={() => setIdx(i)} aria-label={`תמונה ${i + 1}`} aria-current={i === idx}
                    className="p-1.5">
                    <span className={`block h-2 rounded-full transition-all ${i === idx ? "bg-white w-7" : "bg-white/60 w-2"}`} />
                  </button>
                ))}
              </div>
              <span className="absolute top-3.5 left-3.5 bg-ink/70 text-white text-[13px] font-bold rounded-full px-3 py-1" aria-hidden="true">{idx + 1}/{imgs.length}</span>
            </>
          )}
        </section>
      </div>

      <div className={`${wrap} pt-8 md:pt-10 pb-12 md:pb-20 flex flex-col lg:flex-row gap-8 lg:gap-9 items-start`}>
        {/* Main */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-9">
          <section className="flex flex-col gap-4">
            <h2 className={h2}>הדירה</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {facts.map(f => (
                <div key={f.label} className="border border-line rounded-2xl p-3.5 md:p-4">
                  <div className="font-display font-bold text-[18px] md:text-[20px] text-ink">{f.value}</div>
                  <div className="text-[14px] text-muted">{f.label}</div>
                </div>
              ))}
            </div>
            {r.description && (
              <div>
                <p className={`text-[16px] md:text-[17px] leading-[1.75] text-body whitespace-pre-line ${showDesc ? "" : "line-clamp-5"}`}>{r.description}</p>
                {r.description.length > 200 && (
                  <button type="button" onClick={() => setShowDesc(v => !v)} className={`${btn.link} mt-2 min-h-[44px]`}>
                    {showDesc ? "להציג פחות ↑" : "להמשך הקריאה ←"}
                  </button>
                )}
              </div>
            )}
          </section>

          {r.amenities?.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className={h2}>מה כלול</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2.5 text-[16px] text-ink">
                {r.amenities.map((a, i) => <li key={i} className="flex items-start gap-2"><Check className="mt-[4px]" />{a}</li>)}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <h2 className={h2}>תקופת זמינות</h2>
            <div className="border border-line rounded-2xl p-4 md:p-5 flex flex-col gap-1">
              <p className="text-[17px] font-bold text-ink">{fmtDate(r.available_from)} — {fmtDate(r.available_to)}</p>
              <p className="text-[15px] text-muted">סקי פס עונתי זמין בנפרד · €1,070 לכל העונה</p>
            </div>
          </section>

          {availMonths.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="months-title">
              <div>
                <h2 id="months-title" className={h2}>בחרו חודשים</h2>
                <p className="text-[15px] text-muted mt-1">מינימום {r.min_months} חודשים · מחיר משתנה לפי החודש</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availMonths.map(([k, label]) => {
                  const on = selected.includes(k);
                  return (
                    <button key={k} type="button" onClick={() => toggleMonth(k)} aria-pressed={on}
                      className={`flex flex-col items-start gap-1 p-4 rounded-[18px] border text-right transition-colors min-h-[72px]
                        ${on ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line bg-white hover:border-line-strong"}`}>
                      <span className="text-[16px] font-bold text-ink">{label}</span>
                      <span className={`text-[16px] font-bold ${on ? "text-accent" : "text-body"}`}>€{Number(mp[k]).toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>
              {selected.length > 0 && (
                <div className="flex items-center justify-between border-t border-line pt-3">
                  <span className="text-[16px] font-bold text-ink">{selected.length} חודשים</span>
                  <span className="font-display text-[24px] font-extrabold text-ink">€{total.toLocaleString()}</span>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Summary (desktop) */}
        <aside aria-label="מחיר והזמנה" className="hidden lg:block w-[380px] shrink-0 sticky top-[96px]">
          <div className={`${card} shadow-card p-6 flex flex-col gap-4`}>
            <span className="text-[15px] text-muted">{selected.length ? `${selected.length} חודשים נבחרו` : "מחיר חודשי"}</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[42px] font-extrabold leading-none text-ink">€{displayPrice.toLocaleString()}</span>
              <span className="text-[16px] text-muted">{selected.length ? "סה״כ" : "לחודש"}</span>
            </div>
            <span className="text-[14px] text-muted">מינימום {r.min_months} חודשים</span>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${btn.primaryLg} w-full`}>
              <IcoWhatsApp /> {ctaLabel}
            </a>
            <p className="text-center text-[14px] text-muted">נציג ישראלי יחזור אליכם בוואטסאפ</p>
          </div>
        </aside>
      </div>

      {/* Phone: price and button always at hand (stops above the footer) */}
      <div className="lg:hidden sticky bottom-0 z-40 bg-white border-t border-line px-4 pt-3 flex items-center gap-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))", boxShadow: "0 -8px 24px rgba(11,27,51,0.08)" }}>
        <div className="shrink-0 flex flex-col">
          <span className="text-[12px] text-muted leading-tight">{selected.length ? `${selected.length} חודשים` : "לחודש"}</span>
          <span className="font-display font-extrabold text-[22px] leading-none text-ink">€{displayPrice.toLocaleString()}</span>
        </div>
        <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${btn.primary} flex-1`}>
          <IcoWhatsApp size={18} /> {selected.length ? "לשלוח פרטים" : "ליצירת קשר"}
        </a>
      </div>
    </div>
  );
}
