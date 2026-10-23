"use client";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";

/** − n + for the number of guests (44px buttons). */
export default function Stepper({ lang, value, onChange, min = 1, max, label }: {
  lang: Lang; value: number; onChange: (n: number) => void; min?: number; max: number; label: string;
}) {
  const t = DICT[lang].common;
  const b = "w-11 h-11 rounded-full border border-line-strong bg-white text-ink text-[20px] leading-none flex items-center justify-center transition-colors hover:border-ink disabled:opacity-35 disabled:hover:border-line-strong";
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" className={b} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={t.fewer}>−</button>
      <span className="w-7 text-center font-display font-bold text-[18px] text-ink" aria-live="polite">{value}</span>
      <button type="button" className={b} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={t.more}>+</button>
    </div>
  );
}
