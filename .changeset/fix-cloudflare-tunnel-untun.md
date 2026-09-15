---
'@wolfstar/cli': patch
---

Fixed the `dev.tunnel` quick tunnel: it now opens the `cloudflared` tunnel through `untun` instead of spawning `cloudflared` directly and scraping its stdout for the URL with a regex. `untun` manages the `cloudflared` binary itself (downloading it if missing) and exposes the tunnel URL and lifecycle programmatically, which also fixes the tunnel never closing when spawning `cloudflared` failed silently.
