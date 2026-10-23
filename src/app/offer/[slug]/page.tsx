"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import type { Apartment } from "@/types";
import { createApartmentSlug } from "@/lib/slugs";
import {
  IconBank, IconCheck, IconWifi, IconFire, IconParking, IconSnowflake, IconMail, IconPhone,
} from "@/components/Icons";
import { PhotoGallery, Lightbox, QuoteNotFound, mapLink } from "@/components/QuoteView";
import { wrap, card, h1, h2, btn, chip, Crumbs } from "@/components/ui";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi":       <IconWifi size={18} />,
  "אח":         <IconFire size={18} />,
  "חניה":       <IconParking size={18} />,
  "ג'קוזי":     <IconSnowflake size={18} />,
};

const noSubscribe = () => () => {};

function OfferPage() {
  const { slug } = useParams<{ slug: string }>();
  const [apt, setApt] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const pageUrl = useSyncExternalStore(noSubscribe, () => window.location.href, () => "");

  useEffect(() => {
    fetch(`/api/apartments`)
      .then(r => r.json())
      .then(apts => {
        if (Array.isArray(apts)) {
          const found = apts.find(a => createApartmentSlug(a) === slug);
          setApt(found || null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <SkiLoader label="רגע, פותחים את ההצעה…" />;

  if (!apt) return <QuoteNotFound />;

  const bankDetails = {
    bank: process.env.NEXT_PUBLIC_BANK_NAME || "בנק הפועלים",
    iban: process.env.NEXT_PUBLIC_BANK_IBAN || "IL62012673000000026026",
    account: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "SKISHARE - GUINDY IDAN AND MIZRAHI AMIT",
    swift: process.env.NEXT_PUBLIC_BANK_SWIFT || "POALILIT",
  };

  const amenityIcon = (a: string) => AMENITY_ICONS[a] ?? <IconCheck size={18} />;
  const imgs = apt.images?.length ? apt.images : ["/view.jpg", "/chalet-interior.jpg", "/hero-ski.jpg"];
  const mapHref = mapLink(apt.map_url);
  const facts = [
    apt.max_guests ? { v: `עד ${apt.max_guests}`, l: "אנשים" } : null,
    apt.baths ? { v: String(apt.baths), l: apt.baths === 1 ? "חדר רחצה" : "חדרי רחצה" } : null,
    apt.sqm ? { v: `${apt.sqm} מ"ר`, l: "גודל" } : null,
  ].filter((x): x is { v: string; l: string } => !!x);
  const price = `€${Number(apt.price_per_night || 0).toLocaleString()}`;

  const contact = (
    <div className="flex flex-col gap-2.5">
      <a href="tel:+972547701899" className={`${btn.primaryLg} w-full`}><IconPhone size={20} /> להתקשר</a>
      <a href="mailto:skishareteam@gmail.com" className={`${btn.outline} w-full`}><IconMail size={18} /> לשלוח מייל</a>
    </div>
  );

  return (
    <div className="bg-white text-ink" dir="rtl">
      <div className={`${wrap} pt-5 md:pt-7`}>
        <Crumbs items={[{ label: "דף הבית", href: "/" }, { label: "דירות", href: "/apartments" }, { label: apt.name }]} />
        <div className="flex flex-wrap items-end justify-between gap-4 mt-3 md:mt-4">
          <div className="flex flex-col gap-2 min-w-0">
            {apt.type && <span className="self-start inline-flex items-center rounded-full bg-accent-soft text-accent text-[13px] font-bold px-3 py-1">{apt.type}</span>}
            <h1 className={h1}>{apt.name}</h1>
            <span className="text-[16px] md:text-[17px] text-muted">ואל טורנס, שלושת העמקים · צרפת</span>
          </div>
          {facts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {facts.slice(0, 3).map(f => <span key={f.l} className={chip}>{f.v} {f.l}</span>)}
            </div>
          )}
        </div>
        <div className="mt-5 md:mt-6">
          <PhotoGallery imgs={imgs} name={apt.name} idx={Math.min(idx, imgs.length - 1)} setIdx={setIdx} onOpen={setLightbox} />
        </div>
      </div>

      <div className={`${wrap} pt-7 md:pt-9 pb-10 lg:pb-24 flex flex-col lg:flex-row gap-9 items-start`}>
        <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-10">
          <section className="flex flex-col gap-4" aria-labelledby="about-h">
            <h2 id="about-h" className={h2}>על הדירה</h2>
            {apt.description && <p className="text-[16px] md:text-[17px] leading-[1.7] text-body whitespace-pre-line">{apt.description}</p>}
            {facts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {facts.map(f => (
                  <div key={f.l} className="border border-line rounded-2xl p-3.5">
                    <div className="font-display font-bold text-[18px] text-ink">{f.v}</div>
                    <div className="text-[14px] text-muted">{f.l}</div>
                  </div>
                ))}
              </div>
            )}
            {mapHref && (
              <a href={mapHref} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3.5 min-h-[56px] hover:border-ink transition-colors">
                <span className="font-bold text-[15px] text-ink">ואל טורנס, צרפת</span>
                <span className="text-[14px] font-bold text-accent">לפתוח במפה ‹</span>
              </a>
            )}
          </section>

          {apt.amenities?.length > 0 && (
            <section className="flex flex-col gap-4" aria-labelledby="amen-h">
              <h2 id="amen-h" className={h2}>מה יש בדירה</h2>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {apt.amenities.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 min-h-[52px] px-4 rounded-2xl bg-soft text-[15px] font-medium text-ink">
                    <span className="text-accent shrink-0">{amenityIcon(a)}</span>{a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-4" aria-labelledby="bank-h">
            <h2 id="bank-h" className={h2}>תשלום בהעברה בנקאית</h2>
            <div className={`${card} p-5 md:p-6`}>
              <p className="flex items-center gap-2 text-[15px] text-body mb-3"><span className="text-accent"><IconBank size={20} /></span>העברה בנקאית לחשבון שלנו:</p>
              <div className="divide-y divide-line">
                <BankRow k="בנק" v={bankDetails.bank} />
                <BankRow k="IBAN" v={bankDetails.iban} mono />
                <BankRow k="SWIFT" v={bankDetails.swift} mono />
                <BankRow k="שם בעל החשבון" v={bankDetails.account} />
              </div>
              <p className="flex items-start gap-2 text-[14px] text-muted mt-4 leading-relaxed">
                <span className="text-ok mt-0.5 shrink-0"><IconCheck size={16} /></span>
                כשההעברה מגיעה אלינו, נאשר את ההזמנה והדירה שלכם.
              </p>
            </div>
          </section>

          <div className="lg:hidden flex flex-col gap-3">
            <h2 className={h2}>יש שאלה?</h2>
            {contact}
          </div>

          {pageUrl && (
            <p className="text-[13px] text-muted break-all">את העמוד הזה אפשר לשלוח הלאה: <span dir="ltr">{pageUrl}</span></p>
          )}
        </div>

        <aside aria-label="מחיר ויצירת קשר"
          className="hidden lg:flex flex-col gap-4 w-[360px] shrink-0 sticky top-[96px] bg-white border border-line rounded-[24px] p-6 shadow-card">
          <span className="text-[18px] font-bold text-ink">{apt.name}</span>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-[40px] leading-none text-ink">{price}</span>
            <span className="text-[15px] text-muted">ללילה</span>
          </div>
          {contact}
          <span className="text-[13px] text-muted leading-relaxed">אפשר לשלם בהעברה בנקאית, הפרטים כאן בעמוד.</span>
        </aside>
      </div>

      {/* phone: the price and a call button at the bottom */}
      <div className="lg:hidden sticky bottom-0 z-40 bg-white border-t border-line px-4 pt-3 flex items-center gap-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)", boxShadow: "0 -8px 24px rgba(11,27,51,0.08)" }}>
        <div className="flex items-baseline gap-1 shrink-0">
          <span className="font-display font-extrabold text-[22px] text-ink">{price}</span>
          <span className="text-[13px] text-muted">ללילה</span>
        </div>
        <a href="tel:+972547701899" className={`${btn.primary} flex-1`}><IconPhone size={18} /> להתקשר</a>
      </div>

      <Lightbox imgs={imgs} index={lightbox} setIndex={setLightbox} name={apt.name} />
    </div>
  );
}

function BankRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-[14px] text-muted shrink-0">{k}</span>
      <span dir={mono ? "ltr" : undefined} className={`text-[15px] font-bold text-ink text-left ${mono ? "font-mono tracking-tight break-all" : "break-words"}`}>{v}</span>
    </div>
  );
}

export default function OfferPageWrapper() {
  return (
    <Suspense fallback={<SkiLoader label="רגע, פותחים את ההצעה…" />}>
      <OfferPage />
    </Suspense>
  );
}
