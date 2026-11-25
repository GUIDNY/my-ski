"use client";

/*
 * Gentle falling snow over a photo. Each flake is two layers, so the fall and
 * the side-to-side sway don't fight over one transform. Off for visitors who
 * ask for less motion (globals.css).
 */
const flakes = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  left: (i * 17.3) % 100,
  delay: -((i * 0.83) % 14),
  duration: 9 + ((i * 0.37) % 9),
  size: 2 + (i % 4),
  opacity: 0.35 + (i % 5) * 0.12,
  swayDuration: 3 + (i % 4),
}));

export default function Snow() {
  return (
    <div aria-hidden="true" className="snow absolute inset-0 overflow-hidden pointer-events-none z-[5]">
      {flakes.map(f => (
        <div key={f.id} className="snow-fall absolute top-0"
          style={{ left: `${f.left}%`, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }}>
          <div className="snow-sway rounded-full bg-white"
            style={{ width: f.size, height: f.size, opacity: f.opacity, animationDuration: `${f.swayDuration}s`, boxShadow: "0 0 4px rgba(255,255,255,.8)" }} />
        </div>
      ))}
    </div>
  );
}
