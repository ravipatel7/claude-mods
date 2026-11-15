# claude-mods

Mods for [Claude Code](https://claude.com/claude-code): small plugins built on Claude Code's function hooks that add live UI (bands, panes, status lines) and behaviour. Every mod lives in its own folder and installs on its own; this repo is also a plugin **marketplace**, so you add it once and pick the mods you want.

## Mods

| Mod | What it does | Terminal | Desktop app | VS Code panel | Mobile app |
| --- | --- | :---: | :---: | :---: | :---: |
| [usage-bar](mods/usage-bar) | 5h / 7d rate limits with pace markers, session tokens, cost | ✅ | ✅ | ✅ pane | ⚠️ text via `/usage-bar` |

Each mod's README covers what it does, where it works, and how to install, update and remove it.

## Themes

Themes repaint the Claude **desktop and mobile apps** (every surface, text color and code color, in light and dark) and can put a backdrop behind the conversation, still or animated. They use the mods `$.theme.set` API, so they need Claude Code **2.1.324 or newer**. The terminal keeps its own `/theme` colors. Only one theme applies per session, so enable one at a time.

| Theme | Look | Modes | Backdrop |
| --- | --- | --- | --- |
| [theme-studio](themes/theme-studio) | **Four premium looks**: Alpine (cinematic landscape), Seaside (painterly), Glass (abstract), Plaster (moody minimal); day/night versions **switch by local time**; pick with `/look` or from usage-bar | Light + dark, auto | high-res images |
| [theme-paper](themes/theme-paper) | Warm cream paper / lamp-lit brown paper | Light + dark | none |
| [theme-arctic](themes/theme-arctic) | Pale ice / polar night | Light + dark | still gradient |
| [theme-forest](themes/theme-forest) | Sunlit fern / deep moss | Light + dark | still radial glade |
| [theme-night-sky](themes/theme-night-sky) | Midnight blue, twinkling stars, shooting stars | Dark only | animated scene |
| [theme-ocean-tide](themes/theme-ocean-tide) | Deep-sea teal, rolling moonlit waves | Dark only | animated scene |

```bash
claude plugin marketplace add ravipatel7/claude-mods
claude plugin install theme-night-sky@claude-mods
```

Switching themes: `claude plugin disable <old>@claude-mods`, `claude plugin enable <new>@claude-mods`, then start a new Code session.

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
| VS Code extension panel | Same install; VS Code is a remote surface of the Claude Code running on your machine. Mods draw there only in panes and transcript rows, not the band above the prompt |
| Claude mobile app | Nothing to install on the phone. Over Remote Control it mirrors transcript text only, so mods show there only as text (e.g. a command's output) |
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
themes/<theme-name>/              # same plugin shape; register.ts calls $.theme.set
  hooks/make-colors.{js,d.ts}     # palette builder from the plugin-authoring skill, kept unchanged
scripts/check-themes.mjs          # fails if a palette is one Desktop would refuse to paint
```

## Adding a theme

1. `cp -r themes/theme-paper themes/theme-<name>` (or `theme-night-sky` for an animated scene), rename it in `plugin.json` and the README.
2. Change the hex anchors and roles in `hooks/register.ts`; for a scene, the SVG (keep the subject away from the middle and the foot, under 131,072 characters, CSS animation only).
3. `node scripts/check-themes.mjs` and `claude plugin validate themes/theme-<name>`, add a marketplace entry and a row to the table above.

## Adding a mod

1. `cp -r templates/mod mods/<mod-name>` and replace `MOD-NAME` everywhere.
2. Write `hooks/register.tsx`. To iterate with hot reload, ask Claude Code to build it as a mod (the `plugin-authoring` skill), or run `claude --plugin-dir mods/<mod-name>`.
3. Fill in the README, every section, including the **Where it works** table.
4. Add an entry to `.claude-plugin/marketplace.json` and a row to the table above.
5. `claude plugin validate .` and `claude plugin validate mods/<mod-name>`, then open a PR; CI runs the same checks.
6. Ship changes by bumping `version` in the mod's `plugin.json`; users get it with `claude plugin update`.
