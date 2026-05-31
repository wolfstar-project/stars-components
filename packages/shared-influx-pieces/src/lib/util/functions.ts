import { container } from '@wolfstar/http-framework';

export function isInfluxInitialized() {
	return Boolean(container.influx);
}
