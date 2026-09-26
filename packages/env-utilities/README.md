<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/env-utilities

**Functional utilities for reading and parsing environment variables.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/env-utilities)](https://npmx.dev/package/@wolfstar/env-utilities)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/env-utilities)](https://npmx.dev/package/@wolfstar/env-utilities)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

Functional utilities for reading and parsing environmental variables, based on [Wolfstar](https://wolfstar.rocks)'s internal tools.

## Usage

### Setup

To setup `@wolfstar/env-utilities`, you use the `setup` function exported by the package:

```typescript
import { setup } from '@wolfstar/env-utilities';

// Finds src/.env* and .env* from the current project automatically.
setup();
```

Alternatively, if you do not need to provide any custom options you can import it as a side effect:

```typescript
import '@wolfstar/env-utilities/setup';
```

You can also pass a `string` or if you want to define other options, you may use `EnvSetupOptions`. Optionally, you may configure dotenv via environment variables:

- `DOTENV_DEBUG`: configures `EnvSetupOptions.debug`. If enabled, the library will log to help debug why certain keys or values are not being set as expected.
- `DOTENV_ENCODING`: configures `EnvSetupOptions.encoding`. If set, it will specify the encoding of the files containing the environment variables
- `DOTENV_ENV`: configures `EnvSetupOptions.env`. If set, it will specify a custom environment if `NODE_ENV` is not sufficient.
- `DOTENV_PATH`: configures `EnvSetupOptions.path`. If set, it will specify a custom path to the file containing environment variables, useful for when they are located elsewhere.
- `DOTENV_PREFIX`: configures `EnvSetupOptions.prefix`. If set, it will specify a required prefix for dotenv variables (e.g. `APP_`).

### What `.env` files can be used?

Every file below is searched first under `src/`, then at the project root. An explicit `path` or `DOTENV_PATH`
disables this discovery and uses that base path only.

- `.env`: Default.
- `.env.local`: Local overrides. This file is loaded for all environments except test.
- `.env.development`, `.env.test`, `.env.production`: Environment-specific settings.
- `.env.development.local`, `.env.test.local`, `.env.production.local`: Local overrides of environment-specific settings.

Files on the left have more priority than files on the right:

- `npm start`: `.env.development.local`, `.env.local`, `.env.development`, `.env`
- `npm test`: `.env.test.local`, `.env.test`, `.env` (note `.env.local` is missing)

[CRA Reference](https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used)

### Experimental: [varlock](https://varlock.dev) support

`@wolfstar/env-utilities` can optionally delegate environment variable resolution to
[varlock](https://varlock.dev), a schema-based alternative to `dotenv` with built-in validation, type-safety, and
secret protection. Support for it is **experimental**.

To use it, first set up varlock in your project (`npx varlock init`) and install the optional `varlock` package, then
opt in via the `loader` option or the `DOTENV_LOADER` environment variable:

```typescript
import { setup } from '@wolfstar/env-utilities';

setup({ loader: 'varlock' });
```

```
DOTENV_LOADER=varlock
```

When `loader: 'varlock'` is set, varlock resolves your checked-in `.env.schema` (with its own `.env*` file discovery
and validation) and injects the result into `process.env`; the dotenv-specific options above (`encoding`, `path`,
`env`) are ignored in favour of the schema. `prefix` still applies to the resolved variables.

### Typing Environment Variables

To add new entries, you augment `Env` from `@wolfstar/env-utilities/dist/lib/types` using any of the following types:

- `BooleanString`: can be parsed with `envParseBoolean`.
- `IntegerString`: can be parsed with `envParseInteger`.
- `NumberString`: can be parsed with `envParseNumber`.
- `string`: can be parsed with `envParseString` and `envParseArray`.

The above 5 functions will throw an `ReferenceError` instance if a key is missing (unless a default is passed in the second parameter) as well as a `TypeError` instance if a key could not be parsed. The default value is returned as-is and is not validated.

An example of adding more keys is as it follows:

```typescript
import type { BooleanString, IntegerString, NumberString } from '@wolfstar/env-utilities';

declare module '@wolfstar/env-utilities' {
	interface Env {
		// Accepts 'true' or 'false':
		ENABLE_TELEMETRY: BooleanString;

		// Accepts any integer, e.g. '10':
		REFRESH_INTERVAL: IntegerString;

		// Accepts any number, e.g. '1.5':
		MINIMUM_SPEED: NumberString;

		// Accepts any string:
		APPLICATION_SECRET: string;
	}
}
```
