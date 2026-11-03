// Brand mark: code braces on a dark tile with a blinking gradient cursor.
export function LogoMark({ size = 32 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="logo-cursor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5a1f" />
          <stop offset="1" stopColor="#ffb21a" />
        </linearGradient>
      </defs>
      <rect className="logo-tile" x="2" y="2" width="60" height="60" rx="16" />
      <g fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 16c-5 0-5 4-5 8s-1.5 8-5 8c3.5 0 5 3 5 8s0 8 5 8" />
        <path d="M40 16c5 0 5 4 5 8s1.5 8 5 8c-3.5 0-5 3-5 8s0 8-5 8" />
      </g>
      <rect className="logo-blink" x="28.5" y="24" width="7" height="16" rx="2" fill="url(#logo-cursor)" />
    </svg>
  )
}

export default function Logo() {
  return (
    <>
      <LogoMark />
      <span className="logo-word">
        syntacks<span className="logo-blink">_</span>
      </span>
    </>
  )
}
