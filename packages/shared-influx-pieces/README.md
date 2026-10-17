<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/shared-influx-pieces

**The shared InfluxDB pieces used by Star Network's HTTP-only bots.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/shared-influx-pieces)](https://npmx.dev/package/@wolfstar/shared-influx-pieces)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/shared-influx-pieces)](https://npmx.dev/package/@wolfstar/shared-influx-pieces)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

The shared influx pieces used in Star Network's HTTP-only bots.

## As a module

Instead of importing `register`, list the package in `modules` in `stars.config` (it needs `@wolfstar/kit`, an
optional peer dependency):

```ts
// stars.config.ts
import { defineConfig } from '@wolfstar/http-framework/config';

export default defineConfig({ modules: ['@wolfstar/shared-influx-pieces'] });
```

The module registers the `@wolfstar/shared-influx-pieces/plugin` plugin, which does what `register` does: it creates
`container.influx` (and loads the listeners) when `INFLUX_ENABLED` is not `false` and the credentials below are set.
The environment is loaded before the module's plugins run. Use one of the two, not both.

## Usage

You can either register after setting the environment parameters:

```typescript
process.env.INFLUX_URL = 'https://influxdb.wolfstar.rocks';
process.env.INFLUX_TOKEN = 'my-secret-token';
process.env.INFLUX_ORG = 'Wolfstar-Project';
process.env.INFLUX_BUCKET = 'analytics';

import '@wolfstar/shared-influx-pieces/register';
```

Or register manually:

```typescript
import { container } from '@wolfstar/http-framework';
import { InfluxClient } from '@wolfstar/shared-influx-pieces';

container.influx = new InfluxClient({
	url: 'https://influxdb.wolfstar.rocks',
	token: 'my-secret-token',
	org: 'Wolfstar-Project',
	writeBucket: 'analytics'
});
```

> [!IMPORTANT]
> In order to manual registering to work as intended, you must register the instance in `container.influx` as shown above.
