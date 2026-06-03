export { InfluxDB, Point, type QueryApi, type WriteApi, type WritePrecisionType } from '@influxdata/influxdb-client';
export * from './lib/Client.js';
export { type ConnectionOptions } from './lib/types.js';
export { areInfluxCredentialsSet, setInfluxVariables } from './lib/variables.js';

declare module '@wolfstar/env-utilities' {
	interface Env {
		INFLUX_URL?: string;
		INFLUX_ORG?: string;
		INFLUX_TOKEN?: string;
		INFLUX_BUCKET?: string;
	}
}
