// Fun-but-clean skier avatar (no photo) — head with beanie + ski goggles.
export default function SkierAvatar({ size = 72 }: { size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center shadow-inner"
      style={{ width: size, height: size, background: "linear-gradient(145deg,#2563eb,#0b1f3a)" }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none">
        {/* face */}
        <circle cx="24" cy="26" r="13" fill="#f4c9a0" />
        {/* beanie */}
        <path d="M11 22a13 13 0 0 1 26 0z" fill="#ef4444" />
        <rect x="10" y="20" width="28" height="5" rx="2.5" fill="#fff" />
        <circle cx="24" cy="9" r="2.6" fill="#fff" />
        {/* goggles */}
        <rect x="14" y="24" width="20" height="9" rx="4.5" fill="#0b1f3a" />
        <rect x="16" y="26" width="7.5" height="5" rx="2.5" fill="#7dd3fc" />
        <rect x="24.5" y="26" width="7.5" height="5" rx="2.5" fill="#38bdf8" />
        {/* smile */}
        <path d="M20 36q4 3 8 0" stroke="#b06b43" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}
