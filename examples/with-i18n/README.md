# with-i18n

Full `http-framework-i18n` flow used by teryl/staryl: `LanguageKeys` with `T`/`FT`,
`applyLocalizedBuilder`, and locale JSON under `src/locales/{{lng}}/{{ns}}.json`.

Ships `en-US` and `es-ES`. Change your Discord client language (or the guild preferred
locale) to see `/greet` switch.

```bash
cp .env.example src/.env
pnpm --filter with-i18n dev
```

The create CLI `--i18n` flag only adds the dependency; this example shows the real
`load` → `init` → `resolveUserKey` path used in production bots.
