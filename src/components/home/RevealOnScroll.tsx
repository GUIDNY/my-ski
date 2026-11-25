"use client";
import { useEffect } from "react";

/*
 * Fades parts of the page in as they scroll into view: anything marked
 * data-reveal (data-reveal-delay="1".."3" staggers it). Without JavaScript,
 * or for visitors who ask for less motion, everything is simply shown.
 */
export default function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    // what is already on screen stays as it is; the rest waits for its turn
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) continue;
      el.classList.add("reveal-wait");
      io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return null;
}
