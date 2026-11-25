/*
 * Line icons for the equipment page (instead of emoji): skis, a snowboard,
 * a helmet, boots, a pin and a star. They follow the text color.
 */
type P = { size?: number; className?: string };
const svg = (path: React.ReactNode, { size = 24, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{path}</svg>
);

/** a pair of crossed skis */
export const IconSkiPair = (p: P) => svg(<>
  <rect x="10.9" y="1.5" width="2.2" height="21" rx="1.1" transform="rotate(28 12 12)" />
  <rect x="10.9" y="1.5" width="2.2" height="21" rx="1.1" transform="rotate(-28 12 12)" />
</>, p);

/** a snowboard with its two bindings */
export const IconSnowboard = (p: P) => svg(
  <g transform="rotate(38 12 12)">
    <rect x="9" y="1.5" width="6" height="21" rx="3" />
    <path d="M9.6 8.5h4.8M9.6 15.5h4.8" />
  </g>, p);

/** a ski helmet with goggles */
export const IconHelmet = (p: P) => svg(<>
  <path d="M4 15a8 8 0 0 1 16 0v1H4z" /><path d="M7 15.5h10v2.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 18z" />
  <path d="M12 7v3" />
</>, p);

/** a ski boot */
export const IconBoot = (p: P) => svg(<>
  <path d="M8 3h6l1 9 4 3v4H5v-4l2-1z" /><path d="M8 7h6M8 10.5h6.5" /><path d="M5 19v1.5h14V19" />
</>, p);

export const IconPin = (p: P) => svg(<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>, p);

export const IconStar = ({ size = 18, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#E8A317" aria-hidden="true" className={className}>
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" />
  </svg>
);
