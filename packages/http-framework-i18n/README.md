# `@wolfstar/http-framework-i18n`

> [!WARNING]
> **This package is deprecated.** It has been replaced by
> [`@wolfstar/plugin-i18next`](https://www.npmjs.com/package/@wolfstar/plugin-i18next), an official plugin for
> [`@wolfstar/http-framework`](https://www.npmjs.com/package/@wolfstar/http-framework) living in
> [`wolfstar-project/plugins`](https://github.com/wolfstar-project/plugins/tree/main/packages/plugin-i18next).
> No further releases are planned here; please migrate — see [Migration](#migration) below, or the full
> [migration guide](https://stars-components.wolfstar.rocks/guide/migrating-to-plugin-i18next).

An internationalization layer powered by [`i18next`](https://www.npmjs.com/package/i18next) and [`@wolfstar/i18next-backend`](https://www.npmjs.com/package/@wolfstar/i18next-backend) for [`@wolfstar/http-framework`](https://www.npmjs.com/package/@wolfstar/http-framework).

## Usage

### Initialization

```typescript
import { addFormatters, init, load } from '@wolfstar/http-framework-i18n';

// Load the locales from a directory adjacent to the module:
await load(new URL('/locales', import.meta.url));

// Add formatters, those will be added in `i18next.services.formatter`:
addFormatters(
	{ name: 'uppercase', format: (value) => value.toUpperCase() }, //
	{ name: 'lowercase', format: (value) => value.toLowerCase() }
);

// Initialize backend, may take an object with the options:
// NOTE: The following properties are defined by the `load` method:
//       - `InitOptions.backend.paths`
//       - `InitOptions.ns`
//       - `InitOptions.preload`
//
// Furthermore, the following defaults are applied for convenience:
// - `InitOptions.initImmediate`: `false`
// - `InitOptions.interpolation.escapeValue`: `false`
// - `InitOptions.interpolation.skipOnVariables`: `false`
// - `InitOptions.ignoreJSONStructure`: `false`
//
// Passing the aforementioned properties in the options will override the library's defaults.
await init();
```

> **Note**: If you want to customize the options, please check [i18next's TypeScript guide](https://www.i18next.com/overview/typescript) to improve the experience.

### Definition

Generate type augmentations with [`@wolfstar/i18next-type-generator`](https://www.npmjs.com/package/@wolfstar/i18next-type-generator):

```bash
i18next-type-generator ./src/locales/en-US/ ./src/@types/i18next.d.ts
```

### Consumption

```typescript
import {
	getSupportedLanguageName,
	getSupportedUserLanguageName,
	getT,
	getSupportedLanguageT,
	getSupportedUserLanguageT
} from '@wolfstar/http-framework-i18n';

// Get the name of the supported guild language, falling back to the user's on DMs:
const guildLanguage = getSupportedLanguageName(interaction);

// Get the name of the supported user language:
const userLanguage = getSupportedUserLanguageName(interaction);

// Get the function to get a translated key:
const t = getT(guildLanguage, 'commands/shared');

// Resolving a given key, this calls `getT` and `getSupportedLanguageName` under the hood:
const content = getSupportedLanguageT(interaction, 'commands/shared')('invalidInput');

// Resolving a given key, this calls `getT` and `getSupportedUserLanguageName` under the hood:
const content = getSupportedUserLanguageT(interaction, 'commands/shared')('addResult', { left: 5, right: 10, result: 15 });
```

## Migration

`@wolfstar/plugin-i18next` drops this package's `T`/`FT` branded-key helpers in favour of i18next's native
TypeScript support: keys are plain strings, typed via a generated `declare module 'i18next'` augmentation
(the same approach this package already uses via [`@wolfstar/i18next-type-generator`](https://www.npmjs.com/package/@wolfstar/i18next-type-generator)).
It also replaces the manual `load()` + `init()` bootstrap with the `@wolfstar/http-framework` plugin lifecycle
and moves the loaded state onto `container.i18n`.

```bash
pnpm remove @wolfstar/http-framework-i18n
pnpm add @wolfstar/plugin-i18next
```

### Bootstrap

```diff
-import { addFormatters, init, load } from '@wolfstar/http-framework-i18n';
+import '@wolfstar/plugin-i18next/register';
 import { Client } from '@wolfstar/http-framework';

-await load(new URL('locales', import.meta.url));
-addFormatters(
-	{ name: 'uppercase', format: (value) => value.toUpperCase() },
-	{ name: 'lowercase', format: (value) => value.toLowerCase() }
-);
-await init();
-
-const client = new Client();
+const client = new Client({
+	i18n: {
+		// Optional, defaults to `<root>/languages`:
+		defaultLanguageDirectory: new URL('languages', import.meta.url).pathname,
+		defaultName: 'en-US',
+		formatters: [
+			{ name: 'uppercase', format: (value) => value.toUpperCase() },
+			{ name: 'lowercase', format: (value) => value.toLowerCase() }
+		]
+	}
+});
 await client.load();
```

The plugin's `preLoad` hook awaits `container.i18n.init()` **before** the stores load, so command builders can still be
localized at registration time.

### Keys and resolution

```diff
-import { FT, T } from '@wolfstar/http-framework-i18n';
-
-export const Success = T('commands/ping:success');
-export const SuccessWithLatency = FT<{ latency: number }>('commands/ping:successWithLatency');
+// No wrapper needed — keys are plain strings, typed by the generated `CustomTypeOptions` augmentation.
```

```diff
-const content = resolveKey(interaction, Success);
-const userContent = resolveUserKey(interaction, SuccessWithLatency, { latency: 42 });
+const content = getSupportedLanguageT(interaction, 'commands/ping:success');
+const userContent = getSupportedUserLanguageT(
+	interaction,
+	'commands/ping:successWithLatency',
+	{ latency: 42 }
+);
```

Omitting the key returns the bound `TFunction` instead, exactly like `getT` did before:

```ts
const t = getSupportedUserLanguageT(interaction);
const name = t('commands/ping:name');
```

### Exports

| Removed                                | Replacement                                                              |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `T(key)` / `FT<Args>(key)`             | The key itself, typed by the generated `CustomTypeOptions` augmentation  |
| `load(directory)`                      | `i18n.defaultLanguageDirectory` client option                            |
| `init(options)`                        | Handled by the plugin's `preLoad` hook; raw options go to `i18n.i18next` |
| `addFormatters(...formatters)`         | `i18n.formatters` client option                                          |
| `getT(locale)`                         | `container.i18n.getT(locale)`                                            |
| `resolveKey(target, key, options)`     | `getSupportedLanguageT(target, key, options)`                            |
| `resolveUserKey(target, key, options)` | `getSupportedUserLanguageT(target, key, options)`                        |

`getSupportedLanguageName`, `getSupportedUserLanguageName`, `getSupportedLanguageT`, `getSupportedUserLanguageT`,
`supportedLanguages`, `isSupportedDiscordLocale`, `getLocalizedData`, `applyNameLocalizedBuilder`,
`applyDescriptionLocalizedBuilder`, `applyLocalizedBuilder` and `createSelectMenuChoiceName` keep the same names —
only the module specifier changes (and `getSupportedLanguageT`/`getSupportedUserLanguageT` gain the direct
`(target, key, options)` overload shown above).

### Other changes

- Requires `@wolfstar/http-framework@^3.1.0` as a peer dependency.
- Bumps `i18next` from `^22` to `^25`; see the [i18next migration notes](https://www.i18next.com/misc/migration-guide).
- The locales directory defaults to `<root>/languages` instead of an explicit path passed to `load()`. The layout —
  one directory per language, every nested `.json` file a namespace — is unchanged.
