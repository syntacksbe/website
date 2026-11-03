import { DEFAULT_AVATAR, option } from './avatarParts.js'

// The player's character, drawn as an SVG bust from the parts in avatarParts.js. `crop` shows only the head (the
// header button and the leaderboard). Builds are broad, slim (narrower shoulders) and curvy (slim with a bust line). Shapes are drawn for a standard head (half-width 42, top at y 44) and
// stretched to the chosen face, so hair, hats and beards fit every face shape.

// Mixes a #rrggbb colour toward black (amount > 0) or white (amount < 0).
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const to = amount > 0 ? 0 : 255
  const a = Math.abs(amount)
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (to - v) * a))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

const ellipse = (rx, ry) => `M${100 - rx} 92 A${rx} ${ry} 0 1 0 ${100 + rx} 92 A${rx} ${ry} 0 1 0 ${100 - rx} 92 Z`
const FACES = {
  oval: { hw: 40, top: 44, d: ellipse(40, 48) },
  round: { hw: 44, top: 47, d: ellipse(44, 45) },
  square: { hw: 41, top: 46, d: 'M59 82 Q59 46 100 46 Q141 46 141 82 L141 112 Q141 138 100 140 Q59 138 59 112 Z' },
  long: { hw: 37, top: 41, d: ellipse(37, 51) },
  heart: { hw: 42, top: 44, d: 'M58 86 Q58 44 100 44 Q142 44 142 86 Q142 118 100 140 Q58 118 58 86 Z' },
}

const MIRROR = 'matrix(-1 0 0 1 200 0)'
const SHOULDERS = 'M26 224 Q28 180 68 169 Q84 164 100 164 Q116 164 132 169 Q172 180 174 224 Z'
const INK = '#1c1f26'
const BONE = '#f2efe9'

// Bumps along an arc, for curly hair and the afro.
function curls(cx, cy, r, from, to, size, n) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((from + ((to - from) * i) / (n - 1)) * Math.PI) / 180
    return <circle key={i} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={size} />
  })
}

const SMOOTH = 'M56 86 Q50 38 100 36 Q150 38 144 86 Q140 64 100 60 Q60 64 56 86 Z'

// Hair behind the head (drawn before the face) and in front of it.
function HairBack({ style }) {
  if (style === 'afro') return <><circle cx="100" cy="78" r="60" />{curls(100, 78, 58, 150, 390, 13, 16)}</>
  if (style === 'long') return <path d="M50 84 Q44 30 100 30 Q156 30 150 84 L156 176 Q142 188 128 176 L72 176 Q58 188 44 176 Z" />
  if (style === 'bob') return <path d="M50 84 Q44 30 100 30 Q156 30 150 84 L153 132 Q142 142 130 133 L70 133 Q58 142 47 132 Z" />
  if (style === 'bun') return <circle cx="100" cy="30" r="17" />
  if (style === 'ponytail') return <path d="M134 56 Q176 66 168 128 Q164 152 148 164 Q158 118 138 90 Z" />
  return null
}

function HairFront({ style, light }) {
  switch (style) {
    case 'buzz':
      return <path d="M58 86 Q54 42 100 41 Q146 42 142 86 Q140 64 100 60 Q60 64 58 86 Z" opacity=".75" />
    case 'crop':
      return <path d="M56 88 Q48 34 100 33 Q152 34 144 88 Q142 70 132 63 Q116 68 100 63 Q82 69 68 63 Q58 72 56 88 Z" />
    case 'quiff':
      return (
        <>
          <path d="M56 88 Q50 46 72 32 Q92 14 124 19 Q150 26 148 52 Q148 70 144 88 Q140 68 130 62 Q112 54 92 60 Q70 64 56 88 Z" />
          <path d="M80 34 Q100 22 126 26" fill="none" stroke={light} strokeWidth="3" strokeLinecap="round" opacity=".5" />
        </>
      )
    case 'sidepart':
      return (
        <>
          <path d="M56 90 Q50 35 100 33 Q150 35 144 90 Q140 62 120 57 Q96 55 76 70 Q62 76 56 90 Z" />
          <path d="M76 40 Q78 52 76 66" fill="none" stroke={light} strokeWidth="2" opacity=".45" />
        </>
      )
    case 'curly':
      return <><path d="M57 86 Q52 44 100 42 Q148 44 143 86 Q138 66 100 62 Q62 66 57 86 Z" />{curls(100, 80, 42, 185, 355, 11, 11)}</>
    case 'afro':
      return curls(100, 74, 30, 195, 345, 12, 7)
    case 'bob':
      return <path d="M55 96 Q48 34 100 33 Q152 34 145 96 Q143 74 136 66 Q118 70 100 66 Q82 70 64 66 Q57 74 55 96 Z" />
    case 'long':
      return <path d="M56 94 Q50 35 100 33 Q150 35 144 94 Q138 66 112 58 Q104 72 84 72 Q66 74 56 94 Z" />
    case 'bun':
    case 'ponytail':
      return <path d={SMOOTH} />
    case 'mohawk':
      return (
        <>
          <path d="M58 86 Q54 42 100 41 Q146 42 142 86 Q140 64 100 60 Q60 64 58 86 Z" opacity=".35" />
          <path d="M89 64 Q84 22 100 4 Q116 22 111 64 Q100 58 89 64 Z" />
        </>
      )
    default:
      return null
  }
}

const LASHES = {
  lashes: <path d="M74 89 L70 86 M77 86.5 L74.5 82.5 M81 85 L80 81" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />,
  liner: <path d="M95 91.5 Q84 82 73 91 L66 86.5 L73.5 89 Q84 80.5 95 91.5 Z" fill={INK} />,
}

function Eye({ style, iris, lid, lashes }) {
  const extra = LASHES[lashes] ?? null
  if (style === 'round') return <><circle cx="84" cy="92" r="4.6" fill={INK} /><circle cx="85.6" cy="90.4" r="1.4" fill="#fff" />{extra}</>
  const white = style === 'wide' ? <circle cx="84" cy="92" r="7" fill="#fff" /> : <path d="M73 92 Q84 83 95 92 Q84 99 73 92 Z" fill="#fff" />
  return (
    <>
      {white}
      <circle cx="84" cy="92" r="4.2" fill={iris} />
      <circle cx="84" cy="92" r="2" fill={INK} />
      <circle cx="85.6" cy="90.4" r="1.2" fill="#fff" />
      {style === 'sleepy' && <path d="M71 93 Q84 89 97 93 L97 83 L71 83 Z" fill={lid} />}
      {style !== 'wide' && <path d={style === 'sleepy' ? 'M72 92.6 Q84 89 96 92.6' : 'M73 92 Q84 83 95 92'} fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />}
      {extra}
    </>
  )
}

const BROWS = {
  soft: { d: 'M74 80 Q84 74 94 78', w: 3.4 },
  straight: { d: 'M74 79 L94 77.5', w: 3.6 },
  thick: { d: 'M73 80 Q84 73 95 77', w: 6 },
  arched: { d: 'M74 82 Q82 70 94 76', w: 3.4 },
  focused: { d: 'M74 76 L94 81', w: 4.4 },
}

function Mouth({ style, lips }) {
  if (style === 'grin') {
    return (
      <>
        <path d="M86 117 Q100 136 114 117 Z" fill={shade(lips, 0.3)} stroke={lips} strokeWidth="2" strokeLinejoin="round" />
        <path d="M88 118 Q100 123 112 118 L110.5 121.5 Q100 125 89.5 121.5 Z" fill="#fff" />
      </>
    )
  }
  const d = { smile: 'M88 120 Q100 130 112 120', neutral: 'M90 123 L110 123', smirk: 'M90 124 Q104 126 113 116' }[style]
  return <path d={d} fill="none" stroke={lips} strokeWidth="3.2" strokeLinecap="round" />
}

const MOUSTACHE = 'M84 116 Q92 106 100 112 Q108 106 116 116 Q108 113 100 115 Q92 113 84 116 Z'

function Beard({ style }) {
  if (style === 'stubble') {
    return (
      <g opacity=".3">
        <path d="M58 96 Q60 142 100 146 Q140 142 142 96 Q134 126 114 128 Q100 120 86 128 Q66 126 58 96 Z" />
        <path d="M86 113 Q100 107 114 113 L114 116 Q100 111 86 116 Z" />
      </g>
    )
  }
  if (style === 'full') return <path d="M57 90 Q56 146 100 150 Q144 146 143 90 L136 93 Q134 124 116 128 Q100 119 84 128 Q66 124 64 93 Z" />
  if (style === 'goatee') return <path d="M91 130 Q100 126 109 130 L107 143 Q100 148 93 143 Z" />
  return null
}

function Top({ style, c, d, l, skin }) {
  const neckline = <path d="M86 165 Q100 179 114 165 Z" fill={skin} />
  switch (style) {
    case 'tee':
      return <><path d={SHOULDERS} fill={c} />{neckline}<path d="M85 165 Q100 181 115 165" fill="none" stroke={d} strokeWidth="5" /></>
    case 'hoodie':
      return (
        <>
          <path d={SHOULDERS} fill={c} />
          {neckline}
          <path d="M79 166 Q100 188 121 166" fill="none" stroke={d} strokeWidth="7" strokeLinecap="round" />
          <path d="M93 178 L91 200 M107 178 L109 200" stroke={l} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M74 224 L81 206 L119 206 L126 224" fill="none" stroke={d} strokeWidth="2.5" />
        </>
      )
    case 'polo':
      return (
        <>
          <path d={SHOULDERS} fill={c} />
          <path d="M90 165 Q100 175 110 165 Z" fill={skin} />
          <path d="M83 162 L100 175 L92 184 L78 168 Z M117 162 L100 175 L108 184 L122 168 Z" fill={l} />
          <path d="M100 175 L100 198" stroke={d} strokeWidth="2" />
          <circle cx="100" cy="184" r="1.8" fill={d} /><circle cx="100" cy="192" r="1.8" fill={d} />
        </>
      )
    case 'shirt': {
      const tie = c === '#ff5a1f' ? INK : '#ff5a1f'
      return (
        <>
          <path d={SHOULDERS} fill={c} />
          <path d="M88 165 L100 172 L112 165 Z" fill={skin} />
          <path d="M84 161 L100 172 L90 182 L79 167 Z M116 161 L100 172 L110 182 L121 167 Z" fill={l} />
          <path d="M96 172 L104 172 L108 210 L100 220 L92 210 Z" fill={tie} />
        </>
      )
    }
    case 'blazer':
      return (
        <>
          <path d={SHOULDERS} fill={c} />
          <path d="M85 164 L100 208 L115 164 Z" fill={BONE} />
          <path d="M98 170 L102 170 L104.5 200 L100 207 L95.5 200 Z" fill={INK} />
          <path d="M84 164 L100 208 L89 192 L76 176 Z M116 164 L100 208 L111 192 L124 176 Z" fill={d} />
          <path d="M128 194 L140 194 L134 188 Z" fill="#ffb21a" />
          <circle cx="100" cy="214" r="2.6" fill={d} />
        </>
      )
    case 'track':
      return (
        <>
          <path d={SHOULDERS} fill={c} />
          <path d="M74 170 Q46 182 36 224 M68 170 Q40 184 30 224 M126 170 Q154 182 164 224 M132 170 Q160 184 170 224" fill="none" stroke={BONE} strokeWidth="3.5" />
          <path d="M82 161 Q100 170 118 161 L118 170 Q100 180 82 170 Z" fill={d} />
          <path d="M100 176 L100 224" stroke={d} strokeWidth="3" />
        </>
      )
    case 'leather':
      return (
        <>
          <path d={SHOULDERS} fill={c} />
          <path d="M87 164 L100 190 L113 164 Z" fill={BONE} />
          <path d="M80 163 L100 192 L86 198 L69 172 Z M120 163 L104 190 L115 199 L132 172 Z" fill={d} />
          <path d="M104 192 L118 224" stroke="#c9c3b8" strokeWidth="2" />
          <path d="M44 196 Q52 178 66 172" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".18" />
        </>
      )
    case 'tux':
      return (
        <>
          <path d={SHOULDERS} fill="#15171c" />
          <path d="M84 164 L100 214 L116 164 Z" fill={BONE} />
          <path d="M84 164 L100 214 L91 196 L75 177 Z M116 164 L100 214 L109 196 L125 177 Z" fill="#2c2f38" />
          <path d="M87 169 L100 175 L87 181 Z M113 169 L100 175 L113 181 Z" fill={c} />
          <circle cx="100" cy="175" r="3" fill={d} />
          <circle cx="100" cy="190" r="1.6" fill={INK} /><circle cx="100" cy="200" r="1.6" fill={INK} />
        </>
      )
    default:
      return <path d={SHOULDERS} fill={c} />
  }
}

function Glasses({ style }) {
  const temples = <path d="M72 90 L60 88 M128 90 L140 88" stroke={INK} strokeWidth="2.4" />
  if (style === 'round') {
    return (
      <g fill="rgba(255,255,255,.14)" stroke={INK} strokeWidth="2.4">
        <circle cx="84" cy="92" r="10" /><circle cx="116" cy="92" r="10" />
        <path d="M94 91 Q100 87 106 91" fill="none" />{temples}
      </g>
    )
  }
  if (style === 'square') {
    return (
      <g fill="rgba(255,255,255,.14)" stroke={INK} strokeWidth="2.6">
        <rect x="71" y="83" width="26" height="18" rx="4" /><rect x="103" y="83" width="26" height="18" rx="4" />
        <path d="M97 90 L103 90" />{temples}
      </g>
    )
  }
  if (style === 'shades') {
    return (
      <g stroke="#c8941a" strokeWidth="1.8">
        <path d="M70 86 L98 86 Q98 105 84 105 Q70 105 70 86 Z" fill="#191b21" />
        <path d="M70 86 L98 86 Q98 105 84 105 Q70 105 70 86 Z" transform={MIRROR} fill="#191b21" />
        <path d="M98 87 L102 87" /><path d="M70 88 L60 87 M130 88 L140 87" />
        <path d="M75 90 L82 90" stroke="#fff" opacity=".35" /><path d="M107 90 L114 90" stroke="#fff" opacity=".35" />
      </g>
    )
  }
  if (style === 'visor') {
    return (
      <g>
        <rect x="62" y="82" width="76" height="20" rx="10" fill="#1fb5ad" opacity=".78" stroke="#7ff0e8" strokeWidth="1.5" />
        <path d="M70 88 L128 88" stroke="#d9fffb" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      </g>
    )
  }
  return null
}

function Hat({ style, c, d, l }) {
  switch (style) {
    case 'cap':
      return (
        <>
          <path d="M54 74 Q52 28 100 28 Q148 28 146 74 Q100 64 54 74 Z" fill={c} />
          <path d="M122 70 Q160 62 178 76 Q152 81 128 78 Z" fill={d} />
          <circle cx="100" cy="30" r="3" fill={d} />
          <circle cx="86" cy="52" r="7" fill={l} opacity=".9" />
        </>
      )
    case 'beanie':
      return (
        <>
          <path d="M54 78 Q50 22 100 22 Q150 22 146 78 Z" fill={c} />
          <path d="M52 68 L148 68 L148 82 Q100 76 52 82 Z" fill={d} />
          <path d="M66 68 L64 80 M80 68 L79 79 M94 68 L94 78 M108 68 L108 78 M122 68 L123 79 M136 68 L138 80" stroke={c} strokeWidth="2" opacity=".6" />
          <circle cx="100" cy="18" r="9" fill={l} />
        </>
      )
    case 'headset':
      return (
        <>
          <path d="M55 94 Q53 32 100 32 Q147 32 145 94" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <rect x="48" y="82" width="14" height="26" rx="6" fill={INK} /><rect x="138" y="82" width="14" height="26" rx="6" fill={INK} />
          <path d="M56 104 Q60 126 86 127" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <circle cx="87" cy="127" r="3.4" fill="#ff5a1f" />
        </>
      )
    case 'hardhat':
      return (
        <>
          <path d="M56 72 Q56 24 100 24 Q144 24 144 72 Z" fill="#ffb21a" />
          <path d="M100 24 L100 72 M84 28 L82 72 M116 28 L118 72" stroke="#e09400" strokeWidth="3" />
          <path d="M44 70 L156 70 Q158 80 150 80 L50 80 Q42 80 44 70 Z" fill="#e09400" />
        </>
      )
    case 'crown':
      return (
        <>
          <path d="M66 58 L71 24 L86 42 L100 16 L114 42 L129 24 L134 58 Z" fill="#ffb21a" stroke="#b86e00" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="100" cy="46" r="4" fill="#b8372a" /><circle cx="80" cy="50" r="3" fill="#1fb5ad" /><circle cx="120" cy="50" r="3" fill="#1fb5ad" />
        </>
      )
    default:
      return null
  }
}

export default function Avatar({ look, crop = false, className = '', title }) {
  const a = { ...DEFAULT_AVATAR, ...(look || {}) }
  const skin = option('skin', a.skin).color
  const hair = option('hairColor', a.hairColor).color
  const top = option('topColor', a.topColor).color
  const face = FACES[a.face] ?? FACES.oval
  const fit = `translate(100 ${face.top - 44}) scale(${face.hw / 42} 1) translate(-100 0)`
  const ears = face.hw + 1
  const brow = BROWS[a.brows] ?? BROWS.soft
  const light = shade(hair, -0.35)
  return (
    <svg
      className={`ar-av${crop ? ' crop' : ''} ${className}`} viewBox={crop ? '38 18 124 124' : '0 0 200 224'}
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}
    >
      <g className="ar-av-body">
        <g fill={hair} transform={fit}><HairBack style={a.hair} /></g>
        <path d="M86 118 L86 168 Q100 176 114 168 L114 118 Z" fill={shade(skin, 0.12)} />
        <g transform={a.build === 'broad' ? undefined : 'translate(100 0) scale(.84 1) translate(-100 0)'}>
          {a.top === 'hoodie' && <path d="M60 178 Q58 142 100 140 Q142 142 140 178 Z" fill={shade(top, 0.22)} />}
          <Top style={a.top} c={top} d={shade(top, 0.25)} l={shade(top, -0.3)} skin={shade(skin, 0.12)} />
          {a.build === 'curvy' && <path d="M70 204 Q84 216 98 208 M102 208 Q116 216 130 204" fill="none" stroke="#000" strokeOpacity=".22" strokeWidth="2.5" strokeLinecap="round" />}
        </g>
        {a.hair === 'long' && <g fill={hair} transform={fit}><path d="M50 120 L46 178 Q58 186 70 176 L66 120 Z M150 120 L154 178 Q142 186 130 176 L134 120 Z" /></g>}
        <ellipse cx={100 - ears} cy="96" rx="7" ry="11" fill={skin} />
        <ellipse cx={100 + ears} cy="96" rx="7" ry="11" fill={skin} />
        <path d={face.d} fill={skin} />
        {a.earrings === 'studs' && <g fill="#ffd27a"><circle cx={100 - ears} cy="106" r="2.6" /><circle cx={100 + ears} cy="106" r="2.6" /></g>}
        {a.earrings === 'hoops' && <g fill="none" stroke="#ffb21a" strokeWidth="2.2"><circle cx={100 - ears} cy="112" r="6" /><circle cx={100 + ears} cy="112" r="6" /></g>}
        <path d="M100 95 Q95 106 98 110 Q102 112 106 109" fill="none" stroke={shade(skin, 0.28)} strokeWidth="2.4" strokeLinecap="round" />
        <g fill={hair} transform={`translate(100 0) scale(${face.hw / 42} 1) translate(-100 0)`}><Beard style={a.beard} /></g>
        <Mouth style={a.mouth} lips={option('lips', a.lips).color} />
        {['moustache', 'goatee', 'full'].includes(a.beard) && <path d={MOUSTACHE} fill={hair} />}
        <g className="ar-av-eyes">
          <Eye style={a.eyes} iris={option('eyeColor', a.eyeColor).color} lid={skin} lashes={a.lashes} />
          <g transform={MIRROR}><Eye style={a.eyes} iris={option('eyeColor', a.eyeColor).color} lid={skin} lashes={a.lashes} /></g>
        </g>
        <g fill="none" stroke={shade(hair, 0.15)} strokeWidth={brow.w} strokeLinecap="round">
          <path d={brow.d} /><path d={brow.d} transform={MIRROR} />
        </g>
        <g fill={hair} transform={fit}><HairFront style={a.hair} light={light} /></g>
        <Glasses style={a.glasses} />
        <g transform={fit}><Hat style={a.hat} c={top} d={shade(top, 0.25)} l={shade(top, -0.4)} /></g>
      </g>
    </svg>
  )
}
