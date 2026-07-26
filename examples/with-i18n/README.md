# with-i18n

Uses `@wolfstar/http-framework-i18n` to reply with locale-aware strings. Locale files live under `src/locales/{{lng}}/{{ns}}.json`.

## Setup

```bash
cp .env.example .env
pnpm --filter with-i18n dev
```

Switch your Discord client language (or guild preferred locale) between English and Spanish to see `/ping` change.

The create CLI `--i18n` flag only adds the dependency; this example shows the full `load` → `init` → `resolveUserKey` flow.
