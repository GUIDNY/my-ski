"use client";

const flakes = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  left: (i * 17.3) % 100,
  delay: (i * 0.37) % 12,
  duration: 8 + (i * 0.23) % 10,
  size: 2 + (i % 4),
  opacity: 0.2 + (i % 5) * 0.12,
  swayDuration: 3 + (i % 4),
}));

export default function Snow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {flakes.map((f) => (
        <div
          key={f.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${f.left}%`,
            top: "-10px",
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animation: `snowfall ${f.duration}s ${f.delay}s linear infinite, sway ${f.swayDuration}s ${f.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
