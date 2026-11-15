import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// Pale ice by day, polar night by night, with a frosted gradient behind the chat.
export const { theme, problems } = makeColors({
  label: 'Arctic',
  roles: { accent: '#3b7fc4', danger: '#c0453a', success: '#3f8f6b', warning: '#b07d1a', pro: '#7a63b8' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e4ebf1',
        'surface-1': '#ecf1f6',
        'surface-2': '#f5f8fb',
        'text-primary': '#1a2530',
        'text-secondary': '#3c4b5a',
        'text-muted': '#536373',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#121920',
        'surface-1': '#18212a',
        'surface-2': '#1f2933',
        'surface-3': '#26313c',
        'text-primary': '#e3ebf2',
        'text-secondary': '#bccad6',
        'text-muted': '#93a3b2',
      },
    },
  },
})

const LOOK: ThemeSetArgs = {
  colors: theme,
  // Palette names follow the mode, so one gradient serves light and dark.
  backdrop: { gradient: { stops: ['surface-2', 'surface-0'], angle: 160 } },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const set = await $.theme.set(LOOK)
    if (!set.isDrawn) $.ui.status(set.reason)
    return next(e)
  })
}
