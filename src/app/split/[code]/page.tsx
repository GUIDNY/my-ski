"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CardPaymentButton from "@/components/CardPaymentButton";
import { IconWhatsApp, IconCheck, IconCalendar, IconUsers } from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";
import { btn, card, chip, wrap, EmptyState, Skeleton } from "@/components/ui";
import { IcoSplit, IcoLock, TrustList, MobileBar } from "@/components/checkout/Checkout";

const HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmt = (s?: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE[d.getMonth()]} ${d.getFullYear()}`; };

type GroupData = {
  group: { id: string; code: string; apartment_id: string; extra_apartment_id: string | null; apartment_name: string; area: string; checkin: string; checkout: string; guests: number; accommodation_total: number; shares_total: number };
  share_price: number; shares_total: number; shares_paid: number; accommodation_paid: number;
  payers: { name: string; ski_pass: boolean; transfer: boolean }[];
};

export default function SplitPage() {
  const { code } = useParams<{ code: string }>();
  const [d, setD] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => fetch(`/api/groups?code=${code}`).then(r => r.ok ? r.json() : null).then(setD).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [code]);

  if (loading) return (
    <div className={`${wrap} max-w-[1000px] py-10 flex flex-col gap-5`} aria-busy="true" aria-label="טוען">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
  if (!d) return (
    <div className={`${wrap} max-w-[720px] py-12 md:py-16`}>
      <EmptyState title="הקבוצה לא נמצאה"
        text="ייתכן שהקישור לא מלא או שהוא כבר לא בתוקף. בקשו ממי ששלח לכם את הקישור לשלוח אותו שוב, או כתבו לנו."
        action={<>
          <a href={buildWaHref({ intro: "היי, לא מצאתי את הקבוצה לתשלום מפוצל", lines: [`קוד קבוצה: ${code}`] })} target="_blank" rel="noopener noreferrer" className={btn.primary}>
            <IconWhatsApp size={18} /> כתבו לנו בוואטסאפ
          </a>
          <Link href="/" className={btn.outline}>לדף הבית</Link>
        </>} />
    </div>
  );

  const { group } = d;
  const nights = group.checkin && group.checkout ? Math.round((+new Date(group.checkout) - +new Date(group.checkin)) / 86400000) : 0;
  const pct = Math.min(100, Math.round((d.shares_paid / d.shares_total) * 100));
  const remaining = Math.max(0, d.shares_total - d.shares_paid);
  const myShare = d.share_price;
  const full = remaining <= 0;

  const wa = buildWaHref({ intro: `היי! לגבי תשלום מפוצל לדירה ${group.apartment_name} 🎿`, lines: [`קוד קבוצה: ${group.code}`] });

  const payButton = (cls: string, label: string) => (
    <CardPaymentButton
      apartmentId={group.apartment_id} apartment={group.apartment_name}
      extraApartmentId={group.extra_apartment_id ?? undefined}
      checkin={group.checkin} checkout={group.checkout} guests={group.guests} nights={nights}
      cancel="regular" service="human" grandTotal={myShare}
      split={{ sharesTotal: d.shares_total, accommodationTotal: group.accommodation_total, shareAmount: d.share_price, groupId: group.id }}
      className={cls} label={label} />
  );

  return (
    <div className="flex-1 bg-white">
      <div className={`${wrap} max-w-[1000px] pt-7 md:pt-10 pb-10 md:pb-16`}>
        {/* title */}
        <div className="flex flex-col items-start gap-3 mb-6 md:mb-8">
          <span className="inline-flex items-center gap-2 bg-accent-soft text-accent rounded-full px-3.5 py-1.5 text-[14px] font-bold">
            <IcoSplit size={18} /> תשלום מפוצל בין חברים
          </span>
          <h1 className="font-display font-extrabold text-[32px] leading-[1.1] md:text-[44px] tracking-tight text-ink">{group.apartment_name}</h1>
          <div className="flex flex-wrap gap-2">
            <span className={chip}><IconCalendar size={16} className="text-accent" /> {fmt(group.checkin)} עד {fmt(group.checkout)} · {nights} לילות</span>
            <span className={chip}><IconUsers size={16} className="text-accent" /> {group.guests} אנשים · {group.area}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-5 md:gap-7 items-start">
          {/* your share (first on the phone) */}
          <aside aria-label="החלק שלך" className="md:order-2 md:sticky md:top-[96px]">
            {full ? (
              <div className="rounded-card border border-[#BFE3CF] bg-ok-soft p-6 md:p-7 flex flex-col items-center text-center gap-3">
                <span className="w-14 h-14 rounded-full bg-white text-ok flex items-center justify-center"><IconCheck size={28} /></span>
                <p className="font-display font-bold text-[21px] text-ok-text">כולם שילמו, ההזמנה הושלמה</p>
              </div>
            ) : (
              <div className={`${card} p-5 md:p-6 flex flex-col gap-4`} style={{ boxShadow: "0 16px 40px rgba(11,27,51,0.08)" }}>
                <h2 className="font-bold text-[18px] text-ink">החלק שלך</h2>
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-[40px] leading-none text-ink">€{myShare.toLocaleString()}</span>
                    <span className="text-[16px] text-muted">לתשלום עכשיו</span>
                  </div>
                  <span className="text-[14px] text-muted">חלק שווה מהסה״כ (כולל כל התוספות), חלקי {d.shares_total}</span>
                </div>
                {payButton(`${btn.primaryLg} w-full`, "לתשלום החלק שלי בכרטיס")}
                <TrustList items={[
                  "כל אחד משלם רק את החלק שלו",
                  "תשלום מאובטח בכרטיס דרך PayPlus",
                  <>ביטולים לפי <Link href="/terms" className="font-bold text-accent hover:text-accent-hover">התקנון ומדיניות הביטולים</Link></>,
                ]} />
                <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn.outline} w-full`}>
                  <span className="text-[#128C4B]"><IconWhatsApp size={18} /></span> שאלה? דברו עם נציג
                </a>
              </div>
            )}
          </aside>

          {/* progress */}
          <div className="md:order-1 flex flex-col gap-5">
            <section className={`${card} p-5 md:p-6`} aria-label="מי כבר שילם">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <span className="font-display font-bold text-[20px] md:text-[22px] text-ink">{d.shares_paid} מתוך {d.shares_total} שילמו</span>
                <span className="text-[15px] font-bold text-accent">{pct}% מהדירה שולם</span>
              </div>
              <div className="h-3 rounded-full bg-soft-2 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="כמה מהדירה שולם">
                <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              {d.payers.length > 0 && (
                <ul className="flex flex-wrap gap-2 mt-4">
                  {d.payers.map((pp, i) => (
                    <li key={i} className="inline-flex items-center gap-1.5 text-[14px] bg-ok-soft text-ok-text px-3 py-1.5 rounded-full font-bold">
                      <IconCheck size={13} /> {pp.name || "אורח"}{pp.transfer ? " · הסעה" : ""}
                    </li>
                  ))}
                  {Array.from({ length: remaining }).map((_, i) => (
                    <li key={`r${i}`} className="text-[14px] bg-soft border border-line text-muted px-3 py-1.5 rounded-full font-medium">ממתין לתשלום</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-soft border border-line rounded-card p-5 md:p-6">
              <h2 className="font-bold text-[17px] text-ink mb-3">איך זה עובד</h2>
              <ol className="flex flex-col gap-2.5 text-[15px] text-body leading-relaxed">
                {[
                  "כל אחד מהחבורה פותח את הקישור הזה ומשלם את החלק שלו.",
                  "רואים כאן מי כבר שילם וכמה נשאר.",
                  "כשכולם שילמו, ההזמנה הושלמה.",
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-line text-ink text-[13px] font-bold flex items-center justify-center" aria-hidden="true">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 flex items-center gap-2 text-[14px] text-muted"><IcoLock size={16} /> קוד הקבוצה: <b dir="ltr" className="text-ink">{group.code}</b></p>
            </section>
          </div>
        </div>
      </div>

      {!full && (
        <MobileBar>
          <div className="flex flex-col min-w-0">
            <span className="font-display font-extrabold text-[22px] leading-none text-ink">€{myShare.toLocaleString()}</span>
            <span className="text-[13px] text-muted mt-1">החלק שלך</span>
          </div>
          <div className="flex-1">{payButton(`${btn.primary} w-full`, "לתשלום")}</div>
        </MobileBar>
      )}
    </div>
  );
}
