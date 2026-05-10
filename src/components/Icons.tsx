type P = { size?: number; className?: string };
const ic = (d: string, opts?: { fill?: boolean }) =>
  ({ size = 20, className = "" }: P) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={opts?.fill ? "currentColor" : "none"}
      stroke={opts?.fill ? "none" : "currentColor"} strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d}/>
    </svg>
  );

export const IconMountain  = ic("m8 3 4 8 5-5 5 15H2L8 3z");
export const IconSnowflake = ({ size = 20, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
    <polyline points="10 6 12 2 14 6"/><polyline points="10 18 12 22 14 18"/>
    <polyline points="6 10 2 12 6 14"/><polyline points="18 10 22 12 18 14"/>
    <polyline points="16.24 7.76 18 12 16.24 16.24"/><polyline points="7.76 7.76 6 12 7.76 16.24"/>
  </svg>
);
export const IconSkis = ({ size = 20, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="17" cy="4" r="1.5"/><path d="M9.5 12.5 8 9l4.5-2L14 10"/><path d="M14 10 9.5 12.5l-5.5 8.5 14 1 2-3-8.5-1 2.5-4 5 2 .5-2.5-5.5-3.5z"/>
  </svg>
);
export const IconBus = ({ size = 20, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
    <path d="M18 18h3s.5-1.7.8-4.3c.3-2.7.2-6.7.2-6.7H2s-.1 4 .2 6.7C2.5 16.3 3 18 3 18h3"/>
    <circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
  </svg>
);
export const IconPlane = ({ size = 20, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2l-2 2 7.5 3.5L7.8 14l-1.4 1.4-.7 2.1 2.1-.7 1.4-1.4 3.5 7.5z"/>
  </svg>
);
export const IconShield = ic("M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z");
export const IconUser   = ({ size = 20, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
export const IconBot = ({ size = 20, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>
    <line x1="8" y1="16" x2="8" y2="16.01"/><line x1="16" y1="16" x2="16" y2="16.01"/>
  </svg>
);
export const IconHome = ({ size = 20, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
export const IconDiamond = ({ size = 20, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/>
  </svg>
);
export const IconCheck = ({ size = 16, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
export const IconStar = ({ size = 14, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
export const IconCalendar = ({ size = 18, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
export const IconChevronLeft = ({ size = 16, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
export const IconPlus  = ic("M12 5v14M5 12h14");
export const IconMinus = ic("M5 12h14");
export const IconX     = ic("M18 6 6 18M6 6l12 12");
export const IconInfo  = ({ size = 16, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
  </svg>
);
export const IconWifi = ic("M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01");
export const IconFire = ic("M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z");
export const IconParking = ({ size = 16, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
  </svg>
);
export const IconBed = ({ size = 16, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 4v16M2 8h20v12H2M2 8a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5"/>
    <path d="M6 8v5M2 13h20"/>
  </svg>
);
export const IconSearch = ({ size = 18, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
