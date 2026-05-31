# `@wolfstar/shared-influx-pieces`

The shared influx pieces used in ArchId Network's HTTP-only bots.

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
