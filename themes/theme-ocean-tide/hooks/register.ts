import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// A dark-only look: deep-sea teal surfaces over slow, layered moonlit waves.
export const { theme, problems } = makeColors({
  label: 'Ocean tide',
  only: 'dark',
  roles: { accent: '#36b5c2', danger: '#e06a5a', success: '#62c08a', warning: '#e2b252', pro: '#9f8cf0' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#08171c',
        'surface-1': '#0d1e24',
        'surface-2': '#12262d',
        'surface-3': '#172d35',
        'text-primary': '#e2f1f3',
        'text-secondary': '#b6d0d4',
        'text-muted': '#8aa9ae',
      },
    },
  },
})

const SCENE_ID = 'ocean-tide'

const LOOK: ThemeSetArgs = {
  colors: theme,
  overrideColorScheme: 'dark',
  backdrop: { scene: SCENE_ID, glass: { blur: 4, tint: '#08171c', opacity: 0.55 } },
}

// One wave path, 3200 wide, whose shape repeats every 1600, so sliding it -1600 loops seamlessly.
const wave = (y: number, amp: number, len: number) => {
  let d = `M0 ${y}`
  for (let x = 0; x < 3200; x += len) d += ` q${len / 4} ${-amp} ${len / 2} 0 t${len / 2} 0`
  return `${d} V1000 H0Z`
}

const LAYERS = [
  { y: 640, amp: 14, len: 400, fill: '#0f3a46', dur: 38, op: 0.75 },
  { y: 700, amp: 18, len: 320, fill: '#0c2f3a', dur: 28, op: 0.85 },
  { y: 770, amp: 22, len: 400, fill: '#09242d', dur: 21, op: 0.92 },
  { y: 850, amp: 26, len: 320, fill: '#061a21', dur: 15, op: 1 },
]
  .map(
    (l, i) =>
      // SMIL, not CSS: the desktop's sandboxed SVG frame runs SMIL, and strips <style>.
      `<path d="${wave(l.y, l.amp, l.len)}" fill="${l.fill}" opacity="${l.op}"><animateTransform attributeName="transform" type="translate" from="0 0" to="-1600 0" dur="${l.dur}s" begin="-${i * 3}s" repeatCount="indefinite"/></path>`,
  )
  .join('')

export const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#04111a"/><stop offset=".62" stop-color="#0b2a36"/><stop offset="1" stop-color="#0e3542"/>
  </linearGradient>
  <linearGradient id="path" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#cfeff2" stop-opacity="0"/><stop offset=".25" stop-color="#cfeff2" stop-opacity=".4"/><stop offset="1" stop-color="#cfeff2" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect width="1600" height="1000" fill="url(#sky)"/>
<circle cx="1130" cy="190" r="54" fill="#e6f6f7" opacity=".92"/>
<ellipse cx="1130" cy="820" rx="30" ry="190" fill="url(#path)"><animate attributeName="opacity" values=".5;1;.5" dur="5s" repeatCount="indefinite"/></ellipse>
${LAYERS}
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
    return Svg({ source: SCENE, alt: 'Slow layered waves under a moonlit sky', isInteractive: true })
  })
}
