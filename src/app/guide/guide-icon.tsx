/* The icon of a guide, picked by the emoji the guide has in lib/guides.ts
   (the site shows line icons, not emoji). */
const PATHS: Record<string, React.ReactNode> = {
  mountain: <><path d="M3 20l6-10 4 6 2-3 6 7z" /><path d="M9 10l2-3 2 3" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="M8 14h2M14 14h2M8 17h2" /></>,
  plane: <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />,
  ticket: <><path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2z" /><path d="M12 7v2M12 11v2M12 15v2" /></>,
  family: <><circle cx="8" cy="7" r="2.5" /><circle cx="16" cy="7" r="2.5" /><circle cx="12" cy="13" r="2" /><path d="M3.5 19a4.5 4.5 0 0 1 9 0M11.5 19a4.5 4.5 0 0 1 9 0" /></>,
  glass: <><path d="M7 3h10l-1 7a4 4 0 0 1-8 0z" /><path d="M12 14v6M8 21h8" /></>,
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  route: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" /></>,
  compare: <><path d="M12 3v18M5 21h14" /><path d="M5 7l-3 6a3 3 0 0 0 6 0z" /><path d="M19 7l-3 6a3 3 0 0 0 6 0z" /><path d="M5 7h14" /></>,
};

const BY_EMOJI: Record<string, string> = {
  "🏔️": "mountain", "📅": "calendar", "✈️": "plane", "🎫": "ticket", "👨‍👩‍👧‍👦": "family",
  "🍻": "glass", "🏠": "home", "☀️": "sun", "⛷️": "route", "⚖️": "compare",
};

export default function GuideIcon({ emoji, size = 24 }: { emoji: string; size?: number }) {
  const path = PATHS[BY_EMOJI[emoji] ?? "mountain"];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
  );
}
