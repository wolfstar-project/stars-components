# with-i18n

Full [`@wolfstar/plugin-i18next`](https://www.npmjs.com/package/@wolfstar/plugin-i18next) flow: the `i18n` client
option, `applyLocalizedBuilder`, `getSupportedUserLanguageT`, and locale JSON under
`src/locales/{{lng}}/{{ns}}.json`.

Ships `en-US` and `es-ES`. Change your Discord client language (or the guild preferred
locale) to see `/greet` switch.

```bash
cp .env.example src/.env
pnpm --filter with-i18n dev
```

The plugin is activated by the `stars` CLI (it is a runtime dependency with a `register` entry) and by
`@wolfstar/shared-http-pieces/register`; its `preLoad` hook initializes i18next before the commands are localized.
