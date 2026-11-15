// Fails if any theme has a palette the Claude desktop app would refuse to paint.
// `claude plugin validate` doesn't look inside a theme, so CI runs this too.
// Usage: node scripts/check-themes.mjs   (Node 23.6+, which strips TypeScript types)
import { existsSync, readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

let failed = false
for (const name of readdirSync('themes')) {
  // A theme with several looks keeps them (and their `problems`) in looks.ts.
  const file = ['looks.ts', 'register.ts'].map(f => `themes/${name}/hooks/${f}`).find(existsSync)
  const { problems } = await import(pathToFileURL(file).href)
  const blocking = problems.filter(line => line.startsWith("Desktop won't paint"))
  console.log(`${blocking.length ? 'FAIL' : 'ok  '} ${name}${problems.length ? ` (${problems.length} contrast notes)` : ''}`)
  for (const line of blocking) console.log(`     ${line}`)
  failed ||= blocking.length > 0
}
process.exit(failed ? 1 : 0)
