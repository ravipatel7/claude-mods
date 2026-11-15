import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// Sunlit fern by day, deep moss by night, with a glade of light behind the chat.
export const { theme, problems } = makeColors({
  label: 'Forest',
  roles: { accent: '#2f7f86', danger: '#b5452f', success: '#4e8a3a', warning: '#b5821c', pro: '#8a5a9e' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e3e9da',
        'surface-1': '#eaefe2',
        'surface-2': '#f3f6ed',
        'text-primary': '#1d2618',
        'text-secondary': '#3e4a36',
        'text-muted': '#56634c',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#11170e',
        'surface-1': '#171f13',
        'surface-2': '#1d2719',
        'surface-3': '#242f1f',
        'text-primary': '#e2ead8',
        'text-secondary': '#bec9b2',
        'text-muted': '#95a288',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { gradient: { shape: 'radial', stops: ['surface-2', 'surface-1', 'surface-0'] } },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const set = await $.theme.set(LOOK)
    if (!set.isDrawn) $.ui.status(set.reason)
    return next(e)
  })
}
