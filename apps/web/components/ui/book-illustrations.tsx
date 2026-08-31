/**
 * Book illustration primitives — pure SVG, no JS, no Framer Motion.
 * Used across landing, customize, and wizard pages.
 *
 * Filter (drop-shadow) applied inline because Tailwind's drop-shadow utilities
 * don't work on SVG elements.
 */

const BOOK_FILTER =
  'drop-shadow(0 8px 20px rgba(100,80,50,0.20)) drop-shadow(0 2px 6px rgba(100,80,50,0.10))';

const RIBBON = '#8c2f33';
const COVER = '#f0ebe0';
const GOLD = '#b8962e';
const GHOST = '#1e1a14';

type BookProps = { className?: string };

export function BookFlat({ className = '' }: BookProps) {
  return (
    <svg viewBox="0 0 110 150" className={className} aria-hidden="true" style={{ filter: BOOK_FILTER }}>
      <ellipse cx="55" cy="144" rx="40" ry="6" fill="rgba(80,65,40,0.13)" />
      <g transform="skewY(-2)">
        <rect x="12" y="14" width="82" height="120" rx="3" fill="rgba(0,0,0,0.08)" />
        <rect x="10" y="12" width="82" height="120" rx="3" fill={COVER} stroke="#c8c0b0" strokeWidth="1" />
        <rect x="10" y="12" width="12" height="120" rx="3" fill="#e0d9cc" />
        <rect x="20" y="12" width="1.5" height="120" fill="rgba(0,0,0,0.07)" />
        <rect x="25" y="38" width="56" height="1.5" rx="0.75" fill={GOLD} opacity="0.65" />
        <rect x="25" y="42" width="38" height="1" rx="0.5" fill={GOLD} opacity="0.40" />
        <text x="53" y="84" textAnchor="middle" fill={GHOST} fontSize="10" fontFamily="Georgia, serif" fontWeight="bold" letterSpacing="1.5">BOOXURY</text>
        <path d="M75 12 L75 60 L83 52 L91 60 L91 12 Z" fill={RIBBON} />
        <path d="M75 52 L83 52" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      </g>
    </svg>
  );
}

export function BookOpen({ className = '' }: BookProps) {
  const lineYs = [22, 32, 44, 56, 68, 80, 92];
  return (
    <svg viewBox="0 0 150 130" className={className} aria-hidden="true" style={{ filter: BOOK_FILTER }}>
      <ellipse cx="75" cy="126" rx="58" ry="5" fill="rgba(80,65,40,0.12)" />
      <path d="M12 18 Q36 10 75 14 L75 120 Q36 116 12 124 Z" fill="#e8e0d0" />
      <path d="M138 18 Q114 10 75 14 L75 120 Q114 116 138 124 Z" fill="#e8e0d0" />
      <path d="M14 16 Q36 8 75 12 L75 118 Q36 114 14 122 Z" fill="#f4eedf" stroke="#ccc4b4" strokeWidth="1" />
      <path d="M136 16 Q114 8 75 12 L75 118 Q114 114 136 122 Z" fill="#f4eedf" stroke="#ccc4b4" strokeWidth="1" />
      <path d="M75 12 L75 118" stroke="#c0b8a8" strokeWidth="1.5" />
      <path d="M75 12 Q62 14 55 20 L55 110 Q62 116 75 118" fill="rgba(0,0,0,0.04)" />
      <path d="M75 12 Q88 14 95 20 L95 110 Q88 116 75 118" fill="rgba(0,0,0,0.04)" />
      {lineYs.map((y) => (
        <path key={`l${y}`} d={`M22 ${y} Q40 ${y - 1} 70 ${y + 1}`} stroke={GOLD} strokeWidth="0.9" fill="none" opacity="0.28" />
      ))}
      {lineYs.map((y) => (
        <path key={`r${y}`} d={`M128 ${y} Q110 ${y - 1} 80 ${y + 1}`} stroke={GOLD} strokeWidth="0.9" fill="none" opacity="0.28" />
      ))}
    </svg>
  );
}

export function BookCover({ className = '' }: BookProps) {
  return (
    <svg viewBox="0 0 120 140" className={className} aria-hidden="true" style={{ filter: BOOK_FILTER }}>
      <ellipse cx="60" cy="136" rx="44" ry="5" fill="rgba(80,65,40,0.13)" />
      <rect x="14" y="14" width="92" height="118" rx="2" fill="rgba(0,0,0,0.10)" />
      <rect x="12" y="12" width="96" height="118" rx="2" fill={COVER} stroke="#d4cfc6" strokeWidth="0.8" />
      <rect x="20" y="20" width="80" height="102" rx="1.5" fill="none" stroke="#d4cfc6" strokeWidth="0.5" />
      <rect x="30" y="46" width="60" height="1" rx="0.5" fill={GOLD} opacity="0.6" />
      <rect x="30" y="50" width="40" height="0.8" rx="0.4" fill={GOLD} opacity="0.4" />
      <text x="60" y="80" textAnchor="middle" dominantBaseline="middle" fill="#8a6e2e" fontSize="9" fontFamily="Georgia, serif" fontWeight="700" letterSpacing="3.5">BOOXURY</text>
      <path d="M76 12 L76 52 L84 44 L92 52 L92 12 Z" fill={RIBBON} />
      <path d="M76 52 L84 44" stroke="rgba(0,0,0,0.14)" strokeWidth="0.8" />
      <path d="M78 14 L78 50" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
    </svg>
  );
}