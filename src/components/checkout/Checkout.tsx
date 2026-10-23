import type { ReactNode } from "react";
import { card } from "@/components/ui";

/*
 * Pieces shared by the checkout pages (/book, /combo, /split, /pay/*):
 * form sections, selectable option cards, summary rows, the phone's sticky
 * bottom bar and the centered status card of the result pages.
 */

const ico = (path: ReactNode, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">{path}</svg>
);
export const IcoLock = ({ size = 18 }: { size?: number }) => ico(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>, size);
export const IcoSplit = ({ size = 20 }: { size?: number }) => ico(<><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M2 20a6 6 0 0 1 12 0" /><path d="M10 20a6 6 0 0 1 12 0" /></>, size);
export const IcoShieldCheck = ({ size = 20 }: { size?: number }) => ico(<><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></>, size);
export const IcoChat = ({ size = 20 }: { size?: number }) => ico(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />, size);
export const IcoArrow = ({ size = 18 }: { size?: number }) => ico(<path d="M19 12H5M11 6l-6 6 6 6" />, size);
export const IcoInfo = ({ size = 18 }: { size?: number }) => ico(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>, size);
export const IcoLink = ({ size = 18 }: { size?: number }) => ico(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>, size);
export const IcoX = ({ size = 18 }: { size?: number }) => ico(<path d="M6 6l12 12M18 6L6 18" />, size);
export const IcoCheckBig = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l4 4 10-10" /></svg>
);

/** Keeps "+€180" / "−€100" in the right order inside Hebrew text. */
export function Ltr({ children }: { children: ReactNode }) {
  return <span dir="ltr" className="whitespace-nowrap">{children}</span>;
}
const signed = (v: ReactNode) => (typeof v === "string" && /^[+−-]/.test(v) ? <Ltr>{v}</Ltr> : v);

/** A numbered card of the checkout form. */
export function FormSection({ id, step, title, sub, children, className = "" }: {
  id?: string; step?: number; title: ReactNode; sub?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section id={id} className={`${card} p-5 md:p-6 scroll-mt-[96px] ${className}`}>
      <div className="flex items-start gap-3 mb-4 md:mb-5">
        {step != null && (
          <span className="shrink-0 w-8 h-8 rounded-full bg-ink text-white font-display font-bold text-[15px] flex items-center justify-center" aria-hidden="true">{step}</span>
        )}
        <div className="min-w-0">
          <h2 className="font-display font-bold text-[20px] md:text-[22px] leading-snug text-ink">{title}</h2>
          {sub && <p className="text-[14px] md:text-[15px] text-muted mt-0.5 leading-relaxed">{sub}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Indicator({ type, on, disabled }: { type: "radio" | "checkbox"; on: boolean; disabled?: boolean }) {
  if (type === "radio") {
    return (
      <span aria-hidden="true" className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${disabled ? "border-line-strong bg-soft" : on ? "border-accent" : "border-line-strong bg-white"}`}>
        {on && <span className="w-2.5 h-2.5 rounded-full bg-accent" />}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center ${disabled ? "border-line-strong bg-soft" : on ? "border-accent bg-accent text-white" : "border-line-strong bg-white"}`}>
      {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10" /></svg>}
    </span>
  );
}

/**
 * A choice shown as a card: radio (one of a group) or checkbox (on/off).
 * Selected = blue 2px border on a light blue background, like the design.
 */
export function OptionCard({
  type = "radio", selected, onSelect, title, sub, badge, price, icon, disabled, note,
}: {
  type?: "radio" | "checkbox"; selected: boolean; onSelect?: () => void; title: ReactNode; sub?: ReactNode;
  badge?: ReactNode; price?: ReactNode; icon?: ReactNode; disabled?: boolean; note?: ReactNode;
}) {
  return (
    <button type="button" role={type} aria-checked={selected} aria-disabled={disabled || undefined}
      onClick={() => { if (!disabled && onSelect) onSelect(); }}
      className={`w-full text-start flex items-start gap-3 rounded-[18px] transition-colors ${
        disabled ? "border border-line bg-soft p-4 cursor-not-allowed"
          : selected ? "border-2 border-accent bg-accent-soft p-[15px]"
          : "border border-line bg-white hover:border-line-strong p-4"}`}>
      <Indicator type={type} on={selected} disabled={disabled} />
      {icon && <span className={`mt-px ${disabled ? "text-muted/60" : selected ? "text-accent" : "text-muted"}`}>{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`font-bold text-[16px] ${disabled ? "text-muted" : "text-ink"}`}>{title}</span>
          {badge}
        </span>
        {sub && <span className="block text-[14px] text-muted mt-0.5 leading-relaxed">{sub}</span>}
        {note && <span className="block mt-2">{note}</span>}
      </span>
      {price != null && <span className={`shrink-0 font-bold text-[15px] whitespace-nowrap ${disabled ? "text-muted" : "text-ink"}`}>{signed(price)}</span>}
    </button>
  );
}

/** Small colored label inside an option: "+€100 לאדם", "חוסכים €200". */
export function Tag({ tone = "soft", children }: { tone?: "soft" | "ok" | "warn" | "danger" | "accent"; children: ReactNode }) {
  const cls = {
    soft: "bg-soft text-ink border border-line",
    ok: "bg-ok-soft text-ok-text",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
    accent: "bg-accent-soft text-accent",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-bold whitespace-nowrap ${cls}`}>{signed(children)}</span>;
}

/** A line of the price summary. */
export function SumRow({ label, value, strong = false, tone }: { label: ReactNode; value: ReactNode; strong?: boolean; tone?: "ok" | "warn" }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${strong ? "text-[16px]" : "text-[15px]"}`}>
      <span className={strong ? "font-bold text-ink" : "text-body"}>{label}</span>
      <span className={`shrink-0 text-end ${strong ? "font-bold text-ink" : tone === "ok" ? "font-bold text-ok-text" : tone === "warn" ? "text-[13px] font-bold text-warn" : "font-bold text-ink"}`}>{signed(value)}</span>
    </div>
  );
}

/** A note box: info (soft), warn, danger, ok. */
export function Note({ tone = "info", children, className = "" }: { tone?: "info" | "warn" | "danger" | "ok"; children: ReactNode; className?: string }) {
  const cls = {
    info: "bg-soft border-line text-body",
    warn: "bg-warn-soft border-[#F6D9C4] text-warn",
    danger: "bg-danger-soft border-[#F7CFCB] text-danger",
    ok: "bg-ok-soft border-[#BFE3CF] text-ok-text",
  }[tone];
  return <div role={tone === "danger" ? "alert" : undefined} className={`rounded-2xl border px-4 py-3 text-[14px] md:text-[15px] leading-relaxed ${cls} ${className}`}>{children}</div>;
}

/** The trust lines under the main button. */
export function TrustList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2 text-[14px] text-body">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F7A4F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 mt-[3px]"><path d="M5 12l4 4 10-10" /></svg>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Phone only: the total and the main button, fixed at the bottom of the screen
 * (with a spacer so the end of the page isn't hidden behind it).
 */
export function MobileBar({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="h-[92px] md:hidden" aria-hidden="true" />
      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-line px-4 pt-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))", boxShadow: "0 -8px 24px rgba(11,27,51,0.08)" }}>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </>
  );
}

/** The centered card of a result page (paid, failed, booking received …). */
export function StatusCard({ tone, title, children, actions }: {
  tone: "ok" | "danger" | "info"; title: ReactNode; children?: ReactNode; actions?: ReactNode;
}) {
  const ring = tone === "ok" ? "bg-ok-soft text-ok" : tone === "danger" ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent";
  return (
    <div className="flex-1 bg-soft flex items-start md:items-center justify-center px-4 py-10 md:py-16">
      <div className={`${card} w-full max-w-[600px] px-5 py-8 md:px-10 md:py-10 flex flex-col items-center text-center gap-4`}>
        <span className={`w-16 h-16 rounded-full flex items-center justify-center ${ring}`}>
          {tone === "danger" ? <IcoX size={28} /> : tone === "ok" ? <IcoCheckBig /> : <IcoInfo size={28} />}
        </span>
        <h1 className="font-display font-extrabold text-[28px] md:text-[34px] leading-tight tracking-tight text-ink">{title}</h1>
        {children}
        {actions && <div className="w-full flex flex-col sm:flex-row sm:justify-center gap-2.5 mt-2">{actions}</div>}
      </div>
    </div>
  );
}
