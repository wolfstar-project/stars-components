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

### With the `stars` CLI

A bot built with the `stars` CLI (`@wolfstar/cli`, compatibility version 5) does not call `setup()` itself: the
`env` option of `stars.config` mirrors `EnvSetupOptions`, and `stars` calls `setup()` with it before any module of the
bot runs. Do not call it by hand as well. Options set in `stars.config` win over the `DOTENV_*` variables above, the
same way options passed to `setup()` do. See `env` in the
[`@wolfstar/http-framework` README](../http-framework#environment-env).

```typescript
// stars.config.ts
export default defineConfig({
	env: { prefix: 'BOT_' }
});
```

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

To use it, first set up varlock in your project (`npx varlock init`) and install the optional `varlock` package.
`setup()` then picks it by itself when the project has a schema: a `src/.env.schema` (looked up first, like `src/.env*`),
a `.env.schema` at the project root, or a `varlock.loadPath` in `package.json`. An explicit `path` or `DOTENV_PATH` keeps
the dotenv loader, and the `loader` option and the `DOTENV_LOADER` environment variable always have the last word:

```typescript
import { setup } from '@wolfstar/env-utilities';

setup({ loader: 'varlock' }); // or { loader: 'dotenv' } to keep dotenv next to a schema
```

```
DOTENV_LOADER=varlock
```

When `loader: 'varlock'` is set, varlock resolves your checked-in `.env.schema` (with its own `.env*` file discovery and
validation) by running `varlock load --format json-full`, and the result is injected into `process.env`:

- `path` and `env` are passed to varlock as `--path` and `--env`; `encoding` is ignored in favour of the schema.
- `prefix` still applies to the returned `parsed` map, which holds exactly the variables the schema resolved (as strings,
  `@internal` items left out), including those that equal a value `process.env` already held.
- An invalid schema makes `setup()` throw an `Error` carrying varlock's summary, the same way the dotenv loader throws on
  an unreadable file, instead of exiting the process.
- Varlock's runtime redaction and leak detection are not part of the CLI. Add `import 'varlock/auto-load'` to opt into
  them.
- `path` and `env` cannot contain whitespace (varlock's CLI helper splits its command on spaces), except that `path` may
  be a directory with whitespace in its name.

### Typing Environment Variables

To add new entries, you augment `Env` from `@wolfstar/env-utilities/dist/lib/types` using any of the following types:

- `BooleanString`: can be parsed with `envParseBoolean`.
- `IntegerString`: can be parsed with `envParseInteger`.
- `NumberString`: can be parsed with `envParseNumber`.
- `string`: can be parsed with `envParseString`.
- `ArrayString`: can be parsed with `envParseArray`. A plain `string` key is not accepted by `envParseArray`, declare the key as `ArrayString` instead.

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

#### With a varlock schema

With [varlock](#experimental-varlock-support), the `.env.schema` is the source of truth and `@generateTsTypes` writes
the typings (`CoercedEnvSchema`, `EnvSchemaAsStrings`, ...). Instead of declaring every variable a second time in `Env`,
derive it from the generated `CoercedEnvSchema` with `EnvFromVarlock`:

```typescript
// env.d.ts is generated by varlock and exports `CoercedEnvSchema`
import type { CoercedEnvSchema } from './env';
import type { EnvFromVarlock } from '@wolfstar/env-utilities/varlock';

declare module '@wolfstar/env-utilities' {
	interface Env extends EnvFromVarlock<CoercedEnvSchema> {}
}
```

`EnvFromVarlock` is also exported from the package root. It maps:

- `boolean` to `BooleanString`, so `envParseBoolean` accepts the key.
- `number` to a string that is both an `IntegerString` and a `NumberString`: the coerced type cannot tell an integer from a
  float (and `port` is a number), so both `envParseInteger` and `envParseNumber` accept the key. `envParseInteger` throws at
  runtime when a decimal-capable key holds `1.5`: use `envParseNumber` for those.
- `string` and `enum` to their string form, so `envParseString` accepts the key. An enum whose values look like a number or
  a boolean (`'1' | '2'`) is widened with `string`, so it stays a string key.
- optional keys to optional keys.
- anything else, like an `array`, to a plain `string`.

`NODE_ENV` is left out: `Env` keeps declaring it as `'test' | 'development' | 'production'`, so a schema with a narrower
`NODE_ENV` still compiles.

Varlock serializes an `array` with its own separator (`,` by default), while `envParseArray` splits on spaces and needs an
`ArrayString` key. Read such a variable through the `ENV` object of `varlock/env` (already an array) or declare the key as `ArrayString` by hand.
