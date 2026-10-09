---
'@wolfstar/schema': minor
'@wolfstar/cli': minor
---

Add ngrok as a second `dev.tunnel` provider. `dev.tunnel: { provider: 'ngrok' }` opens the tunnel through ngrok's official Node SDK instead of a `cloudflared` quick tunnel, and `dev.tunnel.domain` binds a domain reserved in your ngrok account so the hostname survives restarts. `cloudflared` stays the default, so `tunnel: true` and every existing configuration behave as before. `@ngrok/ngrok` is an optional peer dependency that the CLI loads from the project only when the provider is used; the authtoken is read from `NGROK_AUTHTOKEN` in the environment or the project's `.env`. `provider` and `domain` are rejected next to a `url` you already serve, and `domain` without the `ngrok` provider, with the new `TUNNEL_OPTION_CONFLICT` diagnostic. The `t` key, `--tunnel`, `stars info` and `stars doctor` use and report the configured provider, and `stars doctor` checks that the package and the authtoken are present. `@wolfstar/schema` also exports `TUNNEL_PROVIDERS` and `DEFAULT_TUNNEL_PROVIDER`, and `ResolvedTunnelConfig` quick mode now carries `provider` and `domain`.
