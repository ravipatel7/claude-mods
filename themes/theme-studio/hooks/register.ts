import type { EngineInterface, Register, ThemeColors } from 'claude-code'

import type { StudioCurrent, StudioMode } from '../types'
import { LOOKS, type Look, type VariantName } from './looks'

const CURRENT = { plugin: 'theme-studio', key: 'current' } as const
const PANE = 'theme-studio'
const MODES: StudioMode[] = ['auto', 'light', 'dark', 'off']

// One palette in both slots, so the chosen variant paints whatever mode the OS is in.
const forced = (c: ThemeColors): ThemeColors => {
  const one = c.inputs.light ?? c.inputs.dark ?? {}
  return { ...c, inputs: { light: one, dark: one } }
}

export const isDay = (hour: number, dayStart: number, nightStart: number) =>
  dayStart <= nightStart ? hour >= dayStart && hour < nightStart : hour >= dayStart || hour < nightStart

// Milliseconds until the next dayStart or nightStart boundary, from a local Date.
export const msToNextSwitch = (now: Date, dayStart: number, nightStart: number) => {
  const h = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
  const target = isDay(h, dayStart, nightStart) ? nightStart : dayStart
  const hours = (target - h + 24) % 24 || 24
  return Math.ceil(hours * 3600_000) + 1000
}

// Set by register from the plugin's options; a reload runs register again.
let dayStart = 7
let nightStart = 19
let timer: { cancel: () => void } | undefined

// Applies the stored look in the variant the mode and local time call for, and
// in auto mode schedules itself again for the next light/dark boundary.
async function apply($: EngineInterface): Promise<StudioCurrent> {
  const stored = await $.store.get('look')
  const chosen: Look = LOOKS.find(l => l.id === stored) ?? LOOKS[0]!
  const storedMode = await $.store.get('mode')
  const mode: StudioMode = MODES.find(m => m === storedMode) ?? 'auto'
  const now = new Date(await $.clock.now())
  const hour = now.getHours() + now.getMinutes() / 60
  const variant: VariantName = mode === 'light' ? 'day' : mode === 'dark' ? 'night' : isDay(hour, dayStart, nightStart) ? 'day' : 'night'
  const v = chosen[variant]
  const current: StudioCurrent = {
    look: chosen.id, label: chosen.label, variant, variantLabel: v.label, mode,
    looks: LOOKS.map(l => ({ id: l.id, label: l.label })), dayStart, nightStart,
  }
  timer?.cancel()
  timer = undefined

  // Off: set nothing. The theme itself is cleared only by `/look off` (a person's ask), never
  // here, since apply also runs at session start and a clear there would wipe another mod's theme.
  if (mode === 'off') {
    $.ui.status(undefined)
    await $.state.set(CURRENT, current)
    return current
  }

  // The desktop app draws a still `image` ground blank and strips images embedded in a scene's
  // SVG, so each look is a soft-focus SVG made from its picture (scripts/art-to-scene.py),
  // drawn by the Backdrop hook below and frosted for readable text.
  const set = await $.theme.set({
    colors: forced(v.colors),
    overrideColorScheme: variant === 'day' ? 'light' : 'dark',
    backdrop: {
      scene: `${chosen.id}-${variant}`,
      glass: variant === 'day' ? { blur: 14, tint: '#f6f2ec', opacity: 0.5 } : { blur: 14, tint: '#0b0d12', opacity: 0.45 },
    },
  })
  $.ui.status(set.isDrawn ? undefined : set.reason)
  await $.state.set(CURRENT, current)

  timer = mode === 'auto' ? $.clock.after(msToNextSwitch(now, dayStart, nightStart), () => void apply($)) : undefined
  return current
}

// Each scene is read once per load (each is under the 131,072-character limit).
const scenes = new Map<string, string>()
async function sceneSvg($: EngineInterface, path: string) {
  let svg = scenes.get(path)
  if (!svg) {
    svg = await $.fs.read(`${$.plugin.root}/${path}`)
    scenes.set(path, svg)
  }
  return svg
}

const describe = (c: StudioCurrent) =>
  c.mode === 'off'
    ? 'theme-studio is off: the app has its own look. /look <name> or /look auto turns it back on.'
    : `${c.label} · ${c.variantLabel} (${c.variant === 'day' ? 'light' : 'dark'}), mode ${c.mode}` +
      (c.mode === 'auto' ? `: light from ${c.dayStart}:00, dark from ${c.nightStart}:00` : '')

export const register: Register = (on, options) => {
  dayStart = Number(options.dayStart ?? 7)
  nightStart = Number(options.nightStart ?? 19)

  on('session.start', async ($, e, next) => {
    await apply($)
    await $.command.register({
      name: 'look',
      description: 'Pick a theme-studio look or mode (auto switches light/dark by local time)',
      argumentHint: `[${LOOKS.map(l => l.id).join('|')}|next|auto|light|dark|off]`,
    })
    return next(e)
  })

  on('command.run', { command: 'look' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (!arg) {
      void $.ui.open({ id: PANE, title: 'Looks' })
      const { value } = await $.state.get(CURRENT)
      return { text: value ? describe(value) : 'theme-studio: no look applied yet' }
    }
    if (arg === 'off' || arg === 'reset') {
      // The person asked to remove the theme: clear it now, and stay off in later sessions.
      await $.store.set('mode', 'off')
      const current = await apply($)
      await $.theme.clear()
      return { text: describe(current) }
    }
    if ((MODES as string[]).includes(arg)) await $.store.set('mode', arg)
    else if (arg === 'next' || LOOKS.some(l => l.id === arg)) {
      const was = await $.store.get('look')
      const i = Math.max(0, LOOKS.findIndex(l => l.id === was))
      await $.store.set('look', arg === 'next' ? LOOKS[(i + 1) % LOOKS.length]!.id : arg)
      // Picking a look while off turns theming back on.
      if ((await $.store.get('mode')) === 'off') await $.store.set('mode', 'auto')
    } else return { text: `Unknown look or mode "${arg}". Try: ${LOOKS.map(l => l.id).join(', ')}, next, auto, light, dark, off` }
    return { text: describe(await apply($)) }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== $.plugin.name) return next(e)
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    const variant: VariantName = e.props.scene.endsWith('-day') ? 'day' : 'night'
    const look = LOOKS.find(l => l.id === e.props.scene.replace(/-(day|night)$/, ''))
    if (!look) return next(e)
    const { Svg } = $.ui.resolve(e)
    return Svg({ source: await sceneSvg($, look[variant].scene), alt: `${look.label}, ${look[variant].label}` })
  })

  // The picker: two dropdowns, also drawn by usage-bar's band when both mods are installed.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Select } = $.ui.resolve(e)
    const { value: c } = await $.state.get(CURRENT)
    if (!c) return Text({ children: ['No look applied yet.'] })
    return Box({
      flexDirection: 'column',
      gap: 1,
      children: [
        Text({ bold: true, children: [describe(c)] }),
        Select({
          key: 'look', label: 'Look', value: c.look,
          options: c.looks.map(l => ({ value: l.id, label: l.label })),
          onSelect: v => void $.command.run({ command: 'look', args: v }),
        }),
        Select({
          key: 'mode', label: 'Mode', value: c.mode,
          options: [
            { value: 'auto', label: `Auto (light ${c.dayStart}:00-${c.nightStart}:00)` },
            { value: 'light', label: 'Always light' },
            { value: 'dark', label: 'Always dark' },
            { value: 'off', label: 'Off (app default)' },
          ],
          onSelect: v => void $.command.run({ command: 'look', args: v }),
        }),
      ],
    })
  })
}
