// Loading screen: the mountain mark, a moving bar and a short line.
export default function SkiLoader({ label = "רגע, מכינים את החופשה…" }: { label?: string }) {
  return (
    <div className="flex-1 min-h-[60vh] w-full flex flex-col items-center justify-center bg-white" dir="rtl" role="status" aria-live="polite">
      <style>{`
        @keyframes ski-bar { 0% { transform: translateX(110%) } 100% { transform: translateX(-210%) } }
        @keyframes ski-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
        @media (prefers-reduced-motion: reduce) { .ski-anim { animation: none !important } }
      `}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/skishare-mark.png" alt="" aria-hidden="true" className="ski-anim h-10 w-auto opacity-90"
        style={{ animation: "ski-float 1.6s ease-in-out infinite" }} />
      <div className="mt-5 h-1.5 w-40 rounded-full bg-soft-2 overflow-hidden">
        <div className="ski-anim h-full w-1/2 rounded-full bg-accent" style={{ animation: "ski-bar 1.2s ease-in-out infinite" }} />
      </div>
      <p className="mt-4 text-[15px] font-medium text-muted">{label}</p>
    </div>
  );
}
