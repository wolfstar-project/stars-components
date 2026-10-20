---
'@wolfstar/cli': minor
'@wolfstar/vite-server': patch
'@wolfstar/nitro-server': patch
---

Add `stars dev --host [address]` and the `-p` alias for `--port`, as Nuxt's dev command has them. `--host` sets the address the application listens on (`HTTP_ADDRESS`, plus `NITRO_HOST`/`HOST` for Nitro), a bare `--host` listens on every interface, the occupied-port check probes that address, and an inferred display URL follows a concrete one. The Vite and Nitro dev servers bind to the address from `dev.env` before falling back to the hostname of `dev.url`.
