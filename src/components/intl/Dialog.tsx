"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconX } from "@/components/Icons";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";

/**
 * A modal window: a sheet from the bottom on phones, a centred card from
 * 640px. Escape or the backdrop closes it (unless `locked`), the page behind
 * doesn't scroll, focus moves in and goes back to the opener on close.
 * Rendered on <body> so a sticky parent never traps it under the header.
 */
export default function Dialog({ lang, title, sub, onClose, locked = false, wide = false, children, footer }: {
  lang: Lang; title: ReactNode; sub?: ReactNode; onClose: () => void; locked?: boolean; wide?: boolean;
  children: ReactNode; footer?: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const lockedRef = useRef(locked);
  useEffect(() => { closeRef.current = onClose; lockedRef.current = locked; });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !lockedRef.current) closeRef.current(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div lang={lang} dir="ltr" className="fixed inset-0 z-[90] bg-ink/55 flex items-end sm:items-center justify-center sm:p-4"
      onClick={() => { if (!locked) onClose(); }}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="intl-dialog-title" tabIndex={-1}
        className={`bg-white w-full ${wide ? "sm:max-w-[760px]" : "sm:max-w-[480px]"} rounded-t-[24px] sm:rounded-card max-h-[92dvh] flex flex-col outline-none`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-3 border-b border-line shrink-0">
          <div className="min-w-0">
            <h2 id="intl-dialog-title" className="font-display font-bold text-[21px] sm:text-[22px] leading-tight text-ink">{title}</h2>
            {sub && <div className="text-[14px] text-muted mt-1">{sub}</div>}
          </div>
          <button type="button" onClick={() => { if (!locked) onClose(); }} aria-label={DICT[lang].common.close}
            className="w-11 h-11 -mt-1.5 -me-2 shrink-0 rounded-full hover:bg-soft text-muted hover:text-ink flex items-center justify-center transition-colors">
            <IconX size={20} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-line px-5 sm:px-6 pt-3"
            style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
