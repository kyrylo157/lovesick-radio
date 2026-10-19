type P = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const PlayIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.2-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" fill="currentColor" />
  </svg>
);

export const PauseIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <rect x="6" y="5" width="4.5" height="14" rx="1.6" fill="currentColor" />
    <rect x="13.5" y="5" width="4.5" height="14" rx="1.6" fill="currentColor" />
  </svg>
);

export const NextIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M5 6.3v11.4a1 1 0 0 0 1.6.8l8-5.7a1 1 0 0 0 0-1.6l-8-5.7A1 1 0 0 0 5 6.3z" fill="currentColor" />
    <rect x="16.5" y="5" width="3" height="14" rx="1.4" fill="currentColor" />
  </svg>
);

export const PrevIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden style={{ transform: "scaleX(-1)" }}>
    <path d="M5 6.3v11.4a1 1 0 0 0 1.6.8l8-5.7a1 1 0 0 0 0-1.6l-8-5.7A1 1 0 0 0 5 6.3z" fill="currentColor" />
    <rect x="16.5" y="5" width="3" height="14" rx="1.4" fill="currentColor" />
  </svg>
);

export const ShuffleIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M3 7h3.5c4.5 0 6.5 10 11 10H21M3 17h3.5c1.6 0 2.8-1.2 3.9-2.8M14 9.6C15 8.1 16.2 7 17.5 7H21M18 4l3 3-3 3M18 14l3 3-3 3" />
  </svg>
);

export const RepeatIcon = ({ className, one }: P & { one?: boolean }) => (
  <svg {...base} className={className}>
    <path d="M17 3l3 3-3 3M4 12v-1a5 5 0 0 1 5-5h11M7 21l-3-3 3-3M20 12v1a5 5 0 0 1-5 5H4" />
    {one && <path d="M11.5 10.5l1.2-.8v4.6" strokeWidth={2} />}
  </svg>
);

export const VolumeIcon = ({ className, muted }: P & { muted?: boolean }) => (
  <svg {...base} className={className}>
    <path d="M4 9.5h3l5-4v13l-5-4H4z" fill="currentColor" />
    {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />}
  </svg>
);

export const QueueIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 6h12M4 11h12M4 16h7M17 14v6M14 17h6" />
  </svg>
);

export const PlusIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SearchIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5L20 20" />
  </svg>
);

export const HomeIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    {/* домик-склеп с крестиком */}
    <path d="M4 20V10l8-6 8 6v10z" />
    <path d="M12 11v6M9.5 13.5h5" />
  </svg>
);

export const LibraryIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    {/* гробик */}
    <path d="M9 3h6l3 5-2 13H8L6 8z" />
    <path d="M12 8v6M10 10h4" />
  </svg>
);

export const CloseIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ExternalIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

export const MoonIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </svg>
);

export const TrashIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);
