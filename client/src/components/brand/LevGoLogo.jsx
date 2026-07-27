export function LevGoMark({ size = 42 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="LevGo"
      className="brand-mark"
    >
      <defs>
        <linearGradient id="levgo-cyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#20c3d9" />
          <stop offset="1" stopColor="#1688bd" />
        </linearGradient>
        <linearGradient id="levgo-magenta" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b83e79" />
          <stop offset="1" stopColor="#71306f" />
        </linearGradient>
      </defs>
      <path d="M7 9 32 23 7 38Z" fill="url(#levgo-cyan)" />
      <path d="m57 9-25 14 25 15Z" fill="url(#levgo-magenta)" />
      <path d="m7 38 25-15v34Z" fill="#192e72" />
      <path d="m57 38-25-15v34Z" fill="#492575" />
    </svg>
  );
}

export function LevGoLogo({ compact = false }) {
  return (
    <span className="brand-lockup">
      <LevGoMark size={compact ? 34 : 42} />
      <span className="brand-word">
        Lev<span>Go</span>
      </span>
    </span>
  );
}

