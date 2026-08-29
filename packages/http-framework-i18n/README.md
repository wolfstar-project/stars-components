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

### Definition

```typescript
import { T, FT } from '@wolfstar/http-framework-i18n';

export const InvalidInput = T('path/to/file:invalidInput');
export const AddResult = FT<{ left: number; right: number; result: number }>('path/to/file:addResult');
```

### Consumption

```typescript
import { getSupportedLanguageName, getSupportedUserLanguageName, getT, resolveKey, resolveUserKey } from '@wolfstar/http-framework-i18n';

// Get the name of the supported guild language, falling back to the user's on DMs:
const guildLanguage = getSupportedLanguageName(interaction);

// Get the name of the supported user language:
const userLanguage = getSupportedUserLanguageName(interaction);

// Get the function to get a translated key:
const t = getT(guildLanguage);

// Resolving a given key, this calls `getT` and `getSupportedLanguageName` under the hood:
const content = resolveKey(interaction, InvalidInput);

// Resolving a given key, this calls `getT` and `getSupportedUserLanguageName` under the hood:
const content = resolveUserKey(interaction, AddResult, { left: 5, right: 10, result: 15 });
```

## Migration

`@wolfstar/plugin-i18next` keeps the same typed-key philosophy (`T` / `FT`, `resolveKey`, `applyLocalizedBuilder`), but
replaces the manual `load()` + `init()` bootstrap with the `@wolfstar/http-framework` plugin lifecycle and moves the
loaded state onto `container.i18n`.

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

### Exports

`T`, `FT`, `resolveKey`, `resolveUserKey`, `getSupportedLanguageName`, `getSupportedUserLanguageName`,
`getSupportedLanguageT`, `getSupportedUserLanguageT`, `supportedLanguages`, `isSupportedDiscordLocale`,
`getLocalizedData`, `applyNameLocalizedBuilder`, `applyDescriptionLocalizedBuilder`, `applyLocalizedBuilder` and
`createSelectMenuChoiceName` keep the same names and signatures — only the module specifier changes.

| Removed                        | Replacement                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `load(directory)`              | `i18n.defaultLanguageDirectory` client option                                |
| `init(options)`                | Handled by the plugin's `preLoad` hook; raw options go to `i18n.i18next`     |
| `addFormatters(...formatters)` | `i18n.formatters` client option                                              |
| `getT(locale)`                 | `container.i18n.getT(locale)`                                                |
| `loadedLocales`                | `container.i18n.languages` (a `Map<string, TFunction>`)                      |
| `loadedNamespaces`             | `container.i18n.namespaces`                                                  |
| `loadedPaths`                  | Derived from `i18n.defaultLanguageDirectory`; extra paths via `i18n.backend` |
| `loadedFormatters`             | `container.i18n.options.formatters`                                          |
| `Formatter`                    | `I18nextFormatter`                                                           |

The plugin also adds `fetchLanguage` / `fetchT` / `fetchKey` (asynchronous helpers honouring a custom
`container.i18n.fetchLanguage` hook), `createLocalizedChoice`, and chokidar-based hot reloading.

### Other changes

- Requires `@wolfstar/http-framework@^3.1.0` as a peer dependency.
- Bumps `i18next` from `^22` to `^25`; see the [i18next migration notes](https://www.i18next.com/misc/migration-guide).
- The locales directory defaults to `<root>/languages` instead of an explicit path passed to `load()`. The layout —
  one directory per language, every nested `.json` file a namespace — is unchanged.
