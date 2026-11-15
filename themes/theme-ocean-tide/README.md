# theme-ocean-tide

Deep-sea teal surfaces over four layers of slow rolling waves under a full moon, with a shimmering reflection. Panels are frosted glass.

| | |
| --- | --- |
| Modes | Dark only (forces dark mode) |
| Behind the chat | Animated SVG scene |

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
claude plugin install theme-ocean-tide@claude-mods
```

Or at a terminal session's prompt: `/plugin install theme-ocean-tide --marketplace ravipatel7/claude-mods`. Start a new Code session to see it.

Try without installing: `claude --plugin-dir /path/to/claude-mods/themes/theme-ocean-tide`

## Update / uninstall

```bash
claude plugin update theme-ocean-tide@claude-mods
claude plugin uninstall theme-ocean-tide@claude-mods
```

If colors stay after uninstalling, start a new session; still there, open Settings in the Code tab, search `code appearance` and choose **Remove colors**.

## How it works

On `session.start` it calls `$.theme.set` once with a palette built by `makeColors` (`hooks/make-colors.js`, copied unchanged from Claude Code's plugin-authoring skill), plus a `scene` backdrop drawn by a `ui.render` hook on `Backdrop` as an animated SVG (CSS keyframes, no script). Edit the hex anchors in `hooks/register.ts`, then run `node scripts/check-themes.mjs` from the repo root.
