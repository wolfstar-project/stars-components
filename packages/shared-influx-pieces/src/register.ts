import { envParseBoolean } from '@wolfstar/env-utilities';
import { container } from '@wolfstar/http-framework';
import { areInfluxCredentialsSet } from '@wolfstar/influx-utilities';
import { InfluxClient } from './index.js';

if (envParseBoolean('INFLUX_ENABLED', true) && areInfluxCredentialsSet()) {
	container.influx = new InfluxClient();
}
