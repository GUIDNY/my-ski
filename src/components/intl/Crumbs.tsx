import Link from "next/link";
import type { Lang } from "@/lib/intl/config";

export type Crumb = { label: string; href?: string };

const LABEL: Record<Lang, string> = { en: "Breadcrumb", fr: "Fil d'Ariane" };

/** "Home › Apartments › Dôme 302", like the Hebrew Crumbs (components/ui.tsx). */
export default function Crumbs({ lang, items, className = "" }: { lang: Lang; items: Crumb[]; className?: string }) {
  return (
    <nav aria-label={LABEL[lang]} className={`text-[14px] text-muted ${className}`}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-2 min-w-0">
            {i > 0 && <span aria-hidden="true">›</span>}
            {c.href && i < items.length - 1
              ? <Link href={c.href} className="inline-flex items-center min-h-[44px] min-w-[44px] -my-2.5 hover:text-ink transition-colors">{c.label}</Link>
              : <span className={i === items.length - 1 ? "text-ink truncate" : ""} aria-current={i === items.length - 1 ? "page" : undefined}>{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
