---
'@wolfstar/shared-http-pieces': major
---

chore: migrate i18n from `@wolfstar/http-framework-i18n` to `@wolfstar/plugin-i18next`

**Breaking:** this package no longer self-registers its bundled locales. `@wolfstar/plugin-i18next`
has no incremental directory-registration API, so `src/register.ts` now exports `localesPath`
instead of loading it as a side effect. Consuming apps must add it to their `Client`'s i18n config:

```typescript
import { localesPath } from '@wolfstar/shared-http-pieces/register';

new Client({
	i18n: {
		backend: { paths: [localesPath] }
	}
});
```

Without this, the `commands/shared:*` strings (used by the shared `/info` command) fall back to
their raw keys instead of the bundled text.
