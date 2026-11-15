export type Tokens = { input: number; output: number; cacheRead: number }
export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

/** What the theme-studio mod publishes (its own contract, mirrored here): read only, for the theme picker. */
export type StudioCurrent = {
  look: string
  label: string
  variant: 'day' | 'night'
  variantLabel: string
  mode: 'auto' | 'light' | 'dark' | 'off'
  looks: { id: string; label: string }[]
  dayStart: number
  nightStart: number
}

declare module 'claude-code' {
  interface PluginState {
    'theme-studio': {
      current: StudioCurrent
    }
    'usage-bar': {
      tokens: Tokens
      limits: Limit[]
      usd: number | null
      now: number
    }
  }
}
