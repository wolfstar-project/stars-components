---
'@wolfstar/cli': patch
---

`stars dev --tunnel` no longer fails on every run when the `cloudflared` binary `untun` downloaded is broken (a download that stopped half way, or a file without the execute bit). The CLI now deletes that file from `untun`'s download directory, logs a warning and opens the tunnel again, once per run.
