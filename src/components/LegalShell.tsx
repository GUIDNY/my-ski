import { PageTop, wrap } from "@/components/ui";

/* A calm, readable frame for the legal pages (terms, privacy, cookies …).
   The site header and footer come from the layout. */
export default function LegalShell({
  title, updated, children,
}: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="bg-white text-ink" dir="rtl">
      <PageTop soft
        crumbs={[{ label: "דף הבית", href: "/" }, { label: title }]}
        title={title}
        sub={`עודכן: ${updated}`}
      />

      <main className={`${wrap} py-10 md:py-14`}>
        <article className="legal max-w-[760px] flex flex-col gap-4 text-[16px] md:text-[17px] leading-[1.8] text-body
          [&_a]:text-accent [&_a]:font-bold [&_a:hover]:text-accent-hover [&_b]:text-ink [&_b]:font-bold [&_strong]:text-ink">
          {children}
        </article>

        <div className="max-w-[760px] mt-12 rounded-card bg-soft border border-line p-5 md:p-6 text-[15px] text-body flex flex-col gap-1.5">
          <p className="font-bold text-ink">סקי שר בע״מ · SkiShare</p>
          <p>ח.פ: 517332060 · הזוהר 12, קיסריה</p>
          <p>
            טלפון: <a href="tel:+972547701899" className="text-accent font-bold" dir="ltr">054-7701899</a>
            {" · "}דוא״ל: <a href="mailto:skishareteam@gmail.com" className="text-accent font-bold">skishareteam@gmail.com</a>
          </p>
        </div>
      </main>
    </div>
  );
}

/* small helpers for legal content */
export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-[21px] md:text-[23px] font-bold text-ink pt-5 leading-snug">{children}</h2>;
}
export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}
export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc ps-6 flex flex-col gap-2 marker:text-accent">{children}</ul>;
}
