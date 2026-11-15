import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// A dark-only look: midnight-blue surfaces over a live starfield.
export const { theme, problems } = makeColors({
  label: 'Night sky',
  only: 'dark',
  roles: { accent: '#7aa2ff', danger: '#e0625a', success: '#5fbf8f', warning: '#e0aa4a', pro: '#b08cff' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0b1020',
        'surface-1': '#10172b',
        'surface-2': '#151d34',
        'surface-3': '#1a233d',
        'text-primary': '#e8ecf7',
        'text-secondary': '#c0c8dd',
        'text-muted': '#959fba',
      },
    },
  },
})

const SCENE_ID = 'night-sky'

const LOOK: ThemeSetArgs = {
  colors: theme,
  overrideColorScheme: 'dark',
  backdrop: { scene: SCENE_ID, glass: { blur: 4, tint: '#0b1020', opacity: 0.55 } },
}

// Deterministic stars (same sky every session): a tiny LCG instead of Math.random.
let seed = 20261115
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

// Animation is SMIL, not CSS: the desktop's sandboxed SVG frame runs SMIL, and strips <style>.
const loop = (attr: string, values: string, dur: number, begin = 0) =>
  `<animate attributeName="${attr}" values="${values}" dur="${dur}s" begin="-${begin}s" repeatCount="indefinite"/>`

const stars = Array.from({ length: 140 }, (_, i) => {
  const x = (rnd() * 1600).toFixed(1)
  const y = (rnd() * 820).toFixed(1)
  const r = (0.6 + rnd() * rnd() * 2.2).toFixed(2)
  const delay = Number((rnd() * 6).toFixed(2))
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#f4f6ff">${loop('opacity', '.25;1;.25', [4, 5.5, 7][i % 3]!, delay)}</circle>`
}).join('')

// A shooting star: invisible most of the cycle, streaks down-left for its first 7%.
const shoot = (x: number, y: number, w: number, dur: number, begin: number) =>
  `<g opacity="0">${`<animate attributeName="opacity" values="0;1;0;0" keyTimes="0;.02;.07;1" dur="${dur}s" begin="-${begin}s" repeatCount="indefinite"/>`}<animateTransform attributeName="transform" type="translate" values="0 0;-420 210;-420 210" keyTimes="0;.07;1" dur="${dur}s" begin="-${begin}s" repeatCount="indefinite"/><rect x="${x - w}" y="${y}" width="${w}" height="2" rx="1" fill="url(#trail)" transform="rotate(-26 ${x} ${y + 1})"/></g>`

export const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#05081a"/><stop offset=".6" stop-color="#0d1433"/><stop offset="1" stop-color="#1b1f4a"/>
  </linearGradient>
  <radialGradient id="glow" cx=".7" cy=".15" r=".35">
    <stop offset="0" stop-color="#c9d6ff" stop-opacity=".22"/><stop offset="1" stop-color="#c9d6ff" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="trail" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/>
  </linearGradient>
</defs>
<rect width="1600" height="1000" fill="url(#sky)"/>
<rect width="1600" height="1000" fill="url(#glow)"/>
${stars}
<mask id="crescent"><circle cx="1120" cy="150" r="46" fill="#fff"/><circle cx="1142" cy="136" r="42" fill="#000"/></mask>
<g><animateTransform attributeName="transform" type="translate" values="0 0;-30 12;0 0" dur="120s" repeatCount="indefinite"/><circle cx="1120" cy="150" r="46" fill="#e9edff" mask="url(#crescent)"/></g>
${shoot(1340, 120, 160, 11, 0)}
${shoot(820, 80, 120, 17, 6)}
<path d="M0 930 Q200 860 420 905 T860 900 T1300 880 T1600 900 V1000 H0Z" fill="#070a18"/>
</svg>`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const set = await $.theme.set(LOOK)
    if (!set.isDrawn) $.ui.status(set.reason)
    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.plugin !== $.plugin.name || e.props.scene !== SCENE_ID) return next(e)
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    const { Svg } = $.ui.resolve(e)
    return Svg({ source: SCENE, alt: 'A night sky with twinkling stars and the odd shooting star', isInteractive: true })
  })
}
