# claude-mods

Mods for [Claude Code](https://claude.com/claude-code): small plugins built on Claude Code's function hooks that add live UI (bands, panes, status lines) and behaviour. Every mod lives in its own folder and installs on its own; this repo is also a plugin **marketplace**, so you add it once and pick the mods you want.

## Mods

| Mod | What it does | Terminal | Desktop app | VS Code panel |
| --- | --- | :---: | :---: | :---: |
| [usage-bar](mods/usage-bar) | Pills above the prompt: 5h / 7d rate limits with pace markers, session tokens, cost | ✅ | ✅ | ❌ |

Each mod's README covers what it does, where it works, and how to install, update and remove it.

## Install a mod

Requires Claude Code 2.1.286 or newer. The terminal CLI and the Claude desktop app's Code tab share the same `~/.claude` config, so installing once from a shell enables a mod in both:

```bash
claude plugin marketplace add ravipatel7/claude-mods
claude plugin install <mod-name>@claude-mods
```

Or from inside a terminal session: `/plugin marketplace add ravipatel7/claude-mods`, then `/plugin install <mod-name>@claude-mods`. Start a new session (or relaunch the desktop app) to load it.

| Where you use Claude Code | How mods get there |
| --- | --- |
| Terminal (`claude`), including the integrated terminal in VS Code / JetBrains | Install as above |
| Claude desktop app, Code tab | Install as above from any shell; new Code sessions load it |
| VS Code extension panel | Same install; a mod only draws there if its README marks VS Code ✅ |
| Try without installing | `claude --plugin-dir /path/to/claude-mods/mods/<mod-name>` |

## Update / remove

```bash
claude plugin marketplace update claude-mods      # fetch the latest catalog
claude plugin update <mod-name>@claude-mods       # update one mod
claude plugin uninstall <mod-name>@claude-mods    # remove one mod
```

## Repo layout

```
.claude-plugin/marketplace.json   # the catalog: one entry per mod
.github/workflows/validate.yml    # CI: validates the marketplace and every mod
templates/mod/                    # copy this to start a new mod
mods/<mod-name>/
  .claude-plugin/plugin.json      # name, version, description (+ "types" if it keeps state)
  hooks/hooks.json                # { "modules": ["./register.tsx"] }
  hooks/register.tsx              # the hooks module: export const register
  types/index.d.ts                # $.state contract, only if the mod keeps state
  docs/                           # screenshots for the README
  README.md                       # required
```

## Adding a mod

1. `cp -r templates/mod mods/<mod-name>` and replace `MOD-NAME` everywhere.
2. Write `hooks/register.tsx`. To iterate with hot reload, ask Claude Code to build it as a mod (the `plugin-authoring` skill), or run `claude --plugin-dir mods/<mod-name>`.
3. Fill in the README, every section, including the **Where it works** table.
4. Add an entry to `.claude-plugin/marketplace.json` and a row to the table above.
5. `claude plugin validate .` and `claude plugin validate mods/<mod-name>`, then open a PR; CI runs the same checks.
6. Ship changes by bumping `version` in the mod's `plugin.json`; users get it with `claude plugin update`.
