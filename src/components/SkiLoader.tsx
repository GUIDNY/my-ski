// Playful loading screen — a skier sliding + falling snow.
const FLAKES = [
  { left: "8%", delay: "0s", dur: "3.2s", size: 14 },
  { left: "20%", delay: "0.8s", dur: "2.6s", size: 10 },
  { left: "33%", delay: "1.6s", dur: "3.6s", size: 16 },
  { left: "46%", delay: "0.3s", dur: "2.9s", size: 12 },
  { left: "59%", delay: "1.1s", dur: "3.4s", size: 9 },
  { left: "71%", delay: "2.0s", dur: "2.7s", size: 15 },
  { left: "84%", delay: "0.5s", dur: "3.1s", size: 11 },
  { left: "92%", delay: "1.4s", dur: "3.7s", size: 13 },
];

export default function SkiLoader({ label = "רגע, מכינים את החופשה…" }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative" style={{ background: "var(--ink)" }} dir="rtl">
      <style>{`
        @keyframes ski-fall { 0% { transform: translateY(-30px); opacity: 0 } 10% { opacity: .9 } 100% { transform: translateY(105vh); opacity: 0 } }
        @keyframes ski-slide { 0%,100% { transform: translateX(-12px) rotate(-8deg) } 50% { transform: translateX(12px) rotate(6deg) } }
        @keyframes ski-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
      `}</style>

      {FLAKES.map((f, i) => (
        <span key={i} className="absolute top-0 select-none" style={{ left: f.left, fontSize: f.size, color: "var(--gold-line)", animation: `ski-fall ${f.dur} linear ${f.delay} infinite` }}>❄</span>
      ))}

      <div className="relative z-10 flex flex-col items-center">
        <div className="text-6xl" style={{ animation: "ski-slide 1.1s ease-in-out infinite" }}>⛷️</div>
        <div className="mt-6 h-[3px] w-40 overflow-hidden rounded-full" style={{ background: "var(--ink-line)" }}>
          <div className="h-full w-1/2 rounded-full" style={{ background: "linear-gradient(90deg, var(--gold-deep), var(--gold))", animation: "ski-slide 1.1s ease-in-out infinite" }} />
        </div>
        <p className="font-display mt-5 text-base" style={{ color: "var(--ivory)", animation: "ski-bob 1.6s ease-in-out infinite" }}>{label}</p>
      </div>
    </div>
  );
}
