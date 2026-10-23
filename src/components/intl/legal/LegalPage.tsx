import type { ReactNode } from "react";
import { wrap } from "@/components/ui";
import { CONTACT_EMAIL, type Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import Crumbs from "../Crumbs";

/* The frame of the translated legal pages, like components/LegalShell.tsx:
   title, date, a readable column and the company's details. */

const COMPANY: Record<Lang, { no: string; address: string; phone: string; email: string; updated: string }> = {
  en: { no: "Company no.", address: "HaZohar 12, Caesarea, Israel", phone: "Phone:", email: "Email:", updated: "Updated:" },
  fr: { no: "N° de société :", address: "HaZohar 12, Césarée, Israël", phone: "Téléphone :", email: "E-mail :", updated: "Mise à jour :" },
};

export default function LegalPage({ lang, title, updated, intro, children }: {
  lang: Lang; title: string; updated: string; intro?: ReactNode; children: ReactNode;
}) {
  const t = DICT[lang];
  const c = COMPANY[lang];
  return (
    <div className="bg-white text-ink">
      <div className="bg-soft border-b border-line">
        <div className={`${wrap} pt-6 md:pt-8 pb-8 md:pb-10`}>
          <Crumbs lang={lang} items={[{ label: t.nav.home, href: `/${lang}` }, { label: title }]} className="mb-3 md:mb-4" />
          <h1 className="font-display font-extrabold text-[32px] leading-[1.1] md:text-[44px] tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-[16px] md:text-[17px] text-muted">{c.updated} {updated}</p>
        </div>
      </div>
      <div className={`${wrap} py-10 md:py-14`}>
        <article className="max-w-[760px] flex flex-col gap-4 text-[16px] md:text-[17px] leading-[1.8] text-body
          [&_a]:text-accent [&_a]:font-bold [&_a:hover]:text-accent-hover [&_b]:text-ink [&_b]:font-bold [&_strong]:text-ink">
          {intro && <div className="rounded-2xl bg-accent-soft border border-[#CFDAF7] px-4 py-3 text-[15px] leading-relaxed text-ink">{intro}</div>}
          {children}
        </article>
        <div className="max-w-[760px] mt-12 rounded-card bg-soft border border-line p-5 md:p-6 text-[15px] text-body flex flex-col gap-1.5">
          <p className="font-bold text-ink">Ski Share Ltd. (<bdi lang="he" dir="rtl">סקי שר בע״מ</bdi>) · SkiShare</p>
          <p>{c.no} 517332060 · {c.address}</p>
          <p>
            {c.phone} <a href="tel:+972547701899" className="text-accent font-bold">+972 54-770-1899</a>
            {" · "}{c.email} <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent font-bold break-all">{CONTACT_EMAIL}</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return <h2 id={id} className="font-display text-[21px] md:text-[23px] font-bold text-ink pt-5 leading-snug scroll-mt-[150px]">{children}</h2>;
}
export function H3({ children }: { children: ReactNode }) {
  return <h3 className="font-bold text-[17px] md:text-[18px] text-ink pt-2">{children}</h3>;
}
export function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc ps-6 flex flex-col gap-2 marker:text-accent">{children}</ul>;
}
