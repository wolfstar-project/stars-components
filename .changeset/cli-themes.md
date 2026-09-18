---
'@wolfstar/cli': minor
---

`stars dev` now has colour themes, like Claude Code. Press `T` in the interactive UI to preview and pick `dark`, `light`, the colour-blind friendly `dark-daltonized`/`light-daltonized`, the terminal-palette-only `dark-ansi`/`light-ansi`, or `auto` (follows the terminal background). The choice is saved to `~/.config/stars/preferences.json` (`$XDG_CONFIG_HOME`, `%APPDATA%` or `$STARS_CONFIG_DIR`). `--theme <name>` and `STARS_THEME` override the saved theme for one run. The UI now paints with semantic theme colours, so body text keeps the terminal's own foreground and stays readable on light backgrounds.
