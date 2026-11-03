import { useId } from 'react'
import { DEFAULT_GARAGE, option } from './avatarParts.js'

// The player's car from the garage (avatarParts.js), side view facing right. Each model is a body outline, its
// windows and where the wheels sit; paint and rims are drawn on top. The wheels spin as the car rolls in.
const MODELS = {
  hatch: {
    body: 'M16 88 L14 56 Q16 34 40 31 L118 29 Q136 29 150 40 L172 56 L226 61 Q242 64 244 76 L244 88 Z',
    glass: 'M36 54 L39 38 Q42 35 60 35 L116 34 Q130 35 142 44 L158 55 Z', pillar: 98,
    wheels: [58, 202], r: 16, head: [236, 66], tail: [16, 58],
  },
  coupe: {
    body: 'M12 88 L14 68 Q20 59 48 57 L84 55 Q104 34 132 32 L160 32 Q180 34 196 52 L232 58 Q248 62 248 76 L248 88 Z',
    glass: 'M92 55 Q108 38 132 37 L158 37 Q174 39 186 55 Z', pillar: 142,
    wheels: [58, 208], r: 16, head: [240, 62], tail: [13, 64],
  },
  van: {
    body: 'M12 88 L12 28 Q12 16 26 16 L176 16 Q190 16 200 28 L224 56 Q246 60 248 74 L248 88 Z',
    glass: 'M178 24 L198 52 L170 52 L170 24 Z', pillar: null, stripe: 'M14 64 L244 64',
    wheels: [54, 208], r: 17, head: [240, 62], tail: [13, 32],
  },
  pickup: {
    body: 'M10 88 L10 56 L104 56 L106 30 Q108 23 117 23 L158 23 Q170 23 179 36 L191 56 L230 60 Q246 62 248 76 L248 88 Z',
    glass: 'M114 52 L114 29 L156 29 Q164 29 170 39 L178 52 Z', pillar: null, bed: 'M14 56 L100 56 L100 62 L14 62 Z',
    wheels: [52, 206], r: 19, head: [240, 64], tail: [11, 60],
  },
  muscle: {
    body: 'M8 88 L8 64 Q10 57 30 55 L74 52 Q96 34 120 33 L150 33 Q166 34 178 50 L238 55 Q250 57 250 70 L250 88 Z',
    glass: 'M84 52 Q100 38 120 38 L148 38 Q160 39 168 52 Z', pillar: 128, stripe: 'M10 62 L248 62', scoop: 'M196 51 L222 52 L218 46 L200 46 Z',
    wheels: [56, 210], r: 17, head: [244, 60], tail: [9, 60],
  },
  sports: {
    body: 'M10 88 L12 68 Q18 61 40 59 L90 51 Q116 37 140 37 L160 38 Q176 41 196 55 L240 65 Q252 69 250 80 L248 88 Z',
    glass: 'M100 51 Q120 41 140 41 L158 42 Q170 45 182 55 Z', pillar: null, spoiler: 'M6 52 L40 52 L40 56 L22 58 L22 62 L16 62 L16 58 L8 57 Z',
    wheels: [62, 206], r: 16, head: [242, 70], tail: [11, 66],
  },
}

const RIMS = {
  stock: { fill: '#8a8f99', spoke: '#5b606a' },
  sport: { fill: '#2a2d36', spoke: '#ff5a1f' },
  chrome: { fill: '#e6eaf0', spoke: '#9aa2ae' },
  gold: { fill: '#ffb21a', spoke: '#b86e00' },
}

function Wheel({ x, cy, r, rim }) {
  return (
    <g>
      <circle cx={x} cy={cy} r={r + 4} fill="#101216" />
      <circle cx={x} cy={cy} r={r} fill="#16181d" stroke="#2a2d34" strokeWidth="2" />
      <g className="ar-car-wheel">
        <circle cx={x} cy={cy} r={r * 0.6} fill={rim.fill} />
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} d={`M${x} ${cy} L${x} ${cy - r * 0.58}`} stroke={rim.spoke} strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${a} ${x} ${cy})`} />
        ))}
        <circle cx={x} cy={cy} r={r * 0.16} fill={rim.spoke} />
      </g>
    </g>
  )
}

export default function Car({ garage, className = '', title }) {
  const g = { ...DEFAULT_GARAGE, ...(garage || {}) }
  const id = useId().replace(/:/g, '')
  const m = MODELS[option('car', g.car).id]
  const paint = option('paint', g.paint)
  const rim = RIMS[option('wheels', g.wheels).id]
  const fill = paint.id === 'chrome' || paint.id === 'chameleon' ? `url(#${id}-paint)` : paint.color
  const cy = 102 - m.r
  return (
    <svg
      className={`ar-car ${className}`} viewBox="0 0 260 110"
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`${id}-paint`} x1="0" y1="0" x2="0" y2="1">
          {paint.id === 'chrome' ? (
            <><stop offset="0" stopColor="#f4f6f9" /><stop offset=".45" stopColor="#9aa2ae" /><stop offset=".55" stopColor="#5d6470" /><stop offset="1" stopColor="#c9ced6" /></>
          ) : (
            <><stop offset="0" stopColor="#ff7a33" /><stop offset=".5" stopColor="#c6a03a" /><stop offset="1" stopColor="#1fb5ad" /></>
          )}
        </linearGradient>
      </defs>
      <ellipse cx="130" cy="103" rx="122" ry="6" fill="#000" opacity=".28" />
      <g className="ar-car-body">
        {m.spoiler && <path d={m.spoiler} fill="#15171c" />}
        <path d={m.body} fill={fill} />
        <path d={m.body} fill="none" stroke="#000" strokeOpacity=".25" strokeWidth="1.5" />
        {m.bed && <path d={m.bed} fill="#000" opacity=".3" />}
        {m.stripe && <path d={m.stripe} stroke="#fff" strokeWidth="4" opacity=".55" />}
        {m.scoop && <path d={m.scoop} fill="#15171c" />}
        <path d={m.glass} fill="#1b2230" />
        <path d={m.glass} fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.5" />
        {m.pillar && <path d={`M${m.pillar} 30 L${m.pillar} 58`} stroke={fill} strokeWidth="5" />}
        <path d="M30 78 L232 78" stroke="#000" strokeOpacity=".18" strokeWidth="1.5" />
        <rect x={m.head[0] - 5} y={m.head[1]} width="10" height="6" rx="2" fill="#fff4cf" />
        <rect x={m.tail[0] - 1} y={m.tail[1]} width="6" height="8" rx="2" fill="#ff3b1f" />
      </g>
      {m.wheels.map((x) => <Wheel key={x} x={x} cy={cy} r={m.r} rim={rim} />)}
    </svg>
  )
}
