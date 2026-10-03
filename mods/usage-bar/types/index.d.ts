export type Tokens = { input: number; output: number; cacheRead: number }
export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

declare module 'claude-code' {
  interface PluginState {
    'usage-bar': {
      tokens: Tokens
      limits: Limit[]
      usd: number | null
      now: number
    }
  }
}
