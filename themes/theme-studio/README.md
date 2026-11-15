# theme-studio

Four premium looks for the Claude desktop and mobile apps. Each is a high-resolution backdrop with a palette drawn from it, in a **day (light)** and a **night (dark)** version that switch by your local time.

| Look | Style | Day (light) | Night (dark) |
| --- | --- | --- | --- |
| Alpine | Cinematic landscape | Dawn: mist between mountain ridges, a mirror lake | Milky Way: the same lake under the stars |
| Seaside | Painterly | Summer afternoon: a hillside village above the sea | Moonlit: lit windows, fireflies, a full moon |
| Glass | Abstract | Pearl: iridescent glass ribbons on white | Obsidian: dark glass with teal and violet edges |
| Plaster | Moody minimal | Morning light: a soft shadow sweeping across plaster | Lamplight: a single warm lamp in the dark |

The art was AI-generated for this mod and is drawn as a **soft-focus scene**: each row of the picture becomes a smooth color gradient, and the rows fade into each other, like a wallpaper seen through frosted glass. The desktop app can't show photos behind the chat today: it leaves a still `image` backdrop blank, strips images embedded in a scene, and drops SVG filters such as blur. `scripts/art-to-scene.py <image> <out.svg>` turns any picture into one of these scenes.

## Pick a look

- `/look` opens the **Looks** pane with two dropdowns: look and mode.
- `/look alpine`, `/look seaside`, `/look glass`, `/look plaster` or `/look next` changes the look.
- `/look auto`, `/look light`, `/look dark` change the mode.
- `/look off` (or `/look reset`) removes the theme and gives the app its own look back, in this session and the next ones. Picking a look or a mode turns it back on.
- With [usage-bar](../../mods/usage-bar) installed, the same two dropdowns sit under its pills above the prompt.

Your choice is saved and comes back in every new session.

**Auto mode** uses the light version from 07:00 and the dark version from 19:00, local time. Change the hours in `/config` (theme-studio: *Light from*, *Dark from*), or with `pluginConfigs` in settings. The switch happens on time while a session is open.

## Where it works

| Claude Code surface | Supported |
| --- | :---: |
| Claude desktop app (Code tab) | ✅ |
| Claude mobile app | ✅ backdrop |
| Terminal (CLI) | `/look` works, but the terminal keeps its own `/theme` colors |
| VS Code extension panel | ❌ |

## Install

Requires Claude Code 2.1.324 or newer. Only one theme applies per session, so disable other `theme-*` mods while this one is on.

```bash
claude plugin marketplace add ravipatel7/claude-mods
claude plugin install theme-studio@claude-mods
```

## Update / uninstall

```bash
claude plugin update theme-studio@claude-mods
claude plugin uninstall theme-studio@claude-mods
```

## How it works

- `hooks/looks.ts` holds each look: two images and two palettes built with `makeColors`.
- `hooks/register.ts` applies the chosen variant with `$.theme.set` (a `scene` from `art/`, drawn by a `ui.render` hook on `Backdrop`) and puts the same palette in both the light and dark slots, so the variant shows whatever your OS mode is.
- In auto mode it schedules the next switch with `$.clock.after`.
- It publishes `{ plugin: 'theme-studio', key: 'current' }` in `$.state` for other mods (usage-bar) to read.
- To add a look, run `scripts/art-to-scene.py` on two pictures to add their scenes to `art/` (each must stay under 131,072 characters), append to `LOOKS`, then run `node scripts/check-themes.mjs` from the repo root.
