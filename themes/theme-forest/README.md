# theme-forest

Sunlit fern by day, deep moss by night, with a glade of light glowing behind the conversation.

| | |
| --- | --- |
| Modes | Light + dark |
| Behind the chat | Still radial gradient that follows the mode |

## Where it works

| Claude Code surface | Supported |
| --- | :---: |
| Claude desktop app (Code tab) | ✅ |
| Claude mobile app | ✅ backdrop (colors where the app paints them) |
| Terminal (CLI) | ❌ the terminal keeps your `/theme` colors |
| VS Code extension panel | ❌ |

## Install

Requires Claude Code 2.1.324 or newer (check the version under the desktop app's Code tab). Only one theme can be active per session, so enable one theme at a time.

```bash
claude plugin marketplace add ravipatel7/claude-mods
claude plugin install theme-forest@claude-mods
```

Or at a terminal session's prompt: `/plugin install theme-forest --marketplace ravipatel7/claude-mods`. Start a new Code session to see it.

Try without installing: `claude --plugin-dir /path/to/claude-mods/themes/theme-forest`

## Update / uninstall

```bash
claude plugin update theme-forest@claude-mods
claude plugin uninstall theme-forest@claude-mods
```

If colors stay after uninstalling, start a new session; still there, open Settings in the Code tab, search `code appearance` and choose **Remove colors**.

## How it works

On `session.start` it calls `$.theme.set` once with a palette built by `makeColors` (`hooks/make-colors.js`, copied unchanged from Claude Code's plugin-authoring skill), plus a still radial `gradient` backdrop in palette names. Edit the hex anchors in `hooks/register.ts`, then run `node scripts/check-themes.mjs` from the repo root.
