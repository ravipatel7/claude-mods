import type { ThemeColors } from 'claude-code'

import { makeColors } from './make-colors.js'

// Each look is a pair of soft-focus SVG scenes (../art, made from generated images by scripts/art-to-scene.py) with
// palettes drawn from them: a day (light) version and a night (dark) version of the same idea.

type Anchors = Record<string, string>
type Roles = { accent: string; danger: string; success: string; warning: string; pro: string }
export type VariantName = 'day' | 'night'
export type Variant = { label: string; scene: string; colors: ThemeColors }
export type Look = { id: string; label: string; day: Variant; night: Variant }

export const problems: string[] = []

const palette = (label: string, only: 'light' | 'dark', roles: Roles, anchors: Anchors): ThemeColors => {
  const made = makeColors({ label, only, roles, [only]: { gray: { anchors } } } as Parameters<typeof makeColors>[0])
  problems.push(...made.problems.map(p => `${label}: ${p}`))
  return made.theme
}

const LIGHT_ROLES = { danger: '#b8433a', success: '#3f7f5c', warning: '#a8731a', pro: '#7b5aa6' }
const DARK_ROLES = { danger: '#ff7b7b', success: '#6fd0a0', warning: '#f0c070', pro: '#c0a0ff' }

export const LOOKS: Look[] = [
  {
    id: 'alpine',
    label: 'Alpine',
    day: {
      label: 'Dawn',
      scene: 'art/peaks-day.svg',
      colors: palette('Alpine · Dawn', 'light', { ...LIGHT_ROLES, accent: '#3f6f9f' },
        { 'surface-0': '#ebe6df', 'surface-1': '#f2eee8', 'surface-2': '#f9f7f3', 'text-primary': '#1f2328', 'text-secondary': '#434a52', 'text-muted': '#5b636c' }),
    },
    night: {
      label: 'Milky Way',
      scene: 'art/peaks-night.svg',
      colors: palette('Alpine · Milky Way', 'dark', { ...DARK_ROLES, accent: '#8fb3ff' },
        { 'surface-0': '#0b1220', 'surface-1': '#101828', 'surface-2': '#151e30', 'surface-3': '#1a2438', 'text-primary': '#e6ebf4', 'text-secondary': '#c0c9d8', 'text-muted': '#95a0b4' }),
    },
  },
  {
    id: 'seaside',
    label: 'Seaside',
    day: {
      label: 'Summer afternoon',
      scene: 'art/village-day.svg',
      colors: palette('Seaside · Summer afternoon', 'light', { ...LIGHT_ROLES, accent: '#2f7fa8', danger: '#c0503a' },
        { 'surface-0': '#efe8da', 'surface-1': '#f5efe3', 'surface-2': '#fbf8f1', 'text-primary': '#24261f', 'text-secondary': '#4a4c40', 'text-muted': '#616356' }),
    },
    night: {
      label: 'Moonlit',
      scene: 'art/village-night.svg',
      colors: palette('Seaside · Moonlit', 'dark', { ...DARK_ROLES, accent: '#f2b860', warning: '#e8d27a' },
        { 'surface-0': '#0c1820', 'surface-1': '#11202a', 'surface-2': '#172833', 'surface-3': '#1d303c', 'text-primary': '#e8eef0', 'text-secondary': '#c2d0d4', 'text-muted': '#97a9ae' }),
    },
  },
  {
    id: 'glass',
    label: 'Glass',
    day: {
      label: 'Pearl',
      scene: 'art/glass-day.svg',
      colors: palette('Glass · Pearl', 'light', { ...LIGHT_ROLES, accent: '#c0567a' },
        { 'surface-0': '#eeeaee', 'surface-1': '#f4f1f4', 'surface-2': '#faf8fa', 'text-primary': '#231f26', 'text-secondary': '#48424d', 'text-muted': '#605a66' }),
    },
    night: {
      label: 'Obsidian',
      scene: 'art/glass-night.svg',
      colors: palette('Glass · Obsidian', 'dark', { ...DARK_ROLES, accent: '#6fd6d0' },
        { 'surface-0': '#0b0b0e', 'surface-1': '#121216', 'surface-2': '#18181d', 'surface-3': '#1e1e24', 'text-primary': '#ecebf0', 'text-secondary': '#c6c5cf', 'text-muted': '#9b9aa7' }),
    },
  },
  {
    id: 'plaster',
    label: 'Plaster',
    day: {
      label: 'Morning light',
      scene: 'art/plaster-day.svg',
      colors: palette('Plaster · Morning light', 'light', { ...LIGHT_ROLES, accent: '#a0603a' },
        { 'surface-0': '#ece6dc', 'surface-1': '#f2ede5', 'surface-2': '#f9f6f1', 'text-primary': '#26221d', 'text-secondary': '#4c463e', 'text-muted': '#645d54' }),
    },
    night: {
      label: 'Lamplight',
      scene: 'art/plaster-night.svg',
      colors: palette('Plaster · Lamplight', 'dark', { ...DARK_ROLES, accent: '#f0a850', warning: '#e8d27a' },
        { 'surface-0': '#0f0d0b', 'surface-1': '#161310', 'surface-2': '#1c1915', 'surface-3': '#221e1a', 'text-primary': '#f0e8dc', 'text-secondary': '#cfc4b4', 'text-muted': '#a69a88' }),
    },
  },
]
