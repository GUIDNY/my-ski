import type { ReactNode } from "react";
import Link from "next/link";

/*
 * The shared look of the site (the 2026/27 design, see the design canvas):
 * white pages, soft blue-grey sections, navy text, one blue for actions.
 * Colors come from the theme in globals.css (text-ink, bg-soft, border-line,
 * bg-accent, text-muted …). Use these pieces instead of one-off styles so
 * every page looks like the same site.
 */

/** Page width and side padding. */
export const wrap = "w-full max-w-[1240px] mx-auto px-4 md:px-6";
/** A white card with the soft border. */
export const card = "bg-white border border-line rounded-card";
/** Headings. h1 for the page title, h2 for sections, h3 for cards. */
export const h1 = "font-display font-extrabold text-[32px] leading-[1.1] md:text-[44px] md:leading-[1.08] tracking-tight text-ink";
export const h2 = "font-display font-bold text-[24px] leading-tight md:text-[30px] tracking-tight text-ink";
export const h3 = "font-display font-bold text-[19px] md:text-[21px] leading-snug text-ink";
/** The grey line under a title. */
export const lead = "text-[16px] md:text-[17px] leading-relaxed text-muted";

const btnBase =
  "inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed";
/** Buttons (also for links that look like buttons). */
export const btn = {
  primary: `${btnBase} bg-accent hover:bg-accent-hover text-white rounded-[14px] min-h-[48px] px-6 text-[16px]`,
  primaryLg: `${btnBase} bg-accent hover:bg-accent-hover text-white rounded-2xl min-h-[56px] px-7 text-[18px] font-display`,
  dark: `${btnBase} bg-ink hover:bg-[#16294A] text-white rounded-[14px] min-h-[48px] px-6 text-[16px]`,
  outline: `${btnBase} bg-white border border-line-strong hover:border-ink text-ink rounded-[14px] min-h-[48px] px-6 text-[16px]`,
  pill: `${btnBase} bg-white border border-line-strong hover:border-ink text-ink rounded-full min-h-[44px] px-4 text-[15px]`,
  link: "inline-flex items-center gap-1.5 font-bold text-accent hover:text-accent-hover transition-colors",
};

/** Form fields. 16px text so iOS doesn't zoom in on focus. */
export const field =
  "w-full min-h-[48px] rounded-xl border border-line-strong bg-white px-4 text-[16px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-soft";
export const fieldLabel = "block text-[14px] font-bold text-ink mb-1.5";

/** Small rounded labels: "דירה שלנו", dates, guests. */
export const chip =
  "inline-flex items-center gap-2 bg-soft border border-line rounded-full px-3.5 py-1.5 text-[14px] md:text-[15px] font-medium text-ink";
export const badgeLight = "inline-flex items-center bg-white text-ink rounded-full px-3 py-1 text-[13px] font-bold";
export const badgeDark = "inline-flex items-center bg-ink text-white rounded-full px-3 py-1 text-[13px] font-bold";

/** The green check used in "what's included" lists. */
export function Check({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F7A4F" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}

/** A list with green checks. */
export function CheckList({ items, className = "" }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={`flex flex-col gap-2 text-[15px] text-ink ${className}`}>
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2"><Check className="mt-[3px]" />{it}</li>
      ))}
    </ul>
  );
}

export type Crumb = { label: string; href?: string };

/** "דף הבית › דירות › גלסיירס 35" */
export function Crumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="מיקום" className={`text-[14px] text-muted ${className}`}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-2 min-w-0">
            {i > 0 && <span aria-hidden="true">›</span>}
            {c.href && i < items.length - 1
              ? <Link href={c.href} className="hover:text-ink transition-colors">{c.label}</Link>
              : <span className={i === items.length - 1 ? "text-ink truncate" : ""} aria-current={i === items.length - 1 ? "page" : undefined}>{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * The top of an inner page: breadcrumbs, title, a grey line under it and an
 * optional slot on the other side (chips, a button).
 */
export function PageTop({
  crumbs, title, sub, aside, soft = false, children,
}: {
  crumbs?: Crumb[]; title: ReactNode; sub?: ReactNode; aside?: ReactNode; soft?: boolean; children?: ReactNode;
}) {
  return (
    <div className={soft ? "bg-soft border-b border-line" : ""}>
      <div className={`${wrap} pt-6 md:pt-8 ${soft ? "pb-8 md:pb-10" : "pb-2"}`}>
        {crumbs && crumbs.length > 0 && <Crumbs items={crumbs} className="mb-3 md:mb-4" />}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <h1 className={h1}>{title}</h1>
            {sub && <div className={lead}>{sub}</div>}
          </div>
          {aside && <div className="flex flex-wrap gap-2">{aside}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

/** A section with a title row (title, grey line, and a link on the other side). */
export function SectionHead({ title, sub, action, className = "" }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 mb-6 md:mb-8 ${className}`}>
      <div className="flex flex-col gap-2 min-w-0">
        <h2 className={h2}>{title}</h2>
        {sub && <p className={lead}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** Nothing to show (no results, no orders …), with an optional way forward. */
export function EmptyState({ title, text, action, className = "" }: { title: ReactNode; text?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={`${card} px-6 py-10 md:py-14 text-center flex flex-col items-center gap-3 ${className}`}>
      <div className="font-display font-bold text-[20px] md:text-[22px] text-ink">{title}</div>
      {text && <p className="text-[15px] md:text-[16px] text-muted max-w-[520px] leading-relaxed">{text}</p>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/** The big price: "€1,202 לאדם", with the group total under it. */
export function PerPerson({
  amount, total, size = "md", align = "start",
}: { amount: string; total?: string; size?: "sm" | "md" | "lg"; align?: "start" | "end" }) {
  const big = size === "lg" ? "text-[40px] md:text-[44px]" : size === "sm" ? "text-[24px]" : "text-[30px] md:text-[32px]";
  return (
    <div className={`flex flex-col gap-0.5 ${align === "end" ? "items-end" : "items-start"}`}>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-display font-extrabold leading-none text-ink ${big}`}>{amount}</span>
        <span className="text-[15px] text-muted">לאדם</span>
      </div>
      {total && <span className="text-[14px] text-muted">{total} לכל החבורה</span>}
    </div>
  );
}

/** A thin loading placeholder block. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl bg-soft-2 animate-pulse ${className}`} aria-hidden="true" />;
}
