/*
  Оригинальные маскоты Lovesick Radio (не PvZ и не Pou — свои, по мотивам референсов).
  Зомбик — малыш с приоткрытым мозгом, держит надкусанное сердце.
  Мышь-капля — сонная чёрная капля с крыльями на розовой подушке.
*/

type Props = { className?: string; title?: string };

export function ZombieKid({ className, title = "Зомбик с сердечком" }: Props) {
  return (
    <svg viewBox="0 0 200 230" className={className} role="img" aria-label={title}>
      <g stroke="var(--outline)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        {/* тело */}
        <path d="M62 150c-6 30-4 58 6 66h64c10-8 12-36 6-66z" fill="var(--zombie-deep)" />
        <path d="M80 216v8M120 216v8" />
        {/* голова */}
        <path
          d="M100 18c48 0 80 30 80 72 0 40-32 66-80 66S20 130 20 90c0-42 32-72 80-72z"
          fill="var(--zombie)"
        />
        {/* мозг, торчащий из макушки */}
        <path
          d="M112 26c6-12 26-14 36-6 12-2 22 8 20 20 6 8 2 20-8 22-20 4-44 2-52-8-6-8-2-22 4-28z"
          fill="#f6c9d9"
        />
        <path d="M122 36c6 2 8 8 4 12M142 30c-2 8 4 12 10 12M150 52c-6-2-12 2-12 8" strokeWidth="3.5" fill="none" />
        {/* шов */}
        <path d="M34 72l18 8M40 66l-4 12M48 70l-4 12" strokeWidth="3.5" />
        {/* глаза */}
        <ellipse cx="70" cy="98" rx="17" ry="21" fill="var(--outline)" />
        <ellipse cx="132" cy="98" rx="17" ry="21" fill="var(--outline)" />
        {/* рот-шовчик */}
        <path d="M88 134q12 6 24 0" fill="none" strokeWidth="4" />
        <path d="M94 131v8M106 131v8" strokeWidth="3" />
        {/* ручки + надкусанное сердце */}
        <path
          d="M100 196c-30-14-40-30-32-42 6-9 20-8 32 4 12-12 26-13 32-4 2 3 3 7 2 11-6-2-12 2-11 8-5 0-9 5-7 10-6 6-12 10-16 13z"
          fill="var(--bubblegum)"
        />
        <path d="M56 172c4 6 10 8 16 6M144 172c-4 6-10 8-16 6" fill="var(--zombie)" />
      </g>
      <circle cx="76" cy="90" r="4.5" fill="var(--bone)" />
      <circle cx="138" cy="90" r="4.5" fill="var(--bone)" />
      <circle cx="56" cy="118" r="7" fill="var(--bubblegum)" opacity=".45" />
      <circle cx="148" cy="118" r="7" fill="var(--bubblegum)" opacity=".45" />
    </svg>
  );
}

export function BatBlob({ className, title = "Сонная мышь-капля" }: Props) {
  return (
    <svg viewBox="0 0 220 180" className={className} role="img" aria-label={title}>
      <g stroke="var(--outline)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        {/* подушка */}
        <path d="M30 150c20-14 140-14 160 0 6 8-4 20-80 20S24 158 30 150z" fill="var(--bone)" />
        <path d="M34 154c30 10 122 10 152 0" fill="none" stroke="var(--raspberry)" strokeWidth="5" />
        {/* крылья */}
        <g style={{ transformOrigin: "70px 95px", animation: "wing-flap 2.4s ease-in-out infinite" }}>
          <path d="M70 95C52 70 26 66 8 76c10 6 12 14 8 22 10-2 18 2 20 10 8-6 18-6 26 2z" fill="#221019" />
        </g>
        <g style={{ transformOrigin: "150px 95px", animation: "wing-flap 2.4s ease-in-out infinite reverse" }}>
          <path d="M150 95c18-25 44-29 62-19-10 6-12 14-8 22-10-2-18 2-20 10-8-6-18-6-26 2z" fill="#221019" />
        </g>
        {/* тело-капля с ушками */}
        <path
          d="M110 30c-10 0-18 4-24 10l-8-16-6 26c-14 16-22 40-22 64 0 26 24 42 60 42s60-16 60-42c0-24-8-48-22-64l-6-26-8 16c-6-6-14-10-24-10z"
          fill="#0b0508"
        />
        {/* сонные глаза: веки наполовину */}
        <circle cx="90" cy="88" r="15" fill="#f6c9d9" stroke="#b86a3c" strokeWidth="3" />
        <circle cx="130" cy="88" r="15" fill="#f6c9d9" stroke="#b86a3c" strokeWidth="3" />
        <circle cx="92" cy="92" r="4.5" fill="var(--outline)" stroke="none" />
        <circle cx="128" cy="92" r="4.5" fill="var(--outline)" stroke="none" />
        <path d="M74 84q16-8 32 0M114 84q16-8 32 0" fill="none" stroke="#b86a3c" strokeWidth="3" />
        {/* ухмылка с клычком */}
        <path d="M100 116q10 6 22-2" fill="none" stroke="#b86a3c" strokeWidth="3.5" />
        <path d="M106 118l3 7 3-6" fill="var(--bone)" stroke="var(--bone)" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

/**
 * Череп со скрещёнными костями — фирменный значок (бабл из третьего референса).
 * Глаза и нос вырезаны цветом `--skull-face` (по умолчанию — цвет кости), зубки — им же.
 */
export function SkullHeart({ className, title }: Props) {
  const face = "var(--skull-face, var(--bone))";
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <path d="M10 46l44 12M10 58l44-12" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <circle cx="9" cy="44" r="4" fill="currentColor" />
      <circle cx="9" cy="58" r="4" fill="currentColor" />
      <circle cx="55" cy="44" r="4" fill="currentColor" />
      <circle cx="55" cy="58" r="4" fill="currentColor" />
      <path
        d="M32 4c-13 0-22 9-22 20 0 7 3 11 7 13v6h30v-6c4-2 7-6 7-13 0-11-9-20-22-20z"
        fill="currentColor"
      />
      {/* глазницы: чуть грустные, с бликами — мило, а не страшно */}
      <ellipse cx="23.5" cy="23" rx="6" ry="6.5" fill={face} />
      <ellipse cx="40.5" cy="23" rx="6" ry="6.5" fill={face} />
      <circle cx="24.5" cy="24" r="3" fill="currentColor" />
      <circle cx="39.5" cy="24" r="3" fill="currentColor" />
      <circle cx="25.6" cy="22.6" r="1.1" fill={face} />
      <circle cx="40.6" cy="22.6" r="1.1" fill={face} />
      {/* нос-сердечко */}
      <path d="M32 31.5c-.8-1.6-3.4-1.3-3.4.4 0 1.6 3.4 3.6 3.4 3.6s3.4-2 3.4-3.6c0-1.7-2.6-2-3.4-.4z" fill={face} />
      {/* зубки */}
      <path d="M26 38.5h12M28.5 37.5v4M32 37.5v4M35.5 37.5v4" stroke={face} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Heart({ className, filled = true }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 21s-7.5-4.6-9.6-9.4C1 8.3 3 4.5 6.7 4.5c2.1 0 3.5 1.1 4.3 2.4.8-1.3 2.2-2.4 4.3-2.4 3.7 0 5.7 3.8 4.3 7.1C19.5 16.4 12 21 12 21z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Bone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 16" className={className} aria-hidden>
      <path
        d="M8 2a4 4 0 0 0-3 6.8A4 4 0 1 0 11 12h18a4 4 0 1 0 6-3.2A4 4 0 1 0 29 4H11a4 4 0 0 0-3-2z"
        fill="currentColor"
      />
    </svg>
  );
}
