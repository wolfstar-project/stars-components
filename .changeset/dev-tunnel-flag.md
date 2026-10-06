---
'@wolfstar/cli': minor
---

Add `stars dev --tunnel` to open the public tunnel at start whatever `dev.tunnel` says (a `cloudflared` quick tunnel when it is off), and `--no-tunnel` to keep it closed at start even when `dev.tunnel` enables it. It works with `--no-tui`, where there is no `t` key: the URL is printed on the `tunnel` channel.
