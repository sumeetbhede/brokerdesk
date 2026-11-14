/** Flat mark: a roof over the letter E. No gradients, so it stays sharp at icon size. */
export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0f0f0f" />
      <g fill="none" stroke="#c2a14e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 29 32 12l21 17" />
        <path d="M43 33H23v19h20M23 42.5h15" />
      </g>
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-medium tracking-tight ${className}`}>
      Estate<span className="text-accent">Pal</span>
    </span>
  );
}
