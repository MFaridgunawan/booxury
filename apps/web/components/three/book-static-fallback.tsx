export function BookStaticFallback({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const dark = theme === 'dark';
  return (
    <div
      className="flex h-full w-full items-center justify-center pointer-events-none"
      style={{ background: dark ? '#0a0a0a' : 'linear-gradient(135deg, #fbfaf7 0%, #f0eee8 58%, #dfddd6 100%)' }}
    >
      <svg viewBox="0 0 120 160" width={180} height={240} className="drop-shadow-2xl" aria-hidden="true">
        <rect x="15" y="10" width="90" height="140" rx="4" fill={dark ? '#2a2520' : '#f5f1e9'} stroke={dark ? '#5a5040' : '#c4c1b9'} />
        <rect x="15" y="10" width="14" height="140" fill={dark ? '#1a1815' : '#dfddd6'} />
        <text x="60" y="85" textAnchor="middle" fill={dark ? '#c8b89a' : '#171717'} fontSize="10" fontFamily="serif">
          BOOXURY
        </text>
        <rect x="25" y="30" width="70" height="2" fill={dark ? '#c89a3a' : '#9a743a'} opacity="0.75" />
        <rect x="25" y="40" width="70" height="2" fill={dark ? '#8a7a60' : '#171717'} opacity="0.35" />
        <path d="M84 106c-2 11 3 19 1 29l3 5 3-5c-2-10 3-18 1-29H84Z" fill={dark ? '#8c3f33' : '#8c2f33'} />
      </svg>
    </div>
  );
}
