import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadStarsConfig } from '@wolfstar/stars-config';
import { Locales } from '../src/utils/locales.js';
import { createFixture, waitFor, type Fixture } from './helpers.js';

describe('Locales', () => {
	let fixture: Fixture;
	let locales: Locales;

	afterEach(async () => {
		await locales?.close();
		await fixture?.cleanup();
	});

	test('copies src/locales to the build output and keeps it updated in dev', async () => {
		fixture = await createFixture({ 'src/main.ts': '', 'src/locales/en-US/app.json': '{"hello":"world"}' });
		const config = await loadStarsConfig({ cwd: fixture.root, env: {} });
		locales = new Locales(config);

		expect(locales.copy()).toBe(true);
		const output = join(fixture.root, 'dist', 'locales', 'en-US', 'app.json');
		expect(readFileSync(output, 'utf8')).toBe('{"hello":"world"}');

		await locales.watch();
		writeFileSync(join(fixture.root, 'src', 'locales', 'en-US', 'app.json'), '{"hello":"stars"}');
		await waitFor(() => existsSync(output) && readFileSync(output, 'utf8') === '{"hello":"stars"}');
	});
});
