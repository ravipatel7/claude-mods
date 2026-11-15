export type StudioMode = 'auto' | 'light' | 'dark' | 'off'

/** What theme-studio publishes for other mods (usage-bar's picker) to read. */
export type StudioCurrent = {
  look: string
  label: string
  variant: 'day' | 'night'
  variantLabel: string
  mode: StudioMode
  looks: { id: string; label: string }[]
  dayStart: number
  nightStart: number
}


declare module 'claude-code' {
  interface PluginState {
    'theme-studio': {
      current: StudioCurrent
    }
  }
}
