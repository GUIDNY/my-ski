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
  bag: <><path d="M10 6V4.5a2 2 0 0 1 4 0V6" /><rect x="5.5" y="6" width="13" height="15" rx="4" /><rect x="8.5" y="13" width="7" height="5" rx="1.5" /><path d="M8.5 15.5h7" /></>,
  skis: <><path d="M4 21 15.5 4.2a1.6 1.6 0 0 1 2.6 1.6" /><path d="M8.5 21.5 19.6 7.4a1.6 1.6 0 0 1 2.4 1.9" /><path d="M8.6 13.6l2.2 1.6M12 15.4l2.2 1.6" /></>,
  group: <><circle cx="12" cy="7.5" r="2.5" /><circle cx="5.5" cy="9.5" r="2" /><circle cx="18.5" cy="9.5" r="2" /><path d="M7.5 19a4.5 4.5 0 0 1 9 0" /><path d="M2 18a3.5 3.5 0 0 1 5.2-3" /><path d="M22 18a3.5 3.5 0 0 0-5.2-3" /></>,
  // a Hanukkah menorah: the middle stem, two pairs of arms, a flame on each
  menorah: <><path d="M12 6v13M8 21h8M12 19v2" /><path d="M5 8v3a7 7 0 0 0 14 0V8" /><path d="M8.5 8v3a3.5 3.5 0 0 0 7 0V8" /><path d="M5 4.5v1M8.5 4.5v1M12 2.5v1M15.5 4.5v1M19 4.5v1" /></>,
  // the spring sun behind a cloud (Pesach)
  cloudSun: <><path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41" /><path d="M15.95 12.65a4 4 0 0 0-5.93-4.13" /><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6z" /></>,
};

const BY_EMOJI: Record<string, string> = {
  "🏔️": "mountain", "📅": "calendar", "✈️": "plane", "🎫": "ticket", "👨‍👩‍👧‍👦": "family",
  "🍻": "glass", "🏠": "home", "☀️": "sun", "⛷️": "route", "⚖️": "compare", "👥": "group", "🎒": "bag", "🎿": "skis", "🕎": "menorah", "🌤️": "cloudSun",
};

export default function GuideIcon({ emoji, size = 24 }: { emoji: string; size?: number }) {
  const path = PATHS[BY_EMOJI[emoji] ?? "mountain"];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
  );
}
