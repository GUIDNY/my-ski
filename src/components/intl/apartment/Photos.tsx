"use client";
import { useEffect, useRef, useState } from "react";
import { IconChevronLeft, IconX } from "@/components/Icons";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";

/* Photos: swipe on the phone, one big and two small on desktop, every photo
   full screen in the lightbox. Server-rendered <img> tags with alt text. */

function Lightbox({ lang, images, start, name, onClose }: { lang: Lang; images: string[]; start: number; name: string; onClose: () => void }) {
  const t = DICT[lang].apt;
  const [i, setI] = useState(start);
  const touchX = useRef<number | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const n = images.length;
  const prev = () => setI(v => (v - 1 + n) % n);
  const next = () => setI(v => (v + 1) % n);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI(v => (v + 1) % n);
      if (e.key === "ArrowLeft") setI(v => (v - 1 + n) % n);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener("keydown", onKey); opener?.focus?.(); };
  }, [n, onClose]);

  return (
    <div dir="ltr" role="dialog" aria-modal="true" aria-label={t.photosOf(name)} className="fixed inset-0 z-[96] bg-ink flex flex-col">
      <div className="flex items-center justify-between px-4 md:px-6 h-16 text-white shrink-0 gap-3">
        <span className="text-[15px] font-bold truncate">{name} · {i + 1} / {n}</span>
        <button ref={closeBtn} type="button" onClick={onClose} aria-label={DICT[lang].common.close}
          className="w-11 h-11 shrink-0 rounded-full hover:bg-white/10 flex items-center justify-center"><IconX size={22} /></button>
      </div>
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 md:px-20"
        onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 45) { if (dx < 0) next(); else prev(); }
        }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={t.photoAlt(name, i + 1)} className="max-h-full max-w-full object-contain rounded-xl select-none" draggable={false} />
        {n > 1 && (
          <>
            <button type="button" onClick={prev} aria-label={t.prevPhoto}
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center">
              <IconChevronLeft size={22} />
            </button>
            <button type="button" onClick={next} aria-label={t.nextPhoto}
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center">
              <IconChevronLeft size={22} className="rotate-180" />
            </button>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="shrink-0 px-4 py-3 flex gap-2 overflow-x-auto justify-start md:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          {images.map((src, j) => (
            <button key={j} type="button" onClick={() => setI(j)} aria-label={t.photoN(j + 1)} aria-current={j === i ? "true" : undefined}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-opacity ${j === i ? "border-white opacity-100" : "border-transparent opacity-55 hover:opacity-90"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Photos({ lang, images, name }: { lang: Lang; images: string[]; name: string }) {
  const t = DICT[lang].apt;
  const [open, setOpen] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const n = images.length;
  const onScroll = () => {
    const el = strip.current;
    if (el) setIdx(Math.min(n - 1, Math.round(Math.abs(el.scrollLeft) / Math.max(1, el.clientWidth))));
  };
  const allBtn = "inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-white text-ink text-[15px] font-bold shadow-sm hover:bg-soft transition-colors";
  const tile = (src: string, i: number, cls: string) => (
    <button key={i} type="button" onClick={() => setOpen(i)} aria-label={t.openPhoto(i + 1, n)} className={`relative overflow-hidden bg-soft-2 group ${cls}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={t.photoAlt(name, i + 1)} loading={i === 0 ? "eager" : "lazy"}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
    </button>
  );

  return (
    <>
      {/* phone: swipe */}
      <div className="md:hidden relative -mx-4">
        <div ref={strip} onScroll={onScroll} className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((src, i) => (
            <button key={i} type="button" onClick={() => setOpen(i)} aria-label={t.openPhoto(i + 1, n)} className="snap-center shrink-0 w-full h-[290px] bg-soft-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={t.photoAlt(name, i + 1)} loading={i === 0 ? "eager" : "lazy"} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        {n > 1 && (
          <span className="absolute bottom-3 right-3 bg-ink/75 text-white text-[13px] font-bold rounded-full px-3 py-1 pointer-events-none" aria-hidden="true">
            {idx + 1} / {n}
          </span>
        )}
      </div>

      {/* desktop: one big, two small, and every photo in the lightbox */}
      {n >= 3 ? (
        <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-2.5 h-[440px]">
          {tile(images[0], 0, "col-span-2 row-span-2 rounded-s-card")}
          {tile(images[1], 1, "rounded-se-card")}
          <div className="relative">
            {tile(images[2], 2, "w-full h-full rounded-ee-card")}
            <button type="button" onClick={() => setOpen(0)} className={`absolute bottom-3 right-3 ${allBtn}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
              {t.allPhotos(n)}
            </button>
          </div>
        </div>
      ) : (
        <div className={`hidden md:grid gap-2.5 h-[440px] ${n === 2 ? "grid-cols-3" : "grid-cols-1"}`}>
          {tile(images[0], 0, n === 2 ? "col-span-2 rounded-s-card" : "rounded-card")}
          {n === 2 && tile(images[1], 1, "rounded-e-card")}
        </div>
      )}

      {open !== null && <Lightbox lang={lang} images={images} start={open} name={name} onClose={() => setOpen(null)} />}
    </>
  );
}
