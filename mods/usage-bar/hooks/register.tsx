import { atom, read, update } from 'claude-code'
import type { ElementTable, Register } from 'claude-code'

import type { Limit, Tokens } from '../types'

const tokens = atom({ plugin: 'usage-bar', key: 'tokens' } as const, { input: 0, output: 0, cacheRead: 0 })
const limits = atom({ plugin: 'usage-bar', key: 'limits' } as const, [])
const usd = atom({ plugin: 'usage-bar', key: 'usd' } as const, null)
const now = atom({ plugin: 'usage-bar', key: 'now' } as const, 0)

// Lucide icons (ISC license), 24x24 stroke paths.
const ICONS = {
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  dollar: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>',
}
type IconName = keyof typeof ICONS

// Per-pill tint: [light bg, light accent, dark bg, dark accent].
const TINTS = {
  sage: ['#e4ebe5', '#5d7a64', '#263129', '#9cc2a5'],
  violet: ['#e8e5f6', '#6f5fc4', '#2b2843', '#b4a9f2'],
  peach: ['#f6e3dc', '#bf5f45', '#3b2a25', '#f0a48c'],
  mint: ['#e1ede3', '#4a8a58', '#233128', '#8fd29e'],
  blue: ['#e2e6f7', '#5466c2', '#262c40', '#a5b2f6'],
  sand: ['#f1ebd4', '#9c8228', '#352f1e', '#e2c96f'],
}
type Tint = keyof typeof TINTS

const WINDOWS = [
  { kind: 'five_hour', label: '5h', icon: 'gauge', tint: 'sage', ms: 5 * 3600_000 },
  { kind: 'seven_day', label: '7d', icon: 'calendar', tint: 'violet', ms: 7 * 86400_000 },
] as const

export const fmtTokens = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : `${n}`

export const fmtLeft = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60_000))
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60
  return d ? `${d}d ${h}h` : h ? `${h}h ${mm}m` : `${mm}m`
}

type Piece =
  | { t: 'icon'; name: IconName }
  | { t: 'text'; s: string; bold?: boolean; muted?: boolean }
  | { t: 'bar'; pct: number; pace: number | null; w?: number }
  | { t: 'sep' }

// `group` starts a new cluster; leftover width goes into the gaps before clusters.
type Pill = { key: string; tint: Tint; alt: string; pieces: Piece[]; group?: boolean }

const buildPills = (t: Tokens, ls: Limit[], cost: number | null, at: number): Pill[] => {
  const pills: Pill[] = []
  for (const w of WINDOWS) {
    const l = ls.find(x => x.kind === w.kind)
    if (!l) continue
    const resetAt = l.resetsAt ? Date.parse(l.resetsAt) : NaN
    const left = Number.isNaN(resetAt) || !at ? null : resetAt - at
    // Pace marker: share of the window's time already elapsed.
    const pace = left === null ? null : Math.min(1, Math.max(0, 1 - left / w.ms))
    const pct = Math.round(l.percentUsed)
    const pieces: Piece[] = [
      { t: 'icon', name: w.icon },
      { t: 'text', s: w.label, muted: true },
      { t: 'bar', pct: l.percentUsed, pace },
      { t: 'text', s: `${pct}%`, bold: true },
    ]
    if (left !== null) pieces.push({ t: 'sep' }, { t: 'icon', name: 'history' }, { t: 'text', s: fmtLeft(left), muted: true })
    pills.push({ key: w.kind, tint: w.tint, alt: `${w.label} limit ${pct}% used${left !== null ? `, resets in ${fmtLeft(left)}` : ''}`, pieces })
  }
  const stat = (key: string, tint: Tint, name: IconName, s: string, alt: string): Pill =>
    ({ key, tint, alt, pieces: [{ t: 'icon', name }, { t: 'text', s }] })
  pills.push(
    { ...stat('in', 'peach', 'upload', fmtTokens(t.input), `${fmtTokens(t.input)} input tokens`), group: true },
    stat('out', 'mint', 'download', fmtTokens(t.output), `${fmtTokens(t.output)} output tokens`),
    stat('cache', 'blue', 'layers', fmtTokens(t.cacheRead), `${fmtTokens(t.cacheRead)} cached input tokens`),
  )
  if (cost !== null) pills.push({ ...stat('usd', 'sand', 'dollar', `$${cost.toFixed(2)}`, `$${cost.toFixed(2)} session cost`), group: true })
  return pills
}

// --- Desktop: one SVG per pill; colors switch with prefers-color-scheme. ---

const H = 24, PAD = 8, ICON = 14, GAP = 5, CW = 7.3, BAR_W = 44, BAR_MAX = 140, FONT = 12, PILL_GAP = 6
// ponytail: desktop reports width in code-font cells, not px; calibrated by eye. Tune if the row over/undershoots.
const CELL_PX = 7.8

const pieceW = (p: Piece) =>
  p.t === 'icon' ? ICON : p.t === 'text' ? p.s.length * CW : p.t === 'bar' ? p.w ?? BAR_W : 1

// One pill as a group at x; its tint arrives as CSS vars on its class.
const pillSvg = (tint: Tint, pieces: Piece[], x0: number) => {
  const w = Math.ceil(PAD * 2 + pieces.reduce((a, p) => a + pieceW(p), 0) + GAP * (pieces.length - 1))
  const mid = H / 2
  let x = PAD
  const body = pieces.map(p => {
    const at = x
    x += pieceW(p) + GAP
    switch (p.t) {
      case 'icon':
        return `<svg x="${at}" y="${mid - ICON / 2}" width="${ICON}" height="${ICON}" viewBox="0 0 24 24" class="ic">${ICONS[p.name]}</svg>`
      case 'text':
        return `<text x="${at}" y="${mid}" class="${p.muted ? 'mu' : 'fg'}${p.bold ? ' b' : ''}">${p.s}</text>`
      case 'sep':
        return `<rect x="${at}" y="${mid - 6}" width="1" height="12" class="tr"/>`
      case 'bar': {
        const bw = p.w ?? BAR_W
        const fill = (Math.max(0, Math.min(100, p.pct)) / 100) * bw
        const mark = p.pace === null ? '' : `<rect x="${(at + p.pace * (bw - 2)).toFixed(1)}" y="${mid - 6}" width="2" height="12" rx="1" class="mk"/>`
        return `<rect x="${at}" y="${mid - 2.5}" width="${bw}" height="5" rx="2.5" class="tr"/>` +
          `<rect x="${at}" y="${mid - 2.5}" width="${fill.toFixed(1)}" height="5" rx="2.5" class="fi"/>${mark}`
      }
    }
  }).join('')
  return { width: w, body: `<g class="t-${tint}" transform="translate(${x0})"><rect class="pill" width="${w}" height="${H}" rx="${H / 2}"/>${body}</g>` }
}

const tintCss = (i: 0 | 2) =>
  Object.entries(TINTS).map(([k, v]) => `.t-${k}{--bg:${v[i]};--ac:${v[i + 1]}}`).join('')

// The whole row as one SVG: with no width the surface scales it to fit, so it never wraps.
// The whole row as one SVG sized to `avail` px: bars stretch first (up to BAR_MAX),
// the rest spreads into the gaps between clusters. Narrower than natural, it scales down.
const naturalW = (pills: Pill[]) =>
  pills.reduce((a, p) => a + pillSvg(p.tint, p.pieces, 0).width, 0) + PILL_GAP * (pills.length - 1)

export const rowSvg = (pills: Pill[], avail = 0) => {
  const natural = naturalW(pills)
  let extra = Math.max(0, avail - natural)
  const bars = pills.flatMap(p => p.pieces.filter(x => x.t === 'bar'))
  const grow = bars.length ? Math.min(extra / bars.length, BAR_MAX - BAR_W) : 0
  extra -= grow * bars.length
  const breaks = pills.filter((p, i) => i > 0 && p.group).length
  let x = 0
  const groups = pills.map((p, i) => {
    if (i > 0 && p.group && breaks) x += extra / breaks
    const pieces = p.pieces.map(q => (q.t === 'bar' ? { ...q, w: BAR_W + grow } : q))
    const g = pillSvg(p.tint, pieces, Math.round(x))
    x += g.width + PILL_GAP
    return g.body
  }).join('')
  const w = Math.max(1, Math.round(x - PILL_GAP))
  const css =
    `svg{--fg:#2a2d2b;--mu:#5f6661;--tr:rgba(0,0,0,.13);--mk:#3a3f3c}${tintCss(0)}` +
    `@media (prefers-color-scheme:dark){svg{--fg:#ecebe8;--mu:#a9aea9;--tr:rgba(255,255,255,.18);--mk:#ecebe8}${tintCss(2)}}` +
    `.pill{fill:var(--bg)}.ic{fill:none;stroke:var(--ac);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}` +
    `text{font:500 ${FONT}px ui-monospace,"SF Mono",Menlo,monospace;dominant-baseline:central}` +
    `.fg{fill:var(--fg)}.mu{fill:var(--mu)}.b{font-weight:700;fill:var(--fg)}.tr{fill:var(--tr)}.fi{fill:var(--ac)}.mk{fill:var(--mk)}`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}"><style>${css}</style>${groups}</svg>`
}

// --- Terminal: text in theme color keys, so light and dark themes both read. ---

const TERM_ICON: Record<IconName, string> = {
  gauge: '◷', calendar: '▦', history: '↺', upload: '↑', download: '↓', layers: '≋', dollar: '$',
}
const TERM_COLOR: Record<Tint, string> = {
  sage: 'success', violet: 'permission', peach: 'claude', mint: 'success', blue: 'suggestion', sand: 'warning',
}
const termBar = (pct: number) => {
  const n = Math.round((Math.max(0, Math.min(100, pct)) / 100) * 8)
  return ['━'.repeat(n), '━'.repeat(8 - n)]
}

const PANE = 'usage-bar'
const openPane = ($: { ui: { open: (a: { id: string; title: string }) => Promise<unknown> } }) =>
  $.ui.open({ id: PANE, title: 'Usage' })

type TermEls = ElementTable<'terminal'>
const termTree = ({ Box, Text }: TermEls, pills: Pill[]) => (
  <Box flexWrap="wrap" columnGap={3}>
    {pills.map(p => (
      <Box key={p.key}>
        <Text>
          {p.pieces.map(x => {
            if (x.t === 'icon') return <Text color={TERM_COLOR[p.tint]}>{TERM_ICON[x.name]} </Text>
            if (x.t === 'text') return <Text bold={x.bold} dimColor={x.muted}>{x.s} </Text>
            if (x.t === 'sep') return <Text dimColor>· </Text>
            const [full, empty] = termBar(x.pct)
            return <Text><Text color={TERM_COLOR[p.tint]}>{full}</Text><Text dimColor>{empty}</Text> </Text>
          })}
        </Text>
      </Box>
    ))}
  </Box>
)

// One row when it fits (or shrinks <15%); otherwise limits on top, tokens + cost below.
type SvgEls = ElementTable<'desktop' | 'vscode' | 'mobile'>
const svgTree = ({ Box, Svg }: SvgEls, pills: Pill[], columns: number) => {
  const avail = Math.floor(columns * CELL_PX)
  // Lay out at `layout` px, draw at `avail`: every row then shares one scale.
  const row = (ps: Pill[], layout: number) =>
    <Svg source={rowSvg(ps, layout)} alt={ps.map(p => p.alt).join('; ')} width={avail} />
  const split = pills.findIndex(p => p.group)
  if (split <= 0 || naturalW(pills) * 0.85 <= avail) return row(pills, avail)
  const [top, bottom] = [pills.slice(0, split), pills.slice(split)]
  const layout = Math.max(avail, naturalW(top), naturalW(bottom))
  return (
    <Box flexDirection="column" gap={1}>
      {row(top, layout)}
      {row(bottom, layout)}
    </Box>
  )
}

const currentPills = async ($: Parameters<typeof read>[0]) =>
  buildPills(await read($, tokens), await read($, limits), await read($, usd), await read($, now))

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const u = await $.session.usage()
    await update($, limits, () => u.rateLimits)
    await update($, usd, () => u.cost?.usd ?? null)
    const tick = async () => {
      const ms = await $.clock.now()
      await update($, now, () => ms)
    }
    await tick()
    // ponytail: minute tick only drives the reset countdown; finer is wasted redraws.
    $.clock.every(60_000, () => void tick())
    await $.command.register({ name: 'usage', description: 'Show rate limits, tokens and cost in a pane' })
    // VS Code has no band above the prompt, so the pane stands in for it there.
    if ((await $.session.surfaces()).includes('vscode')) void openPane($)
    return next(e)
  })

  on('session.attach', { surface: 'vscode' }, ($, e, next) => {
    void openPane($)
    return next(e)
  })

  on('command.run', { command: 'usage' }, async $ => {
    await openPane($)
    return { text: 'Usage pane opened.' }
  })

  on('session.measure', async ($, e, next) => {
    await update($, limits, () => e.rateLimits)
    if (e.cost) await update($, usd, () => e.cost!.usd)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const u = e.usage
    if (u) {
      await update($, tokens, (t: Tokens) => ({
        input: t.input + u.input_tokens + u.cache_creation_input_tokens,
        output: t.output + u.output_tokens,
        cacheRead: t.cacheRead + u.cache_read_input_tokens,
      }))
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const pills = await currentPills($)
    return e.surface === 'terminal'
      ? termTree($.ui.resolve(e), pills)
      : svgTree($.ui.resolve(e), pills, e.props.bodyColumns)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const pills = await currentPills($)
    return e.surface === 'terminal'
      ? termTree($.ui.resolve(e), pills)
      : svgTree($.ui.resolve(e), pills, e.props.bodyColumns)
  })
}
