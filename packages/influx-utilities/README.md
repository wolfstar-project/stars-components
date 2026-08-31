<div align="center">
  <picture>
    <img src="https://cdn.wolfstar.rocks/assets/stars-components/wordmark.webp" alt="Stars Components" width="440" />
  </picture>

# @wolfstar/influx-utilities

**A tiny opinionated abstraction layer for InfluxDB single-organization access.**

[![version](https://npmx.dev/api/registry/badge/version/@wolfstar/influx-utilities)](https://npmx.dev/package/@wolfstar/influx-utilities)
[![downloads](https://npmx.dev/api/registry/badge/downloads/@wolfstar/influx-utilities)](https://npmx.dev/package/@wolfstar/influx-utilities)
[![license](https://img.shields.io/github/license/wolfstar-project/stars-components?style=flat-square&color=informational)](https://github.com/wolfstar-project/stars-components/blob/main/LICENSE)

</div>

## Description

A tiny opinionated abstraction layer for InfluxDB for interacting with a single organization, based on [Wolfstar](https://wolfstar.rocks)'s internal tools.

## Usage

You can provide the configuration for the Influx client in several ways.

- `INFLUX_URL`: `ConnectionOptions.url`, the base URL to be used.
- `INFLUX_TOKEN`: `ConnectionOptions.token`, the authentication token.
- `INFLUX_ORG`: `ConnectionOptions.org`, the organization to use for the query and write APIs.
- `INFLUX_BUCKET`: `ConnectionOptions.writeBucket`, the bucket to write to in the write API.

### Environment Variables

```typescript
// index.ts
process.env.INFLUX_URL = 'https://influxdb.wolfstar.rocks';
process.env.INFLUX_TOKEN = 'my-secret-token';
process.env.INFLUX_ORG = 'Wolfstar-Project';
process.env.INFLUX_BUCKET = 'analytics';

import { Client } from '@wolfstar/influx-utilities';

const client = new Client();
```

### `setInfluxVariables`

```typescript
// index.ts
import { Client, setInfluxVariables } from '@wolfstar/influx-utilities';

setInfluxVariables({
	influxUrl: 'https://influxdb.wolfstar.rocks',
	influxToken: 'my-secret-token',
	influxOrg: 'Wolfstar-Project',
	influxBucket: 'analytics'
});

const client = new Client();
```

### Directly through `Client.Options`

```typescript
import { Client } from '@wolfstar/influx-utilities';

const client = new Client({
	url: 'https://influxdb.wolfstar.rocks',
	token: 'my-secret-token',
	org: 'Wolfstar-Project',
	writeBucket: 'analytics'
});
```
