# MOD-NAME

One paragraph: what it does and why you'd want it. Add a screenshot (`docs/screenshot.png`) if it draws anything.

## Where it works

| Claude Code surface | Supported |
| --- | --- |
| Terminal (CLI, incl. VS Code / JetBrains integrated terminal) | ✅ / ❌ |
| Claude desktop app (Code tab) | ✅ / ❌ |
| VS Code extension panel | ✅ / ❌ |
| Mobile / web | ✅ / ❌ |

## Install

Requires Claude Code 2.1.286 or newer.

**Terminal or desktop app** (one shell command installs it for both; they share `~/.claude`):

```bash
claude plugin marketplace add ravipatel7/claude-mods
claude plugin install MOD-NAME@claude-mods
```

Inside a terminal session you can also run `/plugin marketplace add ravipatel7/claude-mods` then `/plugin install MOD-NAME@claude-mods`. Start a new session afterwards.

## Update

```bash
claude plugin marketplace update claude-mods
claude plugin update MOD-NAME@claude-mods
```

## Uninstall

```bash
claude plugin uninstall MOD-NAME@claude-mods
```

## How it works

Which events it hooks and what it draws.

## Configure / develop

Constants worth tweaking; `claude plugin validate mods/MOD-NAME`.
