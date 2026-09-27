"use client";
import { useEffect, useRef } from "react";

// Lightweight decorative snowfall for a hero section — canvas rather than
// DOM nodes so a few dozen flakes cost one paint instead of dozens of
// animated elements. Purely cosmetic: pointer-events are off and it
// unmounts its RAF loop cleanly.
export default function SnowCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);
    let raf = 0;

    const onResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", onResize);

    const count = window.innerWidth < 768 ? 28 : 50;
    const flakes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.4 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      speedY: Math.random() * 1.1 + 0.4,
      speedX: (Math.random() - 0.5) * 0.7,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const f of flakes) {
        ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
        f.y += f.speedY;
        f.x += f.speedX;
        if (f.y > height) { f.y = -5; f.x = Math.random() * width; }
        if (f.x > width) f.x = 0;
        if (f.x < 0) f.x = width;
      }
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />;
}
