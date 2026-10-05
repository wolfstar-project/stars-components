---
'@wolfstar/cli': patch
---

Fix `stars dev` crashing with an unhandled `cloudflared exited (code=0, ...) before URL was ready` error when the tunnel closes (for example on Ctrl+C). `untun` leaves a connection promise unhandled when cloudflared exits, so the CLI now guards against that one error while the tunnel exists, removes the signal listeners `untun` installs so shutdown goes through `DevService#stop()`, and no longer reports a requested close as a tunnel failure.
