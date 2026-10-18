---
'@wolfstar/cli': minor
'@wolfstar/schema': minor
---

Add configurable Nuxt-style, dashboard and plain dev output, with `tui.style` and `--style` while preserving `dev.layout`.

Check local development ports before startup and offer interactive continue, cancel or next-port choices. Add `--port` and configurable conflict policies for automation, synchronize the chosen runtime port, validate HTTP endpoints and dev listener ports, and report unwritable development directories before building.

Keep explicit display/health URLs independent of the bot listener, preserve them across port overrides, and ignore unrelated ambient PORT values in framework mode. Infer Nitro runtime ports from NITRO_PORT before PORT.
