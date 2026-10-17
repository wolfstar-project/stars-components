---
'@wolfstar/cli': patch
---

The `stars dev` dashboard no longer blinks: Ink now repaints only the lines that changed instead of erasing and rewriting the whole screen on every tick (a second of build clock went from about 18 KB written to about 1.5 KB). Switching between the dashboard, the panel and the overlays redraws the whole screen once, so nothing is left blank in the new buffer.
